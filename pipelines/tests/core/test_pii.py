"""PII stripper: "+91 98..." and emails go; public-record identifiers stay.

Test numbers follow the fixture convention (`+91 99000 00xxx`, API_CONTRACTS §5.4) and test
addresses use reserved domains (example.com, example.test), so no real person is named.
"""

from __future__ import annotations

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from plinth.core.pii import EMAIL_TOKEN, PHONE_TOKEN, strip_pii, strip_pii_json

PHONES = [
    "+91 99000 00318",
    "+919900000318",
    "+91-99000-00318",
    "+91 98000 00318",
    "+91 (0) 99000 00318",
    "(+91) 99000 00318",
    "0091 9900000318",
    "91 99000 00318",
    "9900000318",
    "09900000318",
    "99000-00318",
    "99000 00318",
    "0124-4000318",
    "011 40000318",
    "+91 124 400 0318",
]
EMAILS = ["sales@example.com", "first.last+site@sub.example.co.in", "ops_desk@example.test"]

# Public record or data that must survive untouched.
KEEP = [
    "GGM/673/405/2022/117",
    "RERA-GRG-PROJ-123-2019",
    "HRERA-PKL-GGM-123-2019",
    "50200071824417",
    "PEPL0000418",
    "U70109HR2015PTC012345",
    "₹1,67,20,000",
    "₹2.74 Cr",
    "2,74,00,400",
    "27400400",
    "₹27400400",
    "18/10/2026",
    "31/06/2026",
    "12.03.2023",
    "2026-10-18T12:00:00+05:30",
    "2026-Q2",
    "Apr\N{EN DASH}Jun 2026",
    "CR/1234/2025",
    "Complaint No. 6123 of 2024",
    "500 units",
    "Between 30 and 45 of 100",
    "+91 99••• ••318",
    "18,900/sq ft",
    "lat 28.4595, lng 77.0266",
    "ID 9876543210123",
    "Amount collected: 6543210987",
    "Total collections (INR): 7654321098",
    "Rs. 7654321098",
    "₹ 8765432109",
    "withdrawn from escrow -6543210987",
    "6543210987.00",
    "Percentage of work completed: 41%. Units booked: 72%.",
]


@pytest.mark.parametrize("phone", PHONES)
def test_phone_numbers_are_stripped(phone: str) -> None:
    result = strip_pii(f"Site office: {phone}, open 10 to 6.")
    assert result.text == f"Site office: {PHONE_TOKEN}, open 10 to 6."
    assert (result.phones, result.emails) == (1, 0)


def test_the_task_example_is_stripped() -> None:
    assert strip_pii("Call +91 98000 00318 for a visit").text == f"Call {PHONE_TOKEN} for a visit"


@pytest.mark.parametrize("email", EMAILS)
def test_emails_are_stripped(email: str) -> None:
    result = strip_pii(f"Write to {email}.")
    assert result.text == f"Write to {EMAIL_TOKEN}."
    assert (result.phones, result.emails) == (0, 1)


@pytest.mark.parametrize("text", KEEP)
def test_public_record_values_are_kept(text: str) -> None:
    result = strip_pii(text)
    assert result.text == text
    assert result.stripped == 0


def test_several_in_one_line() -> None:
    text = "Ph. 9900000318, 9900000319 / Mob-99000 00320 / sales@example.com; a/c 50200071824417"
    result = strip_pii(text)
    assert result.text == (
        f"Ph. {PHONE_TOKEN}, {PHONE_TOKEN} / Mob-{PHONE_TOKEN} / {EMAIL_TOKEN}; a/c 50200071824417"
    )
    assert (result.phones, result.emails) == (3, 1)


def test_json_values_are_stripped_leaf_by_leaf() -> None:
    value, n = strip_pii_json(
        {"a": ["+91 99000 00318", 7, None, True], "b": {"c": "x@example.com"}, "d": 2.5}
    )
    assert value == {"a": [PHONE_TOKEN, 7, None, True], "b": {"c": EMAIL_TOKEN}, "d": 2.5}
    assert n == 2


@settings(max_examples=300, deadline=None)
@given(
    prefix=st.text(alphabet="abcdefghij ,.;:", max_size=20),
    country=st.sampled_from(["+91 ", "+91-", "+91", "0091 ", "", "0"]),
    first=st.sampled_from("6789"),
    rest=st.text(alphabet="0123456789", min_size=9, max_size=9),
    split=st.booleans(),
    suffix=st.text(alphabet="abcdefghij ,;:", max_size=20),
)
def test_property_mobile_numbers_never_survive(
    prefix: str, country: str, first: str, rest: str, split: bool, suffix: str
) -> None:
    digits = first + rest
    number = f"{digits[:5]} {digits[5:]}" if split else digits
    text = f"{prefix} {country}{number} {suffix}"
    out = strip_pii(text).text
    assert digits not in out.replace(" ", "")
    assert strip_pii(out).text == out  # idempotent


@settings(max_examples=200, deadline=None)
@given(st.text(max_size=200))
def test_property_idempotent_on_any_text(text: str) -> None:
    once = strip_pii(text).text
    assert strip_pii(once).text == once
