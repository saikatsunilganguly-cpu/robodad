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
import os
from dataclasses import dataclass
from typing import AsyncIterator

import httpx

from .nlp import Analysis

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

    @property
    def label(self) -> str:
        return f"{self.name} · {self.model}"


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
        )
    if choice in ("auto", "groq") and os.getenv("GROQ_API_KEY"):
        return Provider(
            name="Groq",
            kind="openai",
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            api_key=os.environ["GROQ_API_KEY"].strip(),
            base_url="https://api.groq.com/openai/v1",
        )
    if choice in ("auto", "openai") and os.getenv("OPENAI_API_KEY"):
        return Provider(
            name="OpenAI-compatible",
            kind="openai",
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            api_key=os.environ["OPENAI_API_KEY"].strip(),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        )
    return None


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
                raise RuntimeError(f"Anthropic API {resp.status_code}: {body}")
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
            raise RuntimeError(f"{provider.name} API {resp.status_code}: {body}")
        async for data in _sse_lines(resp):
            if data == "[DONE]":
                break
            try:
                evt = json.loads(data)
            except json.JSONDecodeError:
                continue
            for choice in evt.get("choices", []):
                text = (choice.get("delta") or {}).get("content")
                if text:
                    yield text
