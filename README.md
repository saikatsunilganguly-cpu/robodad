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

**Live demo: https://robodad.onrender.com** (free hosting: the first visit after a quiet spell takes up to a minute to wake up)

RoboDad started as my CONL725 coursework chatbot: TF-IDF + Logistic Regression
intent classification, VADER sentiment, regex NER and canned responses in a
terminal. This version turns it into a web app that talks like a real LLM
while keeping that NLP pipeline in charge of grounding and safety.

## What changed

| | CONL725 version | Web version |
|---|---|---|
| Interface | Terminal `input()` loop | Web chat page, works on phone and desktop |
| Replies | Random pick from the intent's canned list | Streamed, word-by-word replies from an LLM (Claude, Groq or any OpenAI-compatible model) |
| Intent classifier | 57.8% accuracy; confident on only 29% of messages | 68.7% accuracy; confident on 79% of messages at the same reliability (see below) |
| Voice | None | Talk with the mic button; RoboDad can read replies aloud |
| Phone | None | Installs as a home-screen app and opens instantly |
| Feedback | None | Thumbs up/down on every reply, saved to a free database |
| Memory | None, every message stands alone | Remembers the last 16 messages of the conversation |
| Out-of-scope questions ("help me cook pasta") | Fallback: "I didn't quite catch that" | Real answer, in RoboDad's voice |
| Use of the dataset | Training data + response bank | Also a retrieval index: the 4 most similar examples are fed to the LLM as style and content guidance (retrieval-augmented generation) |
| NLP analysis | Printed to the console | Shown under each reply in "How RoboDad read this" |
| Safety | Confidence threshold only | Crisis guardrail that bypasses the LLM, persona rules, input limits, per-visitor rate limit, daily LLM budget |
| Reliability | Needed the exact scikit-learn version that made the `.joblib` files | Model trained during the build, so it always matches; switches AI model automatically if one is retired; falls back to the classic classifier if the LLM is down or no key is set; shows "waking up" while the free server starts |
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
   • intent + confidence      (TF-IDF words + character n-grams, Logistic Regression)
   • sentiment                (VADER)
   • entities                 (regex NER: names, dates, times, money, numbers)
   • 4 most similar examples  (TF-IDF cosine retrieval over the dataset)
     │
     ▼
 system prompt = RoboDad persona + rules + the signals above + retrieved examples
     │
     ▼
 LLM (streams tokens) ──── model retired? ──► try backup / discover a current model, retry
     │               └──── other error / no key / daily budget used up ──► classic classifier reply
     │
     ▼
 browser renders the reply live, plus the "How RoboDad read this" panel
```

## Improving the intent classifier

`python scripts/evaluate.py` compares set-ups with 5-fold cross-validation.
Every set-up is tested only on the original 981 RoboDad examples.

| Set-up | Accuracy | Confident* | Right when confident |
|---|---|---|---|
| 1. Original CONL725 model (stop words removed, word 1–2-grams) | 57.8% | 29.3% | 79.1% |
| 2. Keep stop words, less regularisation (C=10) | 60.9% | 87.8% | 66.1% |
| 3. Add character 2–5-grams (handles typos and slang) | 63.6% | 92.7% | 67.2% |
| 4. #3 + 480 extra training examples | **68.7%** | 95.8% | 70.2% |

\*Above the 0.20 fallback threshold. Majority-class baseline: 4.7%.

The production model is set-up 4 with the fallback threshold raised to
**0.40**, chosen from the same cross-validation: it is confident on **79%** of
messages and right **77%** of the time when it is, about the same reliability as
the original model but on 2.7× as many messages.

How the extra examples were made fair: they are in
`data/augmented_utterances.csv`, were written from the intent *names* (not by
rewording the existing examples), are only ever added to the training folds,
and any that exactly match an original example (67 of 480) are dropped first.

Messages from the original testing transcript:

| Message | CONL725 model | Now |
|---|---|---|
| "help me cook pasta" | fallback (0.16) | cooking (0.89) |
| "yo" | fallback (0.07) | greeting (0.88) |

Even at 69% the classifier is a signal, not an answer, which is why the LLM
writes the replies and the classifier grounds them.

## Project layout

```
app/
  main.py      web server: chat streaming, rate limits, fallbacks
  nlp.py       the CONL725 pipeline: classifier, retrieval, sentiment, NER
  llm.py       RoboDad persona prompt + Claude / Groq / OpenAI-compatible streaming
  safety.py    crisis detection and help-line message
static/
  index.html   the chat page (no build step): voice, feedback, waking-up banner
  sw.js, manifest.webmanifest, icon-*.png   phone-app (PWA) files
  favicon.svg
data/
  robodad_intents.csv       cleaned dataset (UTF-8)
  augmented_utterances.csv  480 extra training-only examples
scripts/
  evaluate.py  compares classifier set-ups with cross-validation
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

### 3. Optional: save thumbs up/down to a free database

Without this step, ratings still work and appear in Render's **Logs** as
`FEEDBACK up …` / `FEEDBACK down …` lines, but logs don't keep them long.

1. Sign up at **supabase.com** (free) and create a project called `robodad`.
2. Open **SQL Editor**, paste this and click **Run**:

   ```sql
   create table public.feedback (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     rating smallint not null check (rating in (-1, 1)),
     intent text,
     confidence real,
     mode text,
     model text,
     reply text
   );
   alter table public.feedback enable row level security;
   grant select, insert on public.feedback to service_role;
   ```

3. In **Project Settings → API Keys**, copy the **secret** key (starts with `sb_secret_`),
   and from the **Connect** dialog copy the project URL (`https://xxxx.supabase.co`).
4. In Render → **Environment**, add `SUPABASE_URL` and `SUPABASE_KEY` with those values.
5. Ratings now appear in Supabase under **Table Editor → feedback**.

Only the rating, the detected intent, the model and RoboDad's reply are saved,
never what the child typed. Free Supabase projects pause after a week without
activity; open the dashboard and click **Restore** to wake one up.

### Install on a phone

- **Android (Chrome):** open the site → menu (⋮) → **Add to Home screen** / **Install app**.
- **iPhone (Safari):** open the site → **Share** → **Add to Home Screen**.
- **Desktop (Chrome/Edge):** click **Install app** in RoboDad's header.

The installed app opens instantly, even while the server is waking up.

### Why not Hugging Face Spaces?

The `README.md` header still works for Hugging Face Docker Spaces, but since
October 2026 those need a PRO subscription on the free CPU tier.

---

## Run it on your own computer

```bash
cd robodad
python -m venv .venv
# Windows: .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env      # macOS/Linux: cp .env.example .env
# open .env and paste your key after GROQ_API_KEY=
uvicorn app.main:app --reload --port 7860
```

Then open http://localhost:7860. With no key in `.env`, it runs in classic mode.

In PyCharm: open the `robodad` folder, create a virtualenv interpreter,
install `requirements.txt`, and add a Run configuration with module `uvicorn`
and parameters `app.main:app --reload --port 7860`.

## Settings

All settings are environment variables (Render environment or `.env` locally).

| Variable | Default | What it does |
|---|---|---|
| `GROQ_API_KEY` | none | Use Groq. Model set by `GROQ_MODEL` (default `openai/gpt-oss-120b`), backups by `GROQ_BACKUP_MODELS` (default `openai/gpt-oss-20b`) |
| `ANTHROPIC_API_KEY` | none | Use Claude. Model set by `ANTHROPIC_MODEL` (default `claude-haiku-5-5`) |
| `OPENAI_API_KEY` | none | Any OpenAI-compatible API, with `OPENAI_BASE_URL` and `OPENAI_MODEL` |
| `LLM_PROVIDER` | `auto` | Force `anthropic`, `groq`, `openai`, or `none` (classic only) |
| `RATE_LIMIT` | `30/600` | Messages allowed per visitor per time window (seconds) |
| `DAILY_LLM_LIMIT` | `1500` | LLM calls per day before switching to classic mode; caps your bill |
| `LLM_MAX_TOKENS` | `400` | Maximum reply length |
| `LLM_TEMPERATURE` | `0.7` | Higher is more playful, lower is more consistent |
| `SUPABASE_URL`, `SUPABASE_KEY` | none | Save thumbs up/down to Supabase (otherwise they go to the log) |

If several keys are set, Claude is used first, then Groq, then OpenAI-compatible.
If the provider says a model has been retired, RoboDad tries the backup list,
then asks the provider for its current models and picks a chat model.

## Safety notes

- Messages that suggest self-harm or abuse never reach the LLM. RoboDad replies
  with a fixed message pointing to Kids Help Phone (1-800-668-6868, text
  CONNECT to 686868), the 988 Suicide Crisis Helpline and 911. These are
  Canada/US services; edit `CRISIS_RESPONSE` in `app/safety.py` for other countries.
- The persona prompt in `app/llm.py` keeps RoboDad age-appropriate, honest
  that he's an AI, and steers medical, legal and dangerous topics to trusted adults.
- Conversations aren't stored on the server. Each browser tab keeps its own
  chat until it's closed. Feedback stores ratings and RoboDad's replies only.
- Voice input uses the browser's own speech recognition (Chrome and Edge send
  the audio to their speech service); nothing is recorded by RoboDad.
- Keyword guardrails can miss things. Anyone running RoboDad publicly for real
  children should add a moderation API and human review.
