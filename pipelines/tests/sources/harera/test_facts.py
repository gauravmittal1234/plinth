"""Record -> FactDraft builders: lane, method, key_fields and page refs."""

from __future__ import annotations

from datetime import date

from plinth_contracts import Lane

from plinth.sources.harera.facts import (
    corrigendum_fact,
    form_a_h_fact,
    judgment_fact,
    qpr_filing_fact,
    qpr_progress_fact,
    registration_fact,
)
from plinth.sources.harera.records import (
    CorrigendumEntry,
    FormAH,
    JudgmentRow,
    QprFiling,
    QprProgress,
    RegisteredProjectRow,
)

REG = "GGM/673/405/2022/117"


def test_registration_fact_is_a_single_current_version() -> None:
    row = RegisteredProjectRow(
        REG,
        "Aurelia Heights, Phase 2",
        "Northfield Estates Pvt Ltd",
        "Gurugram",
        "HRERA",
        None,
        False,
        True,
        "row 1",
    )
    draft = registration_fact(row, snapshot_id="snap-1")
    assert draft.subject_type == "registration"
    assert draft.subject_id == REG
    assert draft.attribute == "harera.registration"
    assert draft.lane is Lane.records_show
    assert draft.method == "parser"
    assert draft.key_fields == ()
    assert draft.page_ref == "row 1"
    assert draft.value["qpr_not_uploaded"] is True


def test_form_a_h_fact() -> None:
    rec = FormAH(
        REG,
        "Northfield Estates Pvt Ltd",
        "U45200HR2015PTC123456",
        500,
        0,
        date(2027, 12, 31),
        0.0,
        "Form A-H Part C",
    )
    draft = form_a_h_fact(rec, snapshot_id="snap-2")
    assert draft.attribute == "harera.form_a_h"
    assert draft.value["projected_completion"] == "2027-12-31"
    assert draft.value["units_total"] == 500


def test_qpr_progress_fact_carries_the_quarter_as_key_field_and_as_of() -> None:
    rec = QprProgress(REG, "2026-Q2", 72.0, 41.0, 70.0, 205.0, "01/04/2026 to 30/06/2026", "p")
    draft = qpr_progress_fact(rec, snapshot_id="snap-3", quarter_end=date(2026, 6, 30))
    assert draft.key_fields == ("quarter",)
    assert draft.as_of == date(2026, 6, 30)
    assert draft.value["sold_pct"] == 72.0
    assert draft.read_note is None  # a clean quarter


def test_qpr_progress_fact_carries_validator_notes() -> None:
    rec = QprProgress(REG, "2026-Q2", 45.0, 34.0, 106.0, -572.98, "01/04/2026 to 31/06/2026", "p")
    draft = qpr_progress_fact(rec, snapshot_id="snap-3", quarter_end=date(2026, 6, 30))
    assert draft.read_note
    assert "31/06/2026" in draft.read_note
    assert "negative" in draft.read_note


def test_qpr_filing_fact() -> None:
    rec = QprFiling(REG, "2024-Q3", date(2024, 10, 27), date(2024, 10, 15), "qpr-register 2024-Q3")
    draft = qpr_filing_fact(rec, snapshot_id="snap-4")
    assert draft.key_fields == ("quarter",)
    assert draft.value["on_time"] is False
    assert draft.value["days_late"] == 12
    assert draft.as_of == date(2024, 10, 27)


def test_corrigendum_fact_keys_by_doc_type_and_entry_date() -> None:
    rec = CorrigendumEntry(
        "GGM/610/290/2019/45",
        "Extension (EXT)",
        date(2026, 10, 14),
        "fixture://x.pdf",
        "Revised completion.",
        "corrigendum entry 1",
    )
    draft = corrigendum_fact(rec, snapshot_id="snap-5")
    assert draft.key_fields == ("doc_type", "entry_date")
    assert draft.subject_id == "GGM/610/290/2019/45"


def test_judgment_fact_subject_is_the_developer() -> None:
    rec = JudgmentRow(
        "CR/GGM/4821/2026",
        "Allottee (withheld)",
        "Northfield Estates Pvt Ltd",
        "complaint",
        date(2026, 10, 9),
        "fixture://judgment.pdf",
        date(2026, 10, 10),
        "row 1",
    )
    draft = judgment_fact(rec, snapshot_id="snap-6")
    assert draft.subject_type == "developer"
    assert draft.subject_id == "Northfield Estates Pvt Ltd"
    assert draft.key_fields == ("complaint_no",)
