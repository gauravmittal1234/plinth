"""HTML/JSON to records, against the synthetic fixtures (not real HARERA pages: AGENTS §7)."""

from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from plinth.sources.harera.parsers import (
    UnrecognisedDocument,
    parse_corrigendum,
    parse_form_a_h,
    parse_judgments,
    parse_qpr_detail,
    parse_qpr_register,
    parse_registered_list,
    sniff_doc_type,
)

FIXTURES = Path(__file__).resolve().parent.parent.parent / "fixtures" / "harera"
PAGES = FIXTURES / "pages"


def _read(*parts: str) -> bytes:
    path = FIXTURES
    for part in parts:
        path = path / part
    return path.read_bytes()


def test_sniff_doc_type_reads_the_body_marker() -> None:
    assert sniff_doc_type(_read("pages", "registered_list.html"), "text/html") == (
        "harera.registered_list"
    )
    assert sniff_doc_type(_read("pages", "corrigendum_coral.json"), "application/json") == (
        "harera.corrigendum"
    )


def test_sniff_doc_type_rejects_an_unmarked_document() -> None:
    with pytest.raises(UnrecognisedDocument):
        sniff_doc_type(b"<html><body>hello</body></html>", "text/html")


def test_parse_registered_list() -> None:
    rows = parse_registered_list(_read("pages", "registered_list.html"))
    assert len(rows) == 7
    aurelia = next(r for r in rows if r.registration_no == "GGM/673/405/2022/117")
    assert aurelia.project_name == "Aurelia Heights, Phase 2"
    assert aurelia.promoter_name == "Northfield Estates Pvt Ltd"
    assert aurelia.lapsed is False
    assert aurelia.qpr_not_uploaded is True  # the Jul-Sep 2026 QPR is not on record (DESIGN §5b)
    assert aurelia.form_a_h_url == "fixture://pages/form_a_h_aurelia.html"
    heron = next(r for r in rows if r.registration_no == "GGM/902/634/2026/12")
    assert heron.promoter_name == "Heronstone Projects"


def test_parse_form_a_h() -> None:
    rec = parse_form_a_h(_read("pages", "form_a_h_aurelia.html"))
    assert rec.registration_no == "GGM/673/405/2022/117"
    assert rec.cin == "U45200HR2015PTC123456"
    assert rec.units_total == 500
    assert rec.units_booked == 0
    assert rec.projected_completion == date(2027, 12, 31)
    assert rec.infra_pct_complete == 0.0


def test_parse_qpr_detail_matches_design_5b() -> None:
    rec = parse_qpr_detail(_read("qpr", "aurelia-2026-Q2.html"))
    assert rec.registration_no == "GGM/673/405/2022/117"
    assert rec.quarter == "2026-Q2"
    assert (rec.sold_pct, rec.built_pct, rec.time_used_pct) == (72.0, 41.0, 70.0)


def test_parse_qpr_register() -> None:
    registration_no, pairs = parse_qpr_register(_read("pages", "qpr_register_aurelia.html"))
    assert registration_no == "GGM/673/405/2022/117"
    by_quarter = dict(pairs)
    assert len(pairs) == 12
    assert by_quarter["2026-Q2"] == date(2026, 7, 15)
    assert by_quarter["2026-Q3"] is None  # not yet filed (DESIGN §5b "pending public fact")
    assert by_quarter["2024-Q3"] == date(2024, 10, 27)  # the 12-days-late quarter


def test_parse_corrigendum() -> None:
    entries = parse_corrigendum(_read("pages", "corrigendum_coral.json"))
    assert [e.doc_type for e in entries] == ["Extension (EXT)", "Extension (EXT)"]
    assert entries[0].registration_no == "GGM/610/290/2019/45"
    assert entries[1].entry_date == date(2026, 10, 14)  # DESIGN §5b: "granted 14 Oct 2026"


def test_parse_judgments() -> None:
    rows = parse_judgments(_read("pages", "judgments.html"))
    assert len(rows) == 3
    latest = max(rows, key=lambda r: r.decision_date)
    assert latest.decision_date == date(2026, 10, 9)  # DESIGN §5b: "latest order is dated 9 Oct"
    assert latest.respondent == "Northfield Estates Pvt Ltd"
