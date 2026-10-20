"""The pipeline clock (BUILD_PLAN §1 rule 1, WORK_BREAKDOWN §1 rule 7).

Fixture mode and tests run on a frozen clock, 18 Oct 2026 12:00 IST (the design "today";
data as of 14 Oct 2026). Live mode uses the system clock. Every timestamp the pipelines
write (`fetched_at`, `learned_at`, job runs) comes from a `Clock`, never from
`datetime.now()` directly, so fixture runs are reproducible byte for byte.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta, timezone
from typing import Protocol

#: India has no daylight saving: a fixed +05:30 offset needs no tz database.
IST = timezone(timedelta(hours=5, minutes=30), "IST")

#: The frozen "today" of the fixture world (DESIGN §5b, BUILD_PLAN §1 rule 1).
FROZEN_NOW = datetime(2026, 10, 18, 12, 0, tzinfo=IST)


class Clock(Protocol):
    """Anything that tells the time. Always timezone-aware."""

    def now(self) -> datetime: ...


@dataclass(frozen=True)
class FrozenClock:
    """A clock that never moves (fixture mode and tests)."""

    at: datetime = FROZEN_NOW

    def __post_init__(self) -> None:
        require_aware(self.at, "FrozenClock.at")

    def now(self) -> datetime:
        return self.at


class SystemClock:
    """The real clock (live mode), in UTC."""

    def now(self) -> datetime:
        return datetime.now(UTC)


def require_aware(value: datetime, what: str) -> datetime:
    """Refuse naive datetimes: every pipeline timestamp carries an offset."""
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{what} must be timezone-aware (got {value.isoformat()})")
    return value


def parse_instant(text: str) -> datetime:
    """An ISO 8601 instant with an offset, e.g. 2026-10-18T12:00:00+05:30 (Z is accepted)."""
    raw = text.strip()
    if raw.endswith(("Z", "z")):
        raw = raw[:-1] + "+00:00"
    return require_aware(datetime.fromisoformat(raw), f"instant {text!r}")


def today_ist(clock: Clock) -> date:
    """The IST calendar date of the clock's current instant (ops.today() in SQL)."""
    return clock.now().astimezone(IST).date()
