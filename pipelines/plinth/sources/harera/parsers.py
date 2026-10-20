"""HTML/JSON to records (platform_architecture §4.1 "Parser vN: HTML or JSON to records").

Every synthetic fixture names its own document type so the pipeline can dispatch without
guessing from the URL: an HTML page carries `<body data-doc="harera.<type>">`, a JSON document
carries a top-level `"schema": "harera.<type>/1"`. `sniff_doc_type` reads either.

Field layout (deliberately simple, so a hand-authored fixture stays readable):
- list-shaped pages (registered list, judgments index) are one `<table>` of header + rows;
- single-record pages (Form A-H, one QPR quarter, the quarter register) are a `<table>` of
  `<tr data-field="...">` rows, one field per row.

None of this is HARERA's real markup (unknown: the portal was never fetched for this task --
AGENTS.md §7, the hard "no live network access" rule). It is shaped from the field lists in
research_notes/.../ncr_risk_data_sources.md (Q1) and platform_architecture §4.2-§4.3.
"""

from __future__ import annotations

import json
from datetime import date

from lxml import html

from .records import (
    CorrigendumEntry,
    FormAH,
    JudgmentRow,
    QprProgress,
    RegisteredProjectRow,
)

DOC_TYPES = (
    "harera.registered_list",
    "harera.form_a_h",
    "harera.qpr_detail",
    "harera.qpr_register",
    "harera.corrigendum",
    "harera.judgments",
)


class UnrecognisedDocument(ValueError):
    """The fixture names no known `data-doc` / `schema`, or the field layout does not match."""


def sniff_doc_type(body: bytes, content_type: str | None) -> str:
    text = body.decode("utf-8")
    if (content_type and "json" in content_type) or text.lstrip().startswith("{"):
        doc = json.loads(text)
        schema = str(doc.get("schema", ""))
        doc_type = schema.split("/", 1)[0]
    else:
        root = html.fromstring(text)
        found = root.xpath("string(//body/@data-doc)")
        doc_type = str(found)
    if doc_type not in DOC_TYPES:
        raise UnrecognisedDocument(f"no recognised data-doc/schema in document (got {doc_type!r})")
    return doc_type


def _field_rows(body: bytes) -> dict[str, str]:
    root = html.fromstring(body.decode("utf-8"))
    out: dict[str, str] = {}
    for row in root.xpath("//tr[@data-field]"):
        key = row.get("data-field")
        value = row.xpath("string(.//td)").strip()
        out[key] = value
    return out


def _opt_int(value: str) -> int | None:
    return int(value) if value.strip() else None


def _opt_float(value: str) -> float | None:
    return float(value) if value.strip() else None


def _opt_date(value: str) -> date | None:
    return date.fromisoformat(value.strip()) if value.strip() else None


def parse_registered_list(body: bytes) -> list[RegisteredProjectRow]:
    """The registered-projects list: one row per registration (research notes Q1)."""
    root = html.fromstring(body.decode("utf-8"))
    table = root.xpath('//table[@id="registered-projects"]')[0]
    rows: list[RegisteredProjectRow] = []
    for i, tr in enumerate(table.xpath(".//tbody/tr"), start=1):
        cells = [c.xpath("string(.)").strip() for c in tr.xpath("./td")]
        (reg_no, project, promoter, district, registered_with, form_a_h, lapsed, qpr_missing) = (
            cells
        )
        rows.append(
            RegisteredProjectRow(
                registration_no=reg_no,
                project_name=project,
                promoter_name=promoter,
                district=district,
                registered_with=registered_with,
                form_a_h_url=form_a_h or None,
                lapsed=lapsed.strip().lower() == "yes",
                qpr_not_uploaded=qpr_missing.strip().lower() == "yes",
                page_ref=f"registered-projects row {i}",
            )
        )
    return rows


def parse_form_a_h(body: bytes) -> FormAH:
    """Form A-H (REP-I): Part A promoter identity, Part C cost/units/completion."""
    f = _field_rows(body)
    return FormAH(
        registration_no=f["registration_no"],
        promoter_name=f["promoter_name"],
        cin=f.get("cin") or None,
        units_total=_opt_int(f.get("units_total", "")),
        units_booked=_opt_int(f.get("units_booked", "")),
        projected_completion=_opt_date(f.get("projected_completion", "")),
        infra_pct_complete=_opt_float(f.get("infra_pct_complete", "")),
        page_ref="Form A-H Part C",
    )


def parse_qpr_detail(body: bytes) -> QprProgress:
    """One quarter's QPR POST response: physical/financial progress for that quarter."""
    f = _field_rows(body)
    return QprProgress(
        registration_no=f["registration_no"],
        quarter=f["quarter"],
        sold_pct=float(f["sold_pct"]),
        built_pct=float(f["built_pct"]),
        time_used_pct=float(f["time_used_pct"]),
        collections_lakh=_opt_float(f.get("collections_lakh", "")),
        period_label_raw=f.get("period_label", ""),
        page_ref=f"QPR {f['quarter']} Part C-X",
    )


def parse_qpr_register(body: bytes) -> tuple[str, list[tuple[str, date | None]]]:
    """The per-project quarter list: its registration no., and (quarter, filed_at or None)."""
    root = html.fromstring(body.decode("utf-8"))
    table = root.xpath('//table[@id="qpr-register"]')[0]
    registration_no = table.get("data-registration") or ""
    out: list[tuple[str, date | None]] = []
    for tr in table.xpath(".//tbody/tr"):
        quarter = tr.xpath("string(./td[1])").strip()
        filed_raw = tr.xpath("string(./td[2])").strip()
        out.append((quarter, date.fromisoformat(filed_raw) if filed_raw else None))
    return registration_no, out


def parse_corrigendum(body: bytes) -> list[CorrigendumEntry]:
    """The corrigendum popup JSON: extension, OC/CC/PCC, cancel order, sale ban entries."""
    doc = json.loads(body.decode("utf-8"))
    registration_no = doc["registration_no"]
    out: list[CorrigendumEntry] = []
    for i, raw in enumerate(doc["entries"]):
        out.append(
            CorrigendumEntry(
                registration_no=registration_no,
                doc_type=raw["doc_type"],
                entry_date=date.fromisoformat(raw["entry_date"]),
                file_url=raw["file_url"],
                remarks=raw.get("remarks", ""),
                page_ref=f"corrigendum entry {i} ({raw['doc_type']})",
            )
        )
    return out


def parse_judgments(body: bytes) -> list[JudgmentRow]:
    """The judgments index: complaint no., parties, type, decision date, order link."""
    root = html.fromstring(body.decode("utf-8"))
    table = root.xpath('//table[@id="judgments"]')[0]
    rows: list[JudgmentRow] = []
    for i, tr in enumerate(table.xpath(".//tbody/tr"), start=1):
        cells = [c.xpath("string(.)").strip() for c in tr.xpath("./td")]
        complaint_no, complainant, respondent, complaint_type, decided, url, uploaded = cells
        rows.append(
            JudgmentRow(
                complaint_no=complaint_no,
                complainant=complainant,
                respondent=respondent,
                complaint_type=complaint_type,
                decision_date=date.fromisoformat(decided),
                judgement_url=url,
                upload_date=date.fromisoformat(uploaded) if uploaded else None,
                page_ref=f"judgments row {i}",
            )
        )
    return rows
