"""
LLM layer: turns RoboDad into a real conversational model.

Supported providers (chosen with environment variables, see README):
  • Anthropic Claude: set ANTHROPIC_API_KEY
  • Groq (free tier, OpenAI-compatible): set GROQ_API_KEY
  • Any other OpenAI-compatible API (OpenAI, OpenRouter, a local Ollama …):
    set OPENAI_API_KEY and, if needed, OPENAI_BASE_URL and OPENAI_MODEL

If none are set, the app runs in "classic" mode with the original intent
classifier, so the site still works with no key and no cost.
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field
from typing import AsyncIterator

import httpx

from .nlp import Analysis

log = logging.getLogger("robodad")

PERSONA = """You are RoboDad, a warm, patient, slightly goofy robot dad. You help kids and teens \
with everyday life skills (cooking, snacks, chores, laundry, homework, sleep, money, friendships, \
feelings, staying safe online) and you tell a good dad joke when asked.

How you talk:
- Call the user "kiddo" now and then, not in every message.
- Keep replies short: 2–5 sentences. Use a short numbered list only when giving steps.
- Be encouraging and practical. Give one clear next step rather than a lecture.
- Use plain words a 12-year-old understands. No slang you'd be embarrassed by.
- Remember what was said earlier in this conversation and refer back to it naturally.

Boundaries:
- You are an AI, not a real parent. If asked, say so honestly and kindly.
- Keep everything age-appropriate. Do not discuss sexual content, drugs, weapons or violence; \
gently steer back.
- For anything medical, legal, dangerous, or about someone hurting them, encourage them to talk to \
a trusted adult (parent, teacher, school counsellor, doctor). In an emergency: call 911.
- Never ask for personal details such as full name, address, school name, phone number or passwords. \
If they share them, remind them to keep such things private online.
- Cooking: always mention adult help for knives, the stove or the oven.
- If you don't know something, say so. Don't make up facts."""


def build_system_prompt(analysis: Analysis) -> str:
    """Persona + what the classic NLP pipeline found (retrieval-augmented grounding)."""
    s = analysis.sentiment
    mood = "negative" if s["compound"] <= -0.3 else "positive" if s["compound"] >= 0.3 else "neutral"
    lines = [
        PERSONA,
        "",
        "## Signals from RoboDad's NLP pipeline for the latest message",
        f"- Predicted intent: {analysis.intent} (confidence {analysis.confidence:.2f})",
        f"- Sentiment: {mood} (VADER compound {s['compound']:+.2f})",
    ]
    if analysis.entities:
        lines.append("- Entities: " + ", ".join(f"{e['text']} ({e['label']})" for e in analysis.entities))
    if mood == "negative":
        lines.append("- The user may be upset: acknowledge the feeling first, then help.")
    if analysis.examples:
        lines += [
            "",
            "## Closest examples from RoboDad's own playbook",
            "Match this voice. Reuse an idea if it fits, but answer the actual message.",
        ]
        for e in analysis.examples:
            lines.append(f'- Kid: "{e["user"]}" → RoboDad: "{e["robodad"]}"')
    return "\n".join(lines)


@dataclass
class Provider:
    name: str
    kind: str  # "anthropic" | "openai"
    model: str
    api_key: str
    base_url: str
    backups: list[str] = field(default_factory=list)
    retired: set[str] = field(default_factory=set)

    @property
    def label(self) -> str:
        return f"{self.name} · {self.model}"


def _csv(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


def detect_provider() -> Provider | None:
    choice = os.getenv("LLM_PROVIDER", "auto").strip().lower()
    if choice in ("none", "classic", "off"):
        return None

    if choice in ("auto", "anthropic") and os.getenv("ANTHROPIC_API_KEY"):
        return Provider(
            name="Claude",
            kind="anthropic",
            model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-5-5"),
            api_key=os.environ["ANTHROPIC_API_KEY"].strip(),
            base_url=os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com"),
            backups=_csv(os.getenv("ANTHROPIC_BACKUP_MODELS", "")),
        )
    if choice in ("auto", "groq") and os.getenv("GROQ_API_KEY"):
        return Provider(
            name="Groq",
            kind="openai",
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            api_key=os.environ["GROQ_API_KEY"].strip(),
            base_url="https://api.groq.com/openai/v1",
            backups=_csv(os.getenv("GROQ_BACKUP_MODELS", "openai/gpt-oss-20b")),
        )
    if choice in ("auto", "openai") and os.getenv("OPENAI_API_KEY"):
        return Provider(
            name="OpenAI-compatible",
            kind="openai",
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=os.environ["OPENAI_API_KEY"].strip(),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
            backups=_csv(os.getenv("OPENAI_BACKUP_MODELS", "")),
        )
    return None


class ModelUnavailable(RuntimeError):
    """The provider says this model doesn't exist or has been retired."""


_MODEL_GONE = re.compile(r"model_not_found|decommission|deprecat|does not exist|not_found_error|no such model|unknown model", re.I)


def _api_error(provider: Provider, status: int, body: str) -> RuntimeError:
    if status in (400, 404) and _MODEL_GONE.search(body):
        return ModelUnavailable(f"{provider.name} model {provider.model} unavailable: {body}")
    return RuntimeError(f"{provider.name} API {status}: {body}")


MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "400"))
TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.7"))


async def _sse_lines(resp: httpx.Response) -> AsyncIterator[str]:
    async for line in resp.aiter_lines():
        if line.startswith("data:"):
            yield line[5:].strip()


async def stream_reply(
    provider: Provider, system: str, messages: list[dict], client: httpx.AsyncClient
) -> AsyncIterator[str]:
    """Yield the reply text chunk by chunk. Raises on any API error."""
    if provider.kind == "anthropic":
        req = client.stream(
            "POST",
            f"{provider.base_url}/v1/messages",
            headers={
                "x-api-key": provider.api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": provider.model,
                "system": system,
                "messages": messages,
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "stream": True,
            },
        )
        async with req as resp:
            if resp.status_code != 200:
                body = (await resp.aread()).decode(errors="replace")[:300]
                raise _api_error(provider, resp.status_code, body)
            async for data in _sse_lines(resp):
                try:
                    evt = json.loads(data)
                except json.JSONDecodeError:
                    continue
                if evt.get("type") == "content_block_delta":
                    text = evt.get("delta", {}).get("text")
                    if text:
                        yield text
                elif evt.get("type") == "error":
                    raise RuntimeError(f"Anthropic stream error: {evt.get('error')}")
        return

    # OpenAI-compatible chat completions
    payload = {
        "model": provider.model,
        "messages": [{"role": "system", "content": system}, *messages],
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "stream": True,
    }
    if "gpt-oss" in provider.model:
        # Reasoning model: keep thinking short (chat replies are simple) and leave
        # room for the hidden reasoning tokens, which count towards max_tokens.
        payload["reasoning_effort"] = os.getenv("LLM_REASONING_EFFORT", "low")
        payload["max_tokens"] = MAX_TOKENS + 1500
    req = client.stream(
        "POST",
        f"{provider.base_url}/chat/completions",
        headers={"Authorization": f"Bearer {provider.api_key}", "content-type": "application/json"},
        json=payload,
    )
    async with req as resp:
        if resp.status_code != 200:
            body = (await resp.aread()).decode(errors="replace")[:300]
            raise _api_error(provider, resp.status_code, body)
        hide = _ThinkFilter()
        async for data in _sse_lines(resp):
            if data == "[DONE]":
                break
            try:
                evt = json.loads(data)
            except json.JSONDecodeError:
                continue
            for choice in evt.get("choices", []):
                text = hide.feed((choice.get("delta") or {}).get("content") or "")
                if text:
                    yield text


class _ThinkFilter:
    """Drops <think>…</think> blocks that some open models put in their reply."""

    def __init__(self):
        self.inside = False
        self.buf = ""

    def feed(self, text: str) -> str:
        self.buf += text
        out = ""
        while self.buf:
            tag = "</think>" if self.inside else "<think>"
            i = self.buf.find(tag)
            if i >= 0:
                if not self.inside:
                    out += self.buf[:i]
                self.buf = self.buf[i + len(tag):]
                self.inside = not self.inside
                continue
            # keep a possible partial tag at the end for the next chunk
            keep = next((k for k in range(len(tag) - 1, 0, -1) if self.buf.endswith(tag[:k])), 0)
            if not self.inside:
                out += self.buf[: len(self.buf) - keep]
            self.buf = self.buf[len(self.buf) - keep:] if keep else ""
            break
        return out


# ---------------------------------------------------------------- failover
_SKIP_MODELS = re.compile(
    r"whisper|tts|guard|embed|moderation|orpheus|playai|compound|distil|vision|image|audio|transcri|search|realtime|instruct-?v0|safeguard",
    re.I,
)
_PREFER = [r"gpt-oss-120b", r"gpt-oss", r"llama", r"qwen", r"kimi", r"haiku", r"sonnet", r"mini", r"gpt-4"]


async def _discover_models(provider: Provider, client: httpx.AsyncClient) -> list[str]:
    try:
        if provider.kind == "anthropic":
            r = await client.get(
                f"{provider.base_url}/v1/models",
                headers={"x-api-key": provider.api_key, "anthropic-version": "2023-06-01"},
            )
        else:
            r = await client.get(f"{provider.base_url}/models", headers={"Authorization": f"Bearer {provider.api_key}"})
        r.raise_for_status()
        ids = [m.get("id", "") for m in r.json().get("data", []) if m.get("active", True)]
    except Exception as exc:
        log.warning("Couldn't list %s models: %s", provider.name, exc)
        return []
    ids = [i for i in ids if i and not _SKIP_MODELS.search(i)]

    def rank(model_id: str) -> int:
        return next((n for n, pat in enumerate(_PREFER) if re.search(pat, model_id, re.I)), len(_PREFER))

    return sorted(ids, key=rank)


async def _next_model(provider: Provider, client: httpx.AsyncClient) -> str | None:
    for m in provider.backups:
        if m not in provider.retired:
            return m
    for m in await _discover_models(provider, client):
        if m not in provider.retired:
            return m
    return None


async def stream_with_failover(
    provider: Provider, system: str, messages: list[dict], client: httpx.AsyncClient
) -> AsyncIterator[str]:
    """Like stream_reply, but if the model has been retired, switch to another one and retry.

    The switch is remembered for the life of the server, and the status line
    in the page shows the model actually in use.
    """
    for _ in range(4):
        try:
            async for chunk in stream_reply(provider, system, messages, client):
                yield chunk
            return
        except ModelUnavailable as exc:
            provider.retired.add(provider.model)
            nxt = await _next_model(provider, client)
            if not nxt:
                raise
            log.warning("%s Switching to %s.", exc, nxt)
            provider.model = nxt
    raise RuntimeError("No working model found")
