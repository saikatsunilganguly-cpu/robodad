"""
Measure the intent classifier with 5-fold cross-validation.

    python scripts/evaluate.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402
from sklearn.model_selection import StratifiedKFold, cross_val_score  # noqa: E402
from sklearn.pipeline import make_pipeline  # noqa: E402

from app.nlp import RoboDadNLP  # noqa: E402

nlp = RoboDadNLP()
pipe = make_pipeline(
    TfidfVectorizer(lowercase=True, stop_words="english", ngram_range=(1, 2)),
    LogisticRegression(max_iter=2000),
)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(pipe, nlp.utterances, nlp.labels, cv=cv, scoring="accuracy")
print(f"{len(nlp.rows)} examples, {len(nlp.intents)} intents")
print(f"5-fold accuracy: {scores.mean():.1%} (± {scores.std():.1%})")
print(f"Majority-class baseline: {max(nlp.labels.count(i) for i in nlp.intents) / len(nlp.labels):.1%}")
