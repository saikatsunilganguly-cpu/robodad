---
title: RoboDad
emoji: 🤖
colorFrom: blue
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
---

# RoboDad: from intent classifier to a hosted LLM chatbot

RoboDad started as my CONL725 coursework chatbot: TF-IDF + Logistic Regression
intent classification, VADER sentiment, regex NER and canned responses in a
terminal. This version turns it into a web app that talks like a real LLM
while keeping that NLP pipeline in charge of grounding and safety.

## What changed

| | CONL725 version | Web version |
|---|---|---|
| Interface | Terminal `input()` loop | Web chat page, works on phone and desktop |
| Replies | Random pick from the intent's canned list | Streamed, word-by-word replies from an LLM (Claude, Groq/Llama or any OpenAI-compatible model) |
| Memory | None, every message stands alone | Remembers the last 16 messages of the conversation |
| Out-of-scope questions ("help me cook pasta") | Fallback: "I didn't quite catch that" | Real answer, in RoboDad's voice |
| Use of the dataset | Training data + response bank | Also a retrieval index: the 4 most similar examples are fed to the LLM as style and content guidance (retrieval-augmented generation) |
| NLP analysis | Printed to the console | Shown under each reply in "How RoboDad read this" |
| Safety | Confidence threshold only | Crisis guardrail that bypasses the LLM, persona rules, input limits, per-visitor rate limit, daily LLM budget |
| Reliability | Needed the exact scikit-learn version that made the `.joblib` files | Retrains at startup in under a second; falls back to the classic classifier if the LLM is down or no key is set |
| Data | Windows-1252 file read as Latin-1, so apostrophes turned into junk ("Im") | Cleaned to UTF-8, 61 duplicate rows removed (1,042 → 981) |

## How a message flows

```
 user message
     │
     ▼
 safety check ──── crisis words? ──► fixed help message (Kids Help Phone, 988, 911); no LLM
     │
     ▼
 NLP pipeline (app/nlp.py)
   • normalise text
   • intent + confidence      (TF-IDF + Logistic Regression)
   • sentiment                (VADER)
   • entities                 (regex NER: names, dates, times, money, numbers)
   • 4 most similar examples  (TF-IDF cosine retrieval over the dataset)
     │
     ▼
 system prompt = RoboDad persona + rules + the signals above + retrieved examples
     │
     ▼
 LLM (streams tokens) ──── error / no key / daily budget used up ──► classic classifier reply
     │
     ▼
 browser renders the reply live, plus the "How RoboDad read this" panel
```

Classifier accuracy (5-fold cross-validation, `python scripts/evaluate.py`):
**57.8% across 32 intents**, against a 4.7% majority-class baseline. This is why
the LLM now writes the replies: the classifier is a useful signal but too
unreliable to choose a final answer by itself.

## Project layout

```
app/
  main.py      web server: chat streaming, rate limits, fallbacks
  nlp.py       the CONL725 pipeline: classifier, retrieval, sentiment, NER
  llm.py       RoboDad persona prompt + Claude / Groq / OpenAI-compatible streaming
  safety.py    crisis detection and help-line message
static/
  index.html   the chat page (no build step)
  favicon.svg
data/
  robodad_intents.csv   cleaned dataset (UTF-8)
scripts/
  evaluate.py  cross-validated accuracy of the classifier
Dockerfile, requirements.txt, .env.example
```

---

## Put it on the internet (free): Render

Render runs the Dockerfile on its free plan: no credit card, and a public link
like `https://robodad.onrender.com`. Free services sleep after 15 minutes
without visitors; the first visit after that takes up to a minute to wake up.

### 1. Get a free LLM key from Groq

1. Go to **console.groq.com** and sign in with Google or GitHub.
2. Open **API Keys** → **Create API Key**, name it `robodad`, and copy the key
   (it starts with `gsk_`). It's only shown once.

Prefer Claude? Create a key in the Claude Console at **console.anthropic.com**
and use `ANTHROPIC_API_KEY` instead of `GROQ_API_KEY` below. RoboDad uses
`claude-haiku-5-5`, the fastest and cheapest Claude model.

### 2. Deploy on Render

1. Go to **render.com** → **Get Started** → **GitHub** to sign up with your GitHub account.
2. In the dashboard: **New** → **Web Service** → **GitHub**, and allow Render
   to access the `robodad` repository.
3. Pick the `robodad` repository → **Connect**.
4. Name: `robodad`. Language: **Docker**. Branch: `main`. Region: **Ohio (US East)**.
   Instance type: **Free**.
5. Under **Environment Variables** add `GROQ_API_KEY` with your key.
6. Click **Deploy Web Service**. The first build takes about 3–5 minutes.
7. When the log says "Your service is live", open the link at the top of the page.
   The header should read "Online · Groq · openai/gpt-oss-120b".
   "Classic mode" means the key is missing or misspelled
   (fix it under **Environment**, then **Manual Deploy** → **Deploy latest commit**).

Every time you push a change to GitHub, Render redeploys automatically.

### Why not Hugging Face Spaces?

The `README.md` header still works for Hugging Face Docker Spaces, but since
October 2026 those need a PRO subscription on the free CPU tier.

---

## Run it on your own computer

```bash
cd robodad-web
python -m venv .venv
# Windows: .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env      # macOS/Linux: cp .env.example .env
# open .env and paste your key after GROQ_API_KEY=
uvicorn app.main:app --reload --port 7860
```

Then open http://localhost:7860. With no key in `.env`, it runs in classic mode.

In PyCharm: open the `robodad-web` folder, create a virtualenv interpreter,
install `requirements.txt`, and add a Run configuration with module `uvicorn`
and parameters `app.main:app --reload --port 7860`.

## Settings

All settings are environment variables (Space secrets/variables, Render
environment, or `.env` locally).

| Variable | Default | What it does |
|---|---|---|
| `GROQ_API_KEY` | none | Use Groq. Model set by `GROQ_MODEL` (default `openai/gpt-oss-120b`) |
| `ANTHROPIC_API_KEY` | none | Use Claude. Model set by `ANTHROPIC_MODEL` (default `claude-haiku-5-5`) |
| `OPENAI_API_KEY` | none | Any OpenAI-compatible API, with `OPENAI_BASE_URL` and `OPENAI_MODEL` |
| `LLM_PROVIDER` | `auto` | Force `anthropic`, `groq`, `openai`, or `none` (classic only) |
| `RATE_LIMIT` | `30/600` | Messages allowed per visitor per time window (seconds) |
| `DAILY_LLM_LIMIT` | `1500` | LLM calls per day before switching to classic mode; caps your bill |
| `LLM_MAX_TOKENS` | `400` | Maximum reply length |
| `LLM_TEMPERATURE` | `0.7` | Higher is more playful, lower is more consistent |

If several keys are set, Claude is used first, then Groq, then OpenAI-compatible.

## Safety notes

- Messages that suggest self-harm or abuse never reach the LLM. RoboDad replies
  with a fixed message pointing to Kids Help Phone (1-800-668-6868, text
  CONNECT to 686868), the 988 Suicide Crisis Helpline and 911. These are
  Canada/US services; edit `CRISIS_RESPONSE` in `app/safety.py` for other countries.
- The persona prompt in `app/llm.py` keeps RoboDad age-appropriate, honest
  that he's an AI, and steers medical, legal and dangerous topics to trusted adults.
- Conversations aren't stored on the server. Each browser tab keeps its own
  chat until it's closed.
- Keyword guardrails can miss things. Anyone running RoboDad publicly for real
  children should add a moderation API and human review.
