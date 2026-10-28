"""
Checks the crisis guardrail: messages that must get a help message, and
everyday messages that must NOT trigger one.

    python scripts/test_safety.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.safety import check_crisis, clean_nickname  # noqa: E402

MUST_TRIGGER = {
    "self_harm": [
        "i want to hurt myself", "I dont want to live anymore", "thinking about suicide",
        "I feel like everyone is better off without me", "i want to kill myself", "I've been cutting myself",
    ],
    "sextortion": [
        "someone is threatening to post my pics unless i pay", "this guy says he will share my nudes",
        "they want $500 or they leak my photos", "I sent a nude and now he wants money", "im being sextorted",
        "he's gonna send my pictures to everyone", "they're threatening to post my pictures",
        "he said he'll send my pics to my school",
    ],
    "eating": [
        "I've been starving myself", "i make myself throw up after i eat", "i think i have an eating disorder",
        "i stopped eating because i feel fat", "im throwing up after i eat",
    ],
    "dating_violence": [
        "my boyfriend hits me", "my gf threatened me", "my partner pushed me",
        "my boyfriend won't let me see my friends", "he forced me to",
    ],
    "abuse": ["my uncle is hurting me", "I'm not safe at home", "im scared to go home", "i am being abused"],
}

MUST_NOT_TRIGGER = [
    "I hurt my knee", "im dying to play", "i want to cut onions", "how do i kill a spider",
    "can you share my photos tips for instagram", "post my pics on insta how", "my mom will share my photos on facebook",
    "i will send my photos to the printer", "im hungry, what should I eat", "i ate too much pizza lol",
    "my boyfriend and i had a fight about movies", "I'm not eating breakfast today, no time",
    "how do i take good photos", "my brother keeps taking my charger", "my coach pushes me hard in practice",
    "how to throw a party", "how do i make a budget", "I'm stressed about exams",
]


def main() -> int:
    failures = 0
    total = 0
    for category, messages in MUST_TRIGGER.items():
        for m in messages:
            total += 1
            got = check_crisis(m)
            if not got or got[0] != category:
                failures += 1
                print(f"MISSED   [{category}] {m!r} -> {got and got[0]}")
    for m in MUST_NOT_TRIGGER:
        total += 1
        got = check_crisis(m)
        if got:
            failures += 1
            print(f"FALSE ALARM {m!r} -> {got[0]}")
    for raw, want in [("Sam", "Sam"), ("  Mary-Jane ", "Mary-Jane"), ("<b>Al</b>", "bAlb"), ("O'Neil 123", "O'Neil")]:
        total += 1
        if clean_nickname(raw) != want:
            failures += 1
            print(f"NICKNAME {raw!r} -> {clean_nickname(raw)!r}, wanted {want!r}")
    print(f"{total - failures}/{total} safety checks passed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
