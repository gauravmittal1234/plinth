"""Missing-QPR detection by due date (brief T18 Build).

A quarter is overdue when today (the run's `as_of`) is past its statutory due date
(`records.qpr_due_date`) and no filing is on record for it. This is deliberately **not**
written through `FactsWriter`: it is an absence, not a reading of a document, so it has no
snapshot to cite. It is a run-time signal (like `ops.job_runs` / the freshness alert in
platform_architecture §4.1), reported alongside facts by `plinth-pipe harera run`, not stored
as a `core.facts` row. DESIGN §5b: the Jul-Sep 2026 QPR was due 15 Oct 2026 and was "not on
HARERA as of 18 Oct 2026" -- a buyer-visible fact precisely because nothing was filed to read.
"""

from __future__ import annotations

from collections.abc import Iterable
from datetime import date

from .records import MissingQpr, qpr_due_date


def missing_qprs(
    registration_no: str,
    *,
    quarters: Iterable[str],
    filed: Iterable[str],
    as_of: date,
) -> list[MissingQpr]:
    """Every quarter in `quarters` that is overdue and absent from `filed`, as of `as_of`.

    `quarters` is every quarter the registration is expected to have filed (the project's
    quarter register, platform_architecture §4.2); `filed` is the quarters a filing was found
    for (`QprFiling.quarter`). Order follows `quarters`.
    """
    filed_set = set(filed)
    out: list[MissingQpr] = []
    for quarter in quarters:
        if quarter in filed_set:
            continue
        due = qpr_due_date(quarter)
        if due <= as_of:
            out.append(MissingQpr(registration_no, quarter, due))
    return out
