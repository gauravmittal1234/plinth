"""Validators: dirty cases the real portal has shipped (research notes Q1), on the
synthetic Laurel Residency fixture built for exactly this (qpr/laurel-2026-Q2-dirty.html)."""

from __future__ import annotations

from pathlib import Path

from plinth.sources.harera.parsers import parse_qpr_detail
from plinth.sources.harera.validate import check_period_label, validate_qpr_progress

FIXTURES = Path(__file__).resolve().parent.parent.parent / "fixtures" / "harera"


def test_check_period_label_accepts_valid_dates() -> None:
    assert check_period_label("01/04/2026 to 30/06/2026") is None


def test_check_period_label_flags_an_impossible_date() -> None:
    note = check_period_label("01/04/2026 to 31/06/2026")
    assert note is not None
    assert "31/06/2026" in note


def test_check_period_label_flags_unparseable_text() -> None:
    assert check_period_label("Q2 2026") is not None


def test_clean_quarter_has_no_notes() -> None:
    body = (FIXTURES / "qpr" / "aurelia-2026-Q2.html").read_bytes()
    rec = parse_qpr_detail(body)
    assert validate_qpr_progress(rec) == []


def test_dirty_quarter_flags_the_bad_date_and_the_negative_collections() -> None:
    body = (FIXTURES / "qpr" / "laurel-2026-Q2-dirty.html").read_bytes()
    rec = parse_qpr_detail(body)
    notes = validate_qpr_progress(rec)
    assert any("31/06/2026" in n for n in notes)
    assert any("negative" in n for n in notes)
    # time_used_pct > 100% is a real "already overdue" signal, not a data error (DESIGN §5b).
    assert not any("time_used_pct" in n for n in notes)
