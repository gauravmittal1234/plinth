"""Quarter arithmetic: calendar bounds and the 15-day QPR filing deadline."""

from __future__ import annotations

from datetime import date

import pytest

from plinth.sources.harera.records import QprFiling, qpr_due_date, quarter_bounds


@pytest.mark.parametrize(
    ("quarter", "start", "end"),
    [
        ("2026-Q2", date(2026, 4, 1), date(2026, 6, 30)),
        ("2026-Q1", date(2026, 1, 1), date(2026, 3, 31)),
        ("2024-Q4", date(2024, 10, 1), date(2024, 12, 31)),
    ],
)
def test_quarter_bounds(quarter: str, start: date, end: date) -> None:
    assert quarter_bounds(quarter) == (start, end)


def test_quarter_bounds_rejects_bad_codes() -> None:
    with pytest.raises(ValueError, match="YYYY-Qn"):
        quarter_bounds("2026-Q5")
    with pytest.raises(ValueError, match="YYYY-Qn"):
        quarter_bounds("Apr-Jun 2026")


def test_qpr_due_date_is_15_days_after_quarter_end() -> None:
    # DESIGN §5b: the Apr-Jun 2026 QPR was "Filed 15 Jul 2026, on time" -- exactly the deadline.
    assert qpr_due_date("2026-Q2") == date(2026, 7, 15)
    assert qpr_due_date("2026-Q3") == date(2026, 10, 15)


def test_qpr_filing_on_time_and_days_late() -> None:
    on_time = QprFiling("REG-1", "2026-Q2", date(2026, 7, 15), date(2026, 7, 15), "p1")
    assert on_time.on_time is True
    assert on_time.days_late == 0

    late = QprFiling("REG-1", "2024-Q3", date(2024, 10, 27), date(2024, 10, 15), "p2")
    assert late.on_time is False
    assert late.days_late == 12
