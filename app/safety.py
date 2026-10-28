"""
Safety layer.

RoboDad is a supportive persona that young people may talk to, so a few
messages never go to the LLM at all: if someone signals they may be in danger,
RoboDad answers with a fixed, human-reviewed message that points to real help.
This is a deliberate rule-based guardrail on top of the LLM's own judgement.

Help lines are for Canada and the US. Change CRISIS_RESPONSE if you deploy
for another country.
"""

from __future__ import annotations

import re

_CRISIS_PATTERNS = [
    r"\b(kill|hurt|harm|cut)(ing)?\s+(my\s*self|myself)\b",
    r"\bsuicid",
    r"\bself[\s-]?harm",
    r"\b(want|wanna|going)\s+to\s+die\b",
    r"\bend\s+(my|it)\s+(life|all)\b",
    r"\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist)\b",
    r"\bno\s+reason\s+to\s+live\b",
    r"\b(someone|somebody|he|she|they|my\s+\w+)\s+(is\s+)?(hurting|hitting|touching|abusing)\s+me\b",
    r"\b(being\s+)?abused\b",
    r"\bnot\s+safe\s+at\s+home\b",
]
_CRISIS_RE = re.compile("|".join(_CRISIS_PATTERNS), re.IGNORECASE)

CRISIS_RESPONSE = (
    "I'm really glad you told me, kiddo. That took courage. What you're going through matters, "
    "and you deserve help from a real person right now. I'm an AI, so I can't be there the way "
    "someone who cares about you can.\n\n"
    "Please reach out to one of these. They're free, confidential and there 24/7:\n"
    "• **Kids Help Phone** (Canada): call 1-800-668-6868 or text CONNECT to 686868\n"
    "• **988 Suicide Crisis Helpline** (Canada and US): call or text 988\n"
    "• If you're in danger right now, call **911**.\n\n"
    "And if you can, tell a trusted adult (a parent, teacher, coach or school counsellor) today. "
    "You don't have to handle this on your own."
)

MAX_MESSAGE_CHARS = 1000


def is_crisis(text: str) -> bool:
    return bool(_CRISIS_RE.search(text or ""))


def clean_user_text(text: str) -> str:
    text = (text or "").replace("\x00", "").strip()
    return text[:MAX_MESSAGE_CHARS]
