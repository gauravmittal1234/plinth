"""Row types the HARERA parsers produce (platform_architecture §4.1 "Parser vN: HTML or JSON
to records"), and the quarter arithmetic shared by the QPR parsers.

HARERA's quarterly progress report (QPR) regulations put the filing window at 15 days after a
calendar quarter ends (research_notes/.../ncr_risk_data_sources.md, Q1, "HARERA GGM QPR
Regulations 2018"); `qpr_due_date` encodes that. Quarters are named "YYYY-Qn" by calendar
quarter (Apr-Jun = Q2), matching the FactsWriter docstring example and INTEGRATION_NOTES'
"Facts use key_fields=('quarter',)".
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, timedelta

#: Days a promoter has, after quarter end, to file the QPR (platform_architecture §4.2).
QPR_FILING_WINDOW_DAYS = 15

QUARTER_CODE = re.compile(r"^(\d{4})-Q([1-4])$")

#: Calendar-quarter end month and day, by quarter number.
_QUARTER_END = {1: (3, 31), 2: (6, 30), 3: (9, 30), 4: (12, 31)}


def quarter_bounds(quarter: str) -> tuple[date, date]:
    """The (start, end) calendar dates of a "YYYY-Qn" quarter."""
    m = QUARTER_CODE.match(quarter)
    if not m:
        raise ValueError(f"quarter {quarter!r}: expected 'YYYY-Qn'")
    year, q = int(m.group(1)), int(m.group(2))
    start_month = (q - 1) * 3 + 1
    end_month, end_day = _QUARTER_END[q]
    return date(year, start_month, 1), date(year, end_month, end_day)


def qpr_due_date(quarter: str) -> date:
    """The statutory QPR filing deadline for a quarter: its end date plus 15 days."""
    _, end = quarter_bounds(quarter)
    return end + timedelta(days=QPR_FILING_WINDOW_DAYS)


@dataclass(frozen=True)
class RegisteredProjectRow:
    """One row of the HARERA registered-projects list (research notes Q1, "structure and
    jurisdiction": registration no., project, builder, Form A-H link, lapsed/QPR flags)."""

    registration_no: str
    project_name: str
    promoter_name: str
    district: str
    registered_with: str
    form_a_h_url: str | None
    lapsed: bool
    qpr_not_uploaded: bool
    page_ref: str


@dataclass(frozen=True)
class FormAH:
    """Form A-H (REP-I) Part A/B/C fields the pipeline keeps (never a director's phone, email
    or address: DATA_MODEL §1)."""

    registration_no: str
    promoter_name: str
    cin: str | None
    units_total: int | None
    units_booked: int | None
    projected_completion: date | None
    infra_pct_complete: float | None
    page_ref: str


@dataclass(frozen=True)
class QprProgress:
    """One quarter's physical/financial progress, from the QPR POST response."""

    registration_no: str
    quarter: str
    sold_pct: float
    built_pct: float
    time_used_pct: float
    collections_lakh: float | None
    period_label_raw: str
    page_ref: str
    notes: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class QprFiling:
    """Whether a quarter's QPR was filed on time, from the per-project quarter register."""

    registration_no: str
    quarter: str
    filed_at: date
    due_at: date
    page_ref: str

    @property
    def days_late(self) -> int:
        return max(0, (self.filed_at - self.due_at).days)

    @property
    def on_time(self) -> bool:
        return self.filed_at <= self.due_at


@dataclass(frozen=True)
class MissingQpr:
    """A quarter past its due date with no filing on record (not a stored fact: see
    `missing.py`)."""

    registration_no: str
    quarter: str
    due_at: date


@dataclass(frozen=True)
class CorrigendumEntry:
    """One row of the corrigendum popup: extension, OC/CC/PCC, cancellation or sale ban
    (research notes Q1, "HARERA complaints, extensions, OC/CC and judgments")."""

    registration_no: str
    doc_type: str
    entry_date: date
    file_url: str
    remarks: str
    page_ref: str


@dataclass(frozen=True)
class JudgmentRow:
    """One row of the HARERA judgments index."""

    complaint_no: str
    complainant: str
    respondent: str
    complaint_type: str
    decision_date: date
    judgement_url: str
    upload_date: date | None
    page_ref: str
