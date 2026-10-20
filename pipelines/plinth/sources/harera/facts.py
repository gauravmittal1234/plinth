"""Records to facts, with page refs (brief T18 Build: "Parsers -> records -> facts with page
refs"). One `FactDraft` builder per record type; `plinth.core.facts.FactsWriter` does the
bitemporal supersede bookkeeping. Every draft uses `lane=records_show` (Lane default) and
`method="parser"`: these are read off an official HARERA document, not estimated or manual.

A registration's own corrigendum/judgment history can hold more than one current entry at
once (two extensions, several complaints): each gets `key_fields` wide enough to tell its
versions apart (`doc_type`+`entry_date`, or `complaint_no`) so one entry never supersedes
another by mistake.
"""

from __future__ import annotations

from datetime import date

from plinth.core.facts import FactDraft

from .records import (
    CorrigendumEntry,
    FormAH,
    JudgmentRow,
    QprFiling,
    QprProgress,
    RegisteredProjectRow,
)
from .validate import validate_qpr_progress


def registration_fact(row: RegisteredProjectRow, *, snapshot_id: str) -> FactDraft:
    return FactDraft(
        subject_type="registration",
        subject_id=row.registration_no,
        attribute="harera.registration",
        value={
            "project_name": row.project_name,
            "promoter_name": row.promoter_name,
            "district": row.district,
            "registered_with": row.registered_with,
            "form_a_h_url": row.form_a_h_url,
            "lapsed": row.lapsed,
            "qpr_not_uploaded": row.qpr_not_uploaded,
        },
        snapshot_id=snapshot_id,
        page_ref=row.page_ref,
        extract_text=f"{row.project_name}, {row.promoter_name} ({row.registration_no}).",
    )


def form_a_h_fact(rec: FormAH, *, snapshot_id: str) -> FactDraft:
    return FactDraft(
        subject_type="registration",
        subject_id=rec.registration_no,
        attribute="harera.form_a_h",
        value={
            "promoter_name": rec.promoter_name,
            "cin": rec.cin,
            "units_total": rec.units_total,
            "units_booked": rec.units_booked,
            "projected_completion": rec.projected_completion.isoformat()
            if rec.projected_completion
            else None,
            "infra_pct_complete": rec.infra_pct_complete,
        },
        snapshot_id=snapshot_id,
        page_ref=rec.page_ref,
        extract_text=f"{rec.units_total} units; projected completion "
        f"{rec.projected_completion.isoformat() if rec.projected_completion else 'unknown'}.",
    )


def qpr_progress_fact(rec: QprProgress, *, snapshot_id: str, quarter_end: date) -> FactDraft:
    notes = validate_qpr_progress(rec)
    return FactDraft(
        subject_type="registration",
        subject_id=rec.registration_no,
        attribute="qpr.progress",
        value={
            "quarter": rec.quarter,
            "sold_pct": rec.sold_pct,
            "built_pct": rec.built_pct,
            "time_used_pct": rec.time_used_pct,
            "collections_lakh": rec.collections_lakh,
        },
        as_of=quarter_end,
        snapshot_id=snapshot_id,
        page_ref=rec.page_ref,
        extract_text=f"{rec.quarter}: sold {rec.sold_pct:g}%, built {rec.built_pct:g}%, "
        f"time used {rec.time_used_pct:g}%.",
        read_note="; ".join(notes) or None,
        key_fields=("quarter",),
    )


def qpr_filing_fact(rec: QprFiling, *, snapshot_id: str) -> FactDraft:
    return FactDraft(
        subject_type="registration",
        subject_id=rec.registration_no,
        attribute="qpr.filing",
        value={
            "quarter": rec.quarter,
            "filed_at": rec.filed_at.isoformat(),
            "due_at": rec.due_at.isoformat(),
            "on_time": rec.on_time,
            "days_late": rec.days_late,
        },
        as_of=rec.filed_at,
        snapshot_id=snapshot_id,
        page_ref=rec.page_ref,
        extract_text=f"{rec.quarter} QPR filed {rec.filed_at.isoformat()}"
        + ("." if rec.on_time else f", {rec.days_late} day(s) late."),
        key_fields=("quarter",),
    )


def corrigendum_fact(rec: CorrigendumEntry, *, snapshot_id: str) -> FactDraft:
    return FactDraft(
        subject_type="registration",
        subject_id=rec.registration_no,
        attribute="harera.corrigendum",
        value={
            "doc_type": rec.doc_type,
            "entry_date": rec.entry_date.isoformat(),
            "file_url": rec.file_url,
            "remarks": rec.remarks,
        },
        as_of=rec.entry_date,
        snapshot_id=snapshot_id,
        page_ref=rec.page_ref,
        extract_text=f"{rec.doc_type} entered {rec.entry_date.isoformat()}: {rec.remarks}",
        key_fields=("doc_type", "entry_date"),
    )


def judgment_fact(rec: JudgmentRow, *, snapshot_id: str) -> FactDraft:
    return FactDraft(
        subject_type="developer",
        subject_id=rec.respondent,
        attribute="harera.judgment",
        value={
            "complaint_no": rec.complaint_no,
            "complaint_type": rec.complaint_type,
            "decision_date": rec.decision_date.isoformat(),
            "judgement_url": rec.judgement_url,
        },
        as_of=rec.decision_date,
        snapshot_id=snapshot_id,
        page_ref=rec.page_ref,
        extract_text=f"{rec.complaint_type} {rec.complaint_no} decided "
        f"{rec.decision_date.isoformat()}.",
        key_fields=("complaint_no",),
    )
