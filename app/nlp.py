"""
RoboDad NLP pipeline (from the CONL725 submission, upgraded for the web).

What it does for every message:
  1. normalise the text (same rules as the original chat.py)
  2. classify the intent with TF-IDF (words + character n-grams) and
     Logistic Regression, trained on the original data plus extra
     hand-written examples (data/augmented_utterances.csv)
  3. retrieve the most similar examples from the RoboDad dataset (used to
     ground the LLM in RoboDad's voice: a small retrieval-augmented setup)
  4. score sentiment with VADER
  5. pull out simple entities with regex NER

The classifier is trained when the server starts (about a second on 981 rows)
instead of being loaded from .joblib files, so it can never break because the
hosting machine has a different scikit-learn version.
"""

from __future__ import annotations

import csv
import hashlib
import logging
import os
import random
import re
import unicodedata
from dataclasses import dataclass, field

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import FeatureUnion, Pipeline, make_pipeline
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

import joblib
import sklearn

log = logging.getLogger("robodad")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "data", "robodad_intents.csv")
AUGMENTED_PATH = os.path.join(BASE_DIR, "data", "augmented_utterances.csv")
# Teen topics added for the app-store version (first jobs, life after high
# school, relationships, peer pressure, budgeting, driving, home basics).
# Kept in a separate file so the original CONL725 dataset stays unchanged.
TEEN_PATH = os.path.join(BASE_DIR, "data", "teen_intents.csv")

# Topics folded together for a teen audience
INTENT_MERGES = {
    "life_skill_snacks": "life_skill_food",
    "life_skill_breakfast": "life_skill_food",
    "life_skill_lightbulb": "life_skill_home",
}
MODEL_CACHE = os.path.join(BASE_DIR, "models", "intent_model.joblib")

# Below this confidence the classifier says "not sure" (fallback). Tuned with
# scripts/evaluate.py: at 0.40 the model answers ~79% of messages and is right
# ~77% of the time when it does (the CONL725 model answered 29% at 79%).
FALLBACK_THRESHOLD = 0.40

FALLBACK_RESPONSES = [
    "I'm not totally sure what you mean, kiddo, but I'm here for you.",
    "Hmm… I might need you to say that a different way.",
    "I'm listening, even if I didn't quite catch that.",
]


def normalize(text: str) -> str:
    """Unicode → ASCII, drop apostrophes, lowercase (matches the original)."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.replace("'", "")
    return text.lower().strip()


def extract_entities(text: str) -> list[dict]:
    entities: list[dict] = []
    # Skip the first word of a sentence and "I" so we don't tag every capital.
    for m in re.finditer(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-z]+)\b", text):
        entities.append({"text": m.group(1), "label": "PROPER_NOUN"})
    for d in re.findall(r"\b\d{1,2}/\d{1,2}(?:/\d{2,4})?\b", text):
        entities.append({"text": d, "label": "DATE"})
    for t in re.findall(r"\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b", text, re.I):
        entities.append({"text": t, "label": "TIME"})
    for money in re.findall(r"\$\s?\d+(?:\.\d{2})?", text):
        entities.append({"text": money, "label": "MONEY"})
    taken = " ".join(e["text"] for e in entities)
    for n in re.findall(r"\b\d+\b", text):
        if not re.search(rf"(?<!\d){n}(?!\d)", taken):
            entities.append({"text": n, "label": "NUMBER"})
    return entities


def build_classifier() -> Pipeline:
    """Word n-grams catch phrases ("tie a tie"); character n-grams catch typos,
    slang and word endings ("hungryyy", "studyin"). Stop words are kept because
    short messages like "how do i" or "im" carry most of their meaning in them."""
    return make_pipeline(
        FeatureUnion([
            ("words", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
            ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True)),
        ]),
        LogisticRegression(max_iter=3000, C=10),
    )


def load_augmented(exclude: set[str], path: str = AUGMENTED_PATH) -> tuple[list[str], list[str]]:
    """Extra training-only examples, minus any that duplicate an original one."""
    if not os.path.exists(path):
        return [], []
    texts, labels = [], []
    with open(path, encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            t = normalize(r["user_utterance"])
            if t and t not in exclude:
                texts.append(t)
                labels.append(INTENT_MERGES.get(r["intent"], r["intent"]))
    return texts, labels


@dataclass
class Analysis:
    intent: str
    confidence: float
    sentiment: dict
    entities: list[dict]
    examples: list[dict] = field(default_factory=list)
    top_intent: str = ""  # best guess even when below the fallback threshold

    @property
    def is_fallback(self) -> bool:
        return self.intent == "fallback"

    def to_dict(self) -> dict:
        return {
            "intent": self.intent,
            "confidence": round(float(self.confidence), 3),
            "sentiment": self.sentiment,
            "entities": self.entities,
            "examples": self.examples,
            "top_intent": self.top_intent or self.intent,
        }


class RoboDadNLP:
    def __init__(self, dataset_paths: tuple[str, ...] = (DATASET_PATH, TEEN_PATH)):
        self.rows = []
        for path in dataset_paths:
            if not os.path.exists(path):
                continue
            with open(path, encoding="utf-8", newline="") as f:
                for r in csv.DictReader(f):
                    r["intent"] = INTENT_MERGES.get(r["intent"], r["intent"])
                    self.rows.append(r)

        self.utterances = [normalize(r["user_utterance"]) for r in self.rows]
        self.labels = [r["intent"] for r in self.rows]

        self.responses: dict[str, list[str]] = {}
        for r in self.rows:
            self.responses.setdefault(r["intent"], []).append(r["bot_response"])

        self.model = self._load_or_train()

        # A second, stop-word-free vectorizer for retrieval: short phrases like
        # "how do i" carry meaning when we look for similar examples.
        self.retriever = TfidfVectorizer(lowercase=True, ngram_range=(1, 2), sublinear_tf=True)
        self.R = self.retriever.fit_transform(self.utterances)

        self.sia = SentimentIntensityAnalyzer()

    def _fingerprint(self) -> str:
        h = hashlib.sha256(sklearn.__version__.encode())
        for path in (DATASET_PATH, TEEN_PATH, AUGMENTED_PATH, __file__):
            if os.path.exists(path):
                with open(path, "rb") as f:
                    h.update(f.read())
        return h.hexdigest()

    def _load_or_train(self) -> Pipeline:
        """Load the model trained at build time; retrain if data or code changed.

        The cache is only ever written by this app inside its own container, so
        loading it is safe and always matches the installed scikit-learn.
        """
        fp = self._fingerprint()
        try:
            cached = joblib.load(MODEL_CACHE)
            if cached.get("fingerprint") == fp:
                return cached["model"]
        except Exception:
            pass
        aug_texts, aug_labels = load_augmented(set(self.utterances))
        model = build_classifier().fit(self.utterances + aug_texts, self.labels + aug_labels)
        try:
            os.makedirs(os.path.dirname(MODEL_CACHE), exist_ok=True)
            joblib.dump({"fingerprint": fp, "model": model}, MODEL_CACHE)
        except OSError as exc:
            log.info("Couldn't cache the model (%s); it will retrain next start.", exc)
        return model

    @property
    def intents(self) -> list[str]:
        return sorted(self.responses)

    def classify(self, text: str) -> tuple[str, float]:
        probs = self.model.predict_proba([normalize(text)])[0]
        i = int(probs.argmax())
        return str(self.model.classes_[i]), float(probs[i])

    def retrieve(self, text: str, k: int = 4, min_sim: float = 0.12) -> list[dict]:
        sims = cosine_similarity(self.retriever.transform([normalize(text)]), self.R)[0]
        out, seen = [], set()
        for i in sims.argsort()[::-1][: k * 4]:
            if sims[i] < min_sim or len(out) >= k:
                break
            r = self.rows[i]
            key = normalize(r["user_utterance"])
            if key in seen:
                continue
            seen.add(key)
            out.append({
                "intent": r["intent"],
                "user": r["user_utterance"],
                "robodad": r["bot_response"],
                "similarity": round(float(sims[i]), 3),
            })
        return out

    def analyse(self, text: str) -> Analysis:
        top, conf = self.classify(text)
        intent = "fallback" if conf < FALLBACK_THRESHOLD else top
        return Analysis(
            top_intent=top,
            intent=intent,
            confidence=conf,
            sentiment=self.sia.polarity_scores(text),
            entities=extract_entities(text),
            examples=self.retrieve(text),
        )

    def classic_reply(self, analysis: Analysis) -> str:
        """The original RoboDad behaviour, used when no LLM is available."""
        if analysis.is_fallback:
            # Retrieval can still rescue phrasing the classifier wasn't sure about
            if analysis.examples and analysis.examples[0]["similarity"] >= 0.45:
                return analysis.examples[0]["robodad"]
            return random.choice(FALLBACK_RESPONSES)
        same_intent = [e for e in analysis.examples if e["intent"] == analysis.intent]
        if same_intent and same_intent[0]["similarity"] >= 0.45:
            return same_intent[0]["robodad"]
        return random.choice(self.responses[analysis.intent])
