"""
RoboDad web server.

  GET  /             the chat page
  GET  /api/status   which mode is running (LLM or classic)
  POST /api/chat     streams a reply as Server-Sent Events

Run locally:  uvicorn app.main:app --reload --port 7860
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import date

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load_dotenv(path: str) -> None:
    """Read KEY=value lines from .env for local runs (hosting sets real env vars)."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if v.strip() and k.strip() not in os.environ:
                    os.environ[k.strip()] = v.strip().strip('"').strip("'")


_load_dotenv(os.path.join(BASE_DIR, ".env"))

import httpx  # noqa: E402
from fastapi import FastAPI, HTTPException, Request  # noqa: E402
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

from .llm import build_system_prompt, detect_provider, stream_reply  # noqa: E402
from .nlp import RoboDadNLP  # noqa: E402
from .safety import CRISIS_RESPONSE, clean_user_text, is_crisis  # noqa: E402

log = logging.getLogger("robodad")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

STATIC_DIR = os.path.join(BASE_DIR, "static")

HISTORY_TURNS = 16  # messages of context sent to the LLM
RATE_LIMIT = os.getenv("RATE_LIMIT", "30/600")  # messages / seconds, per visitor
DAILY_LLM_LIMIT = int(os.getenv("DAILY_LLM_LIMIT", "1500"))  # protects your API bill

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    t = time.perf_counter()
    state["nlp"] = RoboDadNLP()
    state["provider"] = detect_provider()
    state["client"] = httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0))
    p = state["provider"]
    log.info(
        "RoboDad ready in %.2fs: %d examples, %d intents, mode=%s",
        time.perf_counter() - t, len(state["nlp"].rows), len(state["nlp"].intents),
        p.label if p else "classic (no LLM key set)",
    )
    yield
    await state["client"].aclose()


app = FastAPI(title="RoboDad", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------------------------------------------------------- rate limits
_max_hits, _window = (int(x) for x in RATE_LIMIT.split("/"))
_hits: dict[str, deque] = defaultdict(deque)
_daily = {"day": date.today(), "count": 0}


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "?")


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > _window:
        q.popleft()
    if len(q) >= _max_hits:
        return True
    q.append(now)
    return False


def _llm_budget_left() -> bool:
    if _daily["day"] != date.today():
        _daily.update(day=date.today(), count=0)
    return _daily["count"] < DAILY_LLM_LIMIT


# ---------------------------------------------------------------- models
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=200)


def _prepare_history(msgs: list[ChatMessage]) -> list[dict]:
    """Keep the last few turns, start on a user turn, merge same-role neighbours."""
    cleaned = [
        {"role": m.role, "content": clean_user_text(m.content)}
        for m in msgs
        if m.role in ("user", "assistant") and m.content.strip()
    ][-HISTORY_TURNS:]
    while cleaned and cleaned[0]["role"] != "user":
        cleaned.pop(0)
    merged: list[dict] = []
    for m in cleaned:
        if merged and merged[-1]["role"] == m["role"]:
            merged[-1]["content"] += "\n\n" + m["content"]
        else:
            merged.append(m)
    return merged


def _sse(event: str, data) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# ---------------------------------------------------------------- routes
@app.get("/")
async def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/status")
async def status():
    p = state.get("provider")
    return {
        "mode": "llm" if p else "classic",
        "model": p.label if p else "TF-IDF + Logistic Regression",
        "intents": len(state["nlp"].intents),
        "examples": len(state["nlp"].rows),
    }


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/chat")
async def chat(req: ChatRequest, request: Request):
    history = _prepare_history(req.messages)
    if not history or history[-1]["role"] != "user":
        raise HTTPException(400, "The last message must come from the user.")
    if _rate_limited(_client_ip(request)):
        return JSONResponse(
            {"error": "You're sending messages quickly. Wait a minute, then try again."}, status_code=429
        )

    user_text = history[-1]["content"]
    nlp: RoboDadNLP = state["nlp"]
    provider = state["provider"]

    async def events():
        t0 = time.perf_counter()
        analysis = await asyncio.to_thread(nlp.analyse, user_text)
        nlp_ms = (time.perf_counter() - t0) * 1000

        if is_crisis(user_text):
            mode = "safety"
        elif provider and _llm_budget_left():
            mode = "llm"
        else:
            mode = "classic"

        meta = analysis.to_dict() | {"mode": mode, "nlp_ms": round(nlp_ms, 1)}
        if mode == "llm":
            meta["model"] = provider.label
        yield _sse("meta", meta)

        if mode == "safety":
            yield _sse("token", CRISIS_RESPONSE)
        elif mode == "classic":
            yield _sse("token", nlp.classic_reply(analysis))
        else:
            _daily["count"] += 1
            sent_any = False
            try:
                async for chunk in stream_reply(provider, build_system_prompt(analysis), history, state["client"]):
                    sent_any = True
                    yield _sse("token", chunk)
                if not sent_any:
                    raise RuntimeError("model returned an empty reply")
            except Exception as exc:  # network, quota, bad key …
                log.warning("LLM failed, falling back to classic: %s", exc)
                if not sent_any:
                    yield _sse("mode", {"mode": "classic", "reason": "The AI model didn't respond, so RoboDad answered from his playbook."})
                    yield _sse("token", nlp.classic_reply(analysis))
                else:
                    yield _sse("token", " …sorry kiddo, I lost my train of thought there.")

        yield _sse("done", {"total_ms": round((time.perf_counter() - t0) * 1000, 1)})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
