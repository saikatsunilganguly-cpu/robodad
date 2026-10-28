"""
Compare intent-classifier set-ups with 5-fold cross-validation.

    python scripts/evaluate.py

Every set-up is tested ONLY on the original RoboDad examples. The extra
examples in data/augmented_utterances.csv are added to the training folds
only, and any that exactly match an original example are dropped first, so no
test sentence can leak into training.
"""
import csv
import os
import sys

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402
from sklearn.model_selection import StratifiedKFold  # noqa: E402
from sklearn.pipeline import FeatureUnion, make_pipeline  # noqa: E402

from app.nlp import FALLBACK_THRESHOLD, RoboDadNLP, build_classifier, load_augmented, normalize  # noqa: E402


def original_pipeline():
    return make_pipeline(
        TfidfVectorizer(lowercase=True, stop_words="english", ngram_range=(1, 2)),
        LogisticRegression(max_iter=2000),
    )


def words_no_stopwords():
    return make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True),
        LogisticRegression(max_iter=3000, C=10),
    )


def words_and_chars():
    return make_pipeline(
        FeatureUnion([
            ("w", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
            ("c", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True)),
        ]),
        LogisticRegression(max_iter=3000, C=10),
    )


SETUPS = [
    ("1. Original (CONL725)", original_pipeline, False),
    ("2. Keep stop words, C=10", words_no_stopwords, False),
    ("3. Words + character n-grams", words_and_chars, False),
    ("4. #3 + augmented examples", words_and_chars, True),
    ("5. Production model (app/nlp.py)", build_classifier, True),
]


def main():
    nlp = RoboDadNLP()
    X = np.array(nlp.utterances, dtype=object)
    y = np.array(nlp.labels, dtype=object)
    aug_X, aug_y = load_augmented(set(nlp.utterances))
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    print(f"{len(X)} original examples, {len(set(y))} intents, {len(aug_X)} augmented training examples\n")
    print(f"{'Set-up':38} {'Accuracy':>9} {'Answered*':>10} {'Acc. when answered':>19}")
    for name, factory, use_aug in SETUPS:
        accs, answered, acc_ans = [], [], []
        for tr, te in cv.split(X, y):
            Xtr, ytr = list(X[tr]), list(y[tr])
            if use_aug:
                Xtr += aug_X
                ytr += aug_y
            model = factory().fit(Xtr, ytr)
            probs = model.predict_proba(list(X[te]))
            pred = model.classes_[probs.argmax(1)]
            conf = probs.max(1)
            ok = pred == y[te]
            sure = conf >= FALLBACK_THRESHOLD
            accs.append(ok.mean())
            answered.append(sure.mean())
            acc_ans.append(ok[sure].mean() if sure.any() else 0)
        print(f"{name:38} {np.mean(accs):8.1%} {np.mean(answered):9.1%} {np.mean(acc_ans):18.1%}")
    print(f"\n* share of test messages above the {FALLBACK_THRESHOLD:.2f} confidence threshold (not sent to fallback)")
    print(f"Majority-class baseline: {max(list(y).count(i) for i in set(y)) / len(y):.1%}")

    # A few hand-written messages that are NOT in either dataset
    probe = [
        ("yo whats good", "greeting"), ("can u help me make spaghetti", "life_skill_cooking"),
        ("im freaking out about my math exam", "life_skill_study"), ("my bro keeps taking my charger", "life_skill_conflict"),
        ("how do i wash my hoodie", "life_skill_laundry"), ("tell me something funny pls", "dad_joke"),
        ("i spent all my birthday money", "life_skill_money"), ("cant stop scrolling tiktok when studying", "life_skill_focus"),
    ]
    print("\nUnseen messages: original model vs production model")
    old = original_pipeline().fit(list(X), list(y))
    new = build_classifier().fit(list(X) + aug_X, list(y) + aug_y)
    for text, want in probe:
        t = normalize(text)
        po, pn = old.predict_proba([t])[0], new.predict_proba([t])[0]
        o, n = old.classes_[po.argmax()], new.classes_[pn.argmax()]
        print(f"  {text:42} want {want:22} old {o:22} ({po.max():.2f})  new {n:22} ({pn.max():.2f})")


if __name__ == "__main__":
    main()
