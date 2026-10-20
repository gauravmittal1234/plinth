"""PII stripper: phone numbers and email addresses out of extracted text.

platform_architecture §4.1 ("Validate: ... strip personal data") and DATA_MODEL §1 (directors:
"never phones or addresses, though HARERA shows them"). It runs on every fact's extract text
and string values before insert (`FactsWriter`) and on job-run error messages. Public-record
identifiers stay: RERA numbers, case numbers, CINs, IFSCs, bank account numbers of the
registered collection account (DATA_MODEL §1), dates, quarters and rupee amounts.

What counts as a phone number:
- anything written with the India code: `+91 ...`, `0091 ...`, `91-...` followed by 10 digits;
- a bare 10-digit mobile number starting 6-9, optionally split 5+5 (`99000 00318`) or with a
  leading 0 (`09900000318`);
- a landline with its STD code and a separator (`0124-4567890`, `011 23456789`).

A digit run that is part of a longer number (an account number) never matches, and a bare
number right after a money word (₹, Rs, amount, collected, total ...) or a minus sign is
an amount, not a phone: QPR collections can run to 10 digits and can be negative.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

PHONE_TOKEN = "[phone removed]"
EMAIL_TOKEN = "[email removed]"

_SEP = r"[ \t.\-]?"
_EMAIL = re.compile(
    r"(?<![\w.%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}(?![\w-])"
)
# With the India code (+91, 0091, 91, "(+91)"): always a phone, mobile or landline.
_COUNTRY = re.compile(
    r"(?<![\w+/])(?:\(\s*(?:\+|00)?91\s*\)|(?:\+|00)?91)"
    + _SEP
    + r"(?:\(0\)"
    + _SEP
    + r")?\d(?:"
    + _SEP
    + r"\d){9}(?![\d/])"
)
# Without it: a bare mobile (6-9, optional leading 0, optional 5+5 split) or an STD landline.
_BARE = (
    re.compile(r"(?<![\w/])0?[6-9]\d{4}" + _SEP + r"\d{5}(?![\w/]|[.,]\d)"),
    re.compile(r"(?<![\w/])0\d{2,4}[ \t\-]\d{6,8}(?![\w/]|[.,]\d)"),
)
# A bare number right after a money word is an amount (QPR collections can be 10 digits).
_MONEY_BEFORE = re.compile(
    r"(?:\N{INDIAN RUPEE SIGN}|\brs\.?|\binr|amount|collect\w*|withdr\w*|cost|price|sum"
    r"|total|balance|value)[\s:=()]*-?\s*$",
    re.IGNORECASE,
)


def _bare_phone(match: re.Match[str]) -> str:
    before = match.string[max(0, match.start() - 32) : match.start()]
    if before.endswith("-") and not before[-2:-1].isalpha():
        return match.group(0)  # a minus sign: negative collections are data, not a phone
    if _MONEY_BEFORE.search(before):
        return match.group(0)
    return PHONE_TOKEN


@dataclass(frozen=True)
class PiiResult:
    text: str
    phones: int
    emails: int

    @property
    def stripped(self) -> int:
        return self.phones + self.emails


def strip_pii(text: str) -> PiiResult:
    """Replace phone numbers and emails with fixed tokens. Idempotent."""
    out, emails = _EMAIL.subn(EMAIL_TOKEN, text)
    out, phones = _COUNTRY.subn(PHONE_TOKEN, out)
    for pattern in _BARE:
        replaced = pattern.sub(_bare_phone, out)
        phones += replaced.count(PHONE_TOKEN) - out.count(PHONE_TOKEN)
        out = replaced
    return PiiResult(out, phones, emails)


type Json = bool | int | float | str | list[Json] | dict[str, Json] | None


def strip_pii_json(value: Json) -> tuple[Json, int]:
    """Strip every string leaf of a JSON value. Returns the new value and the count removed."""
    if isinstance(value, str):
        r = strip_pii(value)
        return r.text, r.stripped
    if isinstance(value, list):
        total = 0
        items: list[Json] = []
        for item in value:
            new, n = strip_pii_json(item)
            items.append(new)
            total += n
        return items, total
    if isinstance(value, dict):
        total = 0
        obj: dict[str, Json] = {}
        for key, item in value.items():
            new, n = strip_pii_json(item)
            obj[key] = new
            total += n
        return obj, total
    return value, 0
