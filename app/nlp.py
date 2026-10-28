"""
RoboDad NLP pipeline (from the CONL725 submission, upgraded for the web).

What it does for every message:
  1. normalise the text (same rules as the original chat.py)
  2. classify the intent with TF-IDF + Logistic Regression
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
import os
import random
import re
import unicodedata
from dataclasses import dataclass, field

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "data", "robodad_intents.csv")

FALLBACK_THRESHOLD = 0.20

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


@dataclass
class Analysis:
    intent: str
    confidence: float
    sentiment: dict
    entities: list[dict]
    examples: list[dict] = field(default_factory=list)

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
        }


class RoboDadNLP:
    def __init__(self, dataset_path: str = DATASET_PATH):
        with open(dataset_path, encoding="utf-8", newline="") as f:
            self.rows = [r for r in csv.DictReader(f)]

        self.utterances = [normalize(r["user_utterance"]) for r in self.rows]
        self.labels = [r["intent"] for r in self.rows]

        self.responses: dict[str, list[str]] = {}
        for r in self.rows:
            self.responses.setdefault(r["intent"], []).append(r["bot_response"])

        # Same configuration as train_intent_model.py
        self.vectorizer = TfidfVectorizer(lowercase=True, stop_words="english", ngram_range=(1, 2))
        self.X = self.vectorizer.fit_transform(self.utterances)
        self.model = LogisticRegression(max_iter=2000)
        self.model.fit(self.X, self.labels)

        # A second, stop-word-free vectorizer for retrieval: short phrases like
        # "how do i" carry meaning when we look for similar examples.
        self.retriever = TfidfVectorizer(lowercase=True, ngram_range=(1, 2), sublinear_tf=True)
        self.R = self.retriever.fit_transform(self.utterances)

        self.sia = SentimentIntensityAnalyzer()

    @property
    def intents(self) -> list[str]:
        return sorted(self.responses)

    def classify(self, text: str) -> tuple[str, float]:
        probs = self.model.predict_proba(self.vectorizer.transform([normalize(text)]))[0]
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
        intent, conf = self.classify(text)
        if conf < FALLBACK_THRESHOLD:
            intent = "fallback"
        return Analysis(
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
