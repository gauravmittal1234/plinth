"""Missing-QPR detection by due date (brief T18 Build)."""

from __future__ import annotations

from datetime import date

from plinth.sources.harera.missing import missing_qprs
from plinth.sources.harera.records import MissingQpr

REG = "GGM/673/405/2022/117"
QUARTERS = ["2026-Q1", "2026-Q2", "2026-Q3"]
FILED = ["2026-Q1", "2026-Q2"]


def test_not_due_yet_is_not_missing() -> None:
    # 2026-Q3 (Jul-Sep 2026) is due 15 Oct 2026; DESIGN §5b's data cutoff is 14 Oct 2026.
    assert missing_qprs(REG, quarters=QUARTERS, filed=FILED, as_of=date(2026, 10, 14)) == []


def test_overdue_and_unfiled_is_missing() -> None:
    # DESIGN §5b: "not on HARERA as of 18 Oct 2026".
    assert missing_qprs(REG, quarters=QUARTERS, filed=FILED, as_of=date(2026, 10, 18)) == [
        MissingQpr(REG, "2026-Q3", date(2026, 10, 15))
    ]


def test_due_today_is_already_missing() -> None:
    assert missing_qprs(REG, quarters=QUARTERS, filed=FILED, as_of=date(2026, 10, 15)) == [
        MissingQpr(REG, "2026-Q3", date(2026, 10, 15))
    ]


def test_a_filed_quarter_is_never_missing_even_long_after_its_due_date() -> None:
    assert missing_qprs(REG, quarters=QUARTERS, filed=QUARTERS, as_of=date(2030, 1, 1)) == []
