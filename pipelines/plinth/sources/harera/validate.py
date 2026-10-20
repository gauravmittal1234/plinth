"""Validators for the dirty data HARERA is known to publish (research notes Q1, "Data-quality
problems... a negative 'amount collected from allottees'... an impossible period label"; brief
T18 Build: "dirty cases (negative collections, '31/06/2026')").

These never raise and never drop a record: a flaky portal value still becomes a fact, just one
with a `read_note` so a reviewer (or the admin evidence pack, platform_architecture §4.3) can
see what looked wrong. Only `check_period_label` can report the record unusable for date math
(no valid calendar date to derive a quarter from).
"""

from __future__ import annotations

import re
from datetime import date

from .records import QprProgress

_PERIOD = re.compile(r"(\d{1,2})/(\d{1,2})/(\d{4})\s*(?:to|-)\s*(\d{1,2})/(\d{1,2})/(\d{4})")

#: Physical/financial progress is a share of the whole: outside 0-100 is a parser or portal bug.
#: time_used_pct is excluded: elapsed time over the *original* promised time can legitimately
#: run past 100% (DESIGN §5b: Laurel Residency is "106% of the promised time used today"), so
#: that is a real-world risk signal, not a data error. Only a negative value is flagged there.
_PCT_FIELDS = ("sold_pct", "built_pct")


def check_period_label(label: str) -> str | None:
    """None if `label` names two valid calendar dates; otherwise a note describing the problem.

    HARERA's QPR period label is free text such as "01/04/2026 to 30/06/2026". The portal has
    shipped impossible ones, e.g. "31/06/2026" (June has 30 days).
    """
    m = _PERIOD.search(label)
    if not m:
        return f"period label {label!r} does not match DD/MM/YYYY to DD/MM/YYYY"
    d1, m1, y1, d2, m2, y2 = (int(g) for g in m.groups())
    for d, mo, y in ((d1, m1, y1), (d2, m2, y2)):
        try:
            date(y, mo, d)
        except ValueError:
            return f"period label {label!r} names an impossible date: {d:02d}/{mo:02d}/{y}"
    return None


def validate_qpr_progress(rec: QprProgress) -> list[str]:
    """Every problem found in one QPR progress record. Empty means nothing to flag."""
    notes: list[str] = []
    period_note = check_period_label(rec.period_label_raw)
    if period_note:
        notes.append(period_note)
    for name in _PCT_FIELDS:
        value = getattr(rec, name)
        if not 0 <= value <= 100:
            notes.append(f"{name}={value} is outside 0-100")
    if rec.time_used_pct < 0:
        notes.append(f"time_used_pct={rec.time_used_pct} is negative")
    if rec.collections_lakh is not None and rec.collections_lakh < 0:
        notes.append(
            f"collections_lakh={rec.collections_lakh} is negative (a refund, reversal, or a "
            "portal data-entry error; kept as reported, not corrected)"
        )
    return notes
