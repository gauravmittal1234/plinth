"""Month, quarter and display helpers for scoring.

Every formatter here mirrors `packages/fixtures/src/author/lib.mjs` and the golden
vectors in `packages/fixtures/vectors` (time used, Late12, formatting):

- month-based time used (BUILD_PLAN §7.1), rounded half up;
- QPR due date = the 15th of the month after the quarter ends;
- "18 Oct 2026", "Oct 2026", and quarters as "Apr-Jun 2026" written with an en dash.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from itertools import pairwise

IST = timezone(timedelta(hours=5, minutes=30))
EN_DASH = chr(0x2013)  # quarters read "Apr\N{EN DASH}Jun 2026" on every surface
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")


def round_half_up(x: float | Decimal, places: int = 0) -> Decimal:
    """Round like JavaScript's Math.round on positive numbers (2.5 -> 3), not banker's rounding."""
    q = Decimal(1).scaleb(-places)
    return Decimal(str(x)).quantize(q, rounding=ROUND_HALF_UP)


def pct_half_up(numerator: int, denominator: int) -> int:
    """round_half_up(100 * numerator / denominator) with exact arithmetic."""
    value = Decimal(100 * numerator) / Decimal(denominator)
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def month_index(d: date) -> int:
    return d.year * 12 + d.month - 1


def months_between(a: date, b: date) -> int:
    """Whole calendar months from a's month to b's month (days ignored)."""
    return month_index(b) - month_index(a)


def add_months(d: date, k: int) -> date:
    """The first day of the month k months after d's month."""
    t = month_index(d) + k
    return date(t // 12, t % 12 + 1, 1)


def add_months_same_day(d: date, k: int) -> date:
    """d plus k calendar months, clamped to the month's last day (28 Apr + 6 -> 28 Oct)."""
    first = add_months(d, k)
    nxt = add_months(first, 1)
    last_day = (nxt - timedelta(days=1)).day
    return date(first.year, first.month, min(d.day, last_day))


def time_used_pct(registered: date, original_completion: date, reference: date) -> int:
    """Month-based time used (BUILD_PLAN §7.1), rounded half up to a whole percent."""
    return pct_half_up(
        months_between(registered, reference), months_between(registered, original_completion)
    )


def quarter_of(q: str) -> tuple[int, int]:
    year, qq = q.split("-Q")
    return int(year), int(qq)


def quarter_key(q: str) -> int:
    y, qq = quarter_of(q)
    return y * 4 + qq - 1


def quarter_end_month(q: str) -> date:
    y, qq = quarter_of(q)
    return date(y, qq * 3, 1)


def qpr_due(q: str) -> date:
    """The 15th of the month after the quarter ends (DESIGN §5b: Jul-Sep due 15 Oct)."""
    m = add_months(quarter_end_month(q), 1)
    return date(m.year, m.month, 15)


def consecutive(quarters: list[str]) -> bool:
    keys = [quarter_key(q) for q in quarters]
    return all(b - a == 1 for a, b in pairwise(keys))


def fmt_date(d: date) -> str:
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def fmt_month(d: date) -> str:
    return f"{MONTHS[d.month - 1]} {d.year}"


def fmt_quarter(q: str) -> str:
    y, qq = quarter_of(q)
    a = (qq - 1) * 3
    return f"{MONTHS[a]}{EN_DASH}{MONTHS[a + 2]} {y}"


def start_of_day(d: date) -> datetime:
    return datetime.combine(d, time(0, 0), tzinfo=IST)


def end_of_day(d: date) -> datetime:
    return datetime.combine(d, time(23, 59, 59, 999999), tzinfo=IST)


def ist_date(dt: datetime) -> date:
    return dt.astimezone(IST).date()


def iso_ist(dt: datetime) -> str:
    """'2026-10-19T19:40:00+05:30', as the fixtures write instants."""
    return dt.astimezone(IST).isoformat(timespec="seconds")


def days_between(a: date, b: date) -> int:
    return (b - a).days


def parse_instant(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt
