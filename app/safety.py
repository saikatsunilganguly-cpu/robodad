"""
Safety layer.

Some messages never go to the LLM at all. If a teen signals they may be in
danger, RoboDad answers with a fixed, human-reviewed message that points to
real help for that specific situation. This is a deliberate rule-based
guardrail on top of the LLM's own rules.

Resources are for Canada (plus US numbers where they differ). Edit the
messages below if you deploy for another country.

Keyword rules can miss things and occasionally over-trigger. Erring on the
side of showing help is intended.
"""

from __future__ import annotations

import re

KHP = "**Kids Help Phone**: call 1-800-668-6868 or text CONNECT to 686868, any time, day or night"

_CATEGORIES: list[tuple[str, list[str], str]] = [
    (
        "self_harm",
        [
            r"\b(kill|hurt|harm|cut|cutting)(ing)?\s+(my\s*self|myself)\b",
            r"\bsuicid",
            r"\bself[\s-]?harm",
            r"\b(want|wanna|going)\s+to\s+die\b",
            r"\bend\s+(my|it)\s+(life|all)\b",
            r"\bdon'?t\s+want\s+to\s+(live|be\s+alive|exist|be\s+here)\b",
            r"\bno\s+reason\s+to\s+live\b",
            r"\bbetter\s+off\s+(dead|without\s+me)\b",
        ],
        "I'm really glad you told me. That took courage. What you're going through matters, and you "
        "deserve help from a real person right now. I'm an AI, so I can't be there the way someone "
        "who cares about you can.\n\n"
        "Please reach out to one of these. They're free and there 24/7:\n"
        f"• {KHP}\n"
        "• **988 Suicide Crisis Helpline** (Canada and US): call or text 988\n"
        "• If you're in danger right now, call **911**.\n\n"
        "If you can, tell a trusted adult (a parent, teacher, coach or school counsellor) today. "
        "You don't have to handle this on your own.",
    ),
    (
        "sextortion",
        [
            r"\bsextort",
            # explicit threat word + sharing images
            r"\bthreat\w*(\s+to)?\s+(post|share|send|leak|spread|show)\s+(my|the|our)?\s*(pics?|photos?|pictures?|nudes?|images?|videos?|vids?)\b",
            # sharing intimate images
            r"\b(going\s+to|gonna|will|'ll|wants?\s+to)\s+(post|share|send|leak|spread|show)\s+(my|the|our)?\s*(nudes?|naked|explicit)",
            # sharing images + a pressure signal
            r"\b(going\s+to|gonna|will|'ll|wants?\s+to)\s+(post|share|send|leak|spread|show)\s+(my|the|our)?\s*(pics?|photos?|pictures?|images?|videos?|vids?)\b"
            r".*\b(unless|if\s+i\s+don'?t|pay|money|\$|gift\s*cards?|everyone|my\s+school|my\s+friends|followers|my\s+parents)",
            r"\b(leak|spread)\w*\s+my\s+(nudes?|pics?|photos?|pictures?|videos?)\b",
            r"\bnudes?\b.*\b(pay|money|gift\s*cards?|unless|or\s+else|threat)",
            r"\b(pay|money|gift\s*cards?)\b.*\bnudes?\b",
            r"\bsent\s+(a\s+)?(nude|naked|explicit)\b",
        ],
        "I'm really glad you told me. This happens to a lot of teens. It is **not your fault**, and "
        "it can be stopped.\n\n"
        "Right now:\n"
        "1. **Don't pay and don't send anything else.** Paying usually leads to more demands.\n"
        "2. **Stop replying, but don't delete anything yet.** Screenshot the messages and the account name.\n"
        "3. **Tell a trusted adult today** (a parent, teacher or school counsellor). You won't be in trouble for asking for help.\n\n"
        "Get help:\n"
        "• **NeedHelpNow.ca**: step-by-step help, including getting images taken down\n"
        "• **Cybertip.ca**: report it (Canada). In the US: **TakeItDown.ncmec.org**\n"
        f"• {KHP}\n"
        "• If you're having thoughts of hurting yourself, call or text **988**. In an emergency, call **911**.",
    ),
    (
        "eating",
        [
            r"\bstarv(e|ing)\s+(my\s*self|myself)\b",
            r"\b(stopped|stop|not|haven'?t\s+been)\s+eating\b.*\b(weight|fat|body|thin|skinny)\b",
            r"\bmake\s+(my\s*self|myself)\s+(throw\s+up|sick|vomit|puke)\b",
            r"\bthrow(ing)?\s+up\s+after\s+(i\s+)?eat",
            r"\bpurg(e|ing)\b",
            r"\banorexi|\bbulimi|\beating\s+disorder",
            r"\bbinge\w*\b.*\b(hate|disgust|guilt|ashamed)",
            r"\b(skip|skipping)\s+(all\s+)?(my\s+)?meals\b.*\b(weight|fat|thin|skinny)\b",
        ],
        "Thanks for trusting me with this. It sounds really hard, and you deserve support from people "
        "who know this well, not just a robot.\n\n"
        "• **NEDIC helpline**: 1-866-633-4220, free for anyone in Canada (live chat at nedic.ca)\n"
        f"• {KHP}\n"
        "• If you feel faint, are being sick often, or feel unsafe, call **911**.\n\n"
        "It really helps to tell a parent, doctor or school counsellor what's going on. "
        "You don't have to sort this out on your own.",
    ),
    (
        "dating_violence",
        [
            r"\b(boyfriend|girlfriend|partner|bf|gf|ex)\s+(\w+\s+)?(hits?|hitting|hurts?|hurting|pushe[sd]|pushing|"
            r"slapp?(ed|s|ing)?|choke[sd]?|chokes|threaten(s|ed|ing)?|forced?|forces|forcing)\s+(me|my)\b",
            r"\b(boyfriend|girlfriend|partner|bf|gf)\b.*\b(won'?t\s+let\s+me|controls?\s+(who|what|where|my))",
            r"\bforced\s+me\s+to\b",
        ],
        "I'm glad you told me. Nobody has the right to hurt, threaten, pressure or control you, no "
        "matter how they feel about you. **None of this is your fault.**\n\n"
        "• If you're in danger right now, call **911**.\n"
        f"• {KHP}\n"
        "• Tell a trusted adult (a parent, teacher or school counsellor), and try not to be alone with this person.\n\n"
        "You deserve to feel safe and respected.",
    ),
    (
        "abuse",
        [
            r"\b(someone|somebody|he|she|they|my\s+\w+)\s+(is\s+|keeps\s+)?(hurting|hitting|touching|abusing|beating)\s+me\b",
            r"\b(being\s+)?abused\b",
            r"\bnot\s+safe\s+at\s+home\b",
            r"\bscared\s+to\s+go\s+home\b",
        ],
        "I'm really glad you told me. What's happening is **not your fault**, and you deserve to be safe.\n\n"
        "• If you're in danger right now, call **911**.\n"
        f"• {KHP}\n"
        "• Tell a trusted adult outside your home today: a teacher, school counsellor, coach or a friend's parent.\n\n"
        "You don't have to handle this on your own.",
    ),
]

_COMPILED = [(name, re.compile("|".join(pats), re.IGNORECASE), msg) for name, pats, msg in _CATEGORIES]

MAX_MESSAGE_CHARS = 1000


def check_crisis(text: str) -> tuple[str, str] | None:
    """Return (category, fixed response) if the message signals danger."""
    t = (text or "").replace("’", "'")
    for name, rx, msg in _COMPILED:
        if rx.search(t):
            return name, msg
    return None


def is_crisis(text: str) -> bool:
    return check_crisis(text) is not None


# Kept for compatibility with earlier code and tests
CRISIS_RESPONSE = _CATEGORIES[0][2]


def clean_user_text(text: str) -> str:
    text = (text or "").replace("\x00", "").strip()
    return text[:MAX_MESSAGE_CHARS]


def clean_nickname(name: str | None) -> str:
    """Letters, spaces, hyphens and apostrophes only; max 20 characters."""
    name = re.sub(r"[^\w\s'\-]", "", (name or ""), flags=re.UNICODE)
    name = re.sub(r"[\d_]", "", name)
    return " ".join(name.split())[:20]
