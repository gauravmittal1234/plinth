"""`--emit json`: the published scoring document (`plinth.fixtures.scoring/1`) and a JSON
writer that prints exactly what the fixtures' Prettier pass prints.

Internal values (p, contributions, points) are never emitted; `--emit explain` shows them.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from .dates import iso_ist, round_half_up
from .model import ScoreModel, load_reasons, load_red_flags
from .runs import (
    COMPUTED_SOURCE,
    HistoryRow,
    Notice,
    RedFlagRecord,
    Rescore,
    Run,
    ScoringResult,
    StaleInput,
    StallRecord,
    fixture_id,
)

SCHEMA = "plinth.fixtures.scoring/1"
PRINT_WIDTH = 100

type Json = dict[str, Json] | list[Json] | str | int | float | bool | None


def document(result: ScoringResult) -> dict[str, Any]:
    prov = result.provenance
    reasons_cat = load_reasons()
    flags = load_red_flags()
    model = result.model
    return {
        "schema": SCHEMA,
        "note": prov.note if prov else f"Scoring {model.version} output.",
        "data_cutoff": result.as_of,
        "model_version": model.version,
        "score_models": [_model(m, model) for m in result.models],
        "red_flag_rules": [
            {
                "id": fixture_id("red_flag_rule", r.code),
                "code": r.code,
                "n": r.n,
                "title": r.title,
                "text": r.text,
                "published_on": None,
                "source": flags.source,
            }
            for r in flags.rules
        ],
        "red_flags": [_red_flag(f) for f in result.red_flags],
        "reason_templates": [
            {
                "id": fixture_id("reason_template", f"{t.code}/{reasons_cat.version}"),
                "code": t.code,
                "factor": t.factor,
                "template_en": t.template_en,
                "version": reasons_cat.version,
                "source": reasons_cat.source,
            }
            for t in reasons_cat.templates
        ],
        "runs": [_run(r) for r in result.runs],
        "reasons": [x for r in result.runs for x in _reasons(r)],
        "band_history": [_history(h) for h in result.history],
        "band_notices": [_notice(n) for n in result.notices],
        "calibration": _calibration(model),
        "calibration_summary": _calibration_summary(model),
        "methodology_changelog": [
            {
                "version": m.version,
                "published_on": m.released_on,
                "summary": m.title,
                "minutes_url": None,
                "source": m.source,
            }
            for m in result.models
        ],
        "rescoring": [_rescore(x) for x in result.rescoring],
        "stale": [_stale(x) for x in result.stale],
        "stalls": [_stall(x) for x in result.stalls],
    }


def _model(m: ScoreModel, current: ScoreModel) -> dict[str, Any]:
    return {
        "id": fixture_id("score_model", m.version),
        "version": m.version,
        "released_on": m.released_on,
        "approved_on": m.approved_on,
        "status": "current" if m.version == current.version else "retired",
        "title": m.title,
        "changelog": list(m.changelog),
        "note": m.note,
        "config": m.config.model_dump(mode="json"),
        "source": m.source,
    }


def _red_flag(f: RedFlagRecord) -> dict[str, Any]:
    return {
        "id": f.id,
        "rule_code": f.rule_code,
        "subject_type": f.subject_type,
        "subject": f.subject,
        "triggered_on": f.triggered_on,
        "cleared_on": f.cleared_on,
        "fact_ids": list(f.fact_ids),
        "source": f.source,
    }


def _run(r: Run) -> dict[str, Any]:
    fq = r.frequency
    return {
        "id": r.id,
        "phase": r.phase,
        "model_version": r.model_version,
        "data_cutoff": r.data_cutoff,
        "computed_on": r.computed_on,
        "published_on": r.published_on,
        "code_commit": None,
        "status": r.status,
        "state": r.state,
        "band": r.band,
        "set_by": r.set_by,
        "rule_code": r.rule_code,
        "confidence": r.confidence,
        "freq_kind": fq.kind if fq else None,
        "freq_low": fq.low if fq else None,
        "freq_high": fq.high if fq else None,
        "freq_point": fq.point if fq else None,
        "stall": r.stall,
        "stale": r.stale,
        "what_would_change": r.what_would_change,
        "supersedes": r.supersedes,
        "notice": r.notice,
        "source": r.source,
    }


def _reasons(r: Run) -> list[dict[str, Any]]:
    return [
        {
            "run": r.id,
            "phase": r.phase,
            "rank": i + 1,
            "factor": x.factor,
            "code": x.code,
            "text": x.text,
            "fact_ids": list(x.fact_ids),
            "source": r.reasons_source,
        }
        for i, x in enumerate(r.reasons)
    ]


def _history(h: HistoryRow) -> dict[str, Any]:
    return {
        "phase": h.phase,
        "band": h.band,
        "state": h.state,
        "confidence": h.confidence,
        "from_date": h.from_date,
        "to_date": h.to_date,
        "run": h.run,
        "model_version": h.model_version,
        "source": h.source,
    }


def _notice(n: Notice) -> dict[str, Any]:
    return {
        "id": n.id,
        "phase": n.phase,
        "kind": n.kind,
        "from_band": n.from_band,
        "to_band": n.to_band,
        "proposed_run": n.proposed_run,
        "reason_text": n.reason_text,
        "trigger_fact_ids": list(n.trigger_fact_ids),
        "sent_on": n.sent_on,
        "effective_on": n.effective_on,
        "public_marker_text": n.public_marker_text,
        "status": n.status,
        "source": n.source,
    }


def _calibration(model: ScoreModel) -> list[dict[str, Any]]:
    cal = model.calibration
    if cal is None:
        return []
    ranges = model.config.band_ranges
    return [
        {
            "id": fixture_id("calibration", f"{model.version}/{row.band.value}"),
            "model_version": model.version,
            "band": row.band,
            "range_low": ranges[row.band].low,
            "range_high": ranges[row.band].high,
            "n_projects": row.n_projects,
            "n_late": row.n_late,
            "per_100": int(round_half_up(100 * row.n_late / row.n_projects)),
            "illustrative": cal.illustrative,
            "source": cal.source,
        }
        for row in cal.bands
    ]


def calibration_stats(model: ScoreModel) -> tuple[int, int, int, Decimal, Decimal]:
    """(n, late, base rate per 100, Brier of the band rates, Brier of the base rate).

    With each project predicted at its band's observed rate, the Brier score is
    sum(n_b x r_b x (1 - r_b)) / N; the no-skill baseline predicts the base rate r for all.
    """
    cal = model.calibration
    assert cal is not None
    n = sum(r.n_projects for r in cal.bands)
    late = sum(r.n_late for r in cal.bands)
    brier = Decimal(0)
    for r in cal.bands:
        rate = Decimal(r.n_late) / Decimal(r.n_projects)
        brier += Decimal(r.n_projects) * rate * (1 - rate)
    brier /= Decimal(n)
    base = Decimal(late) / Decimal(n)
    baseline = base * (1 - base)
    return n, late, int(round_half_up(100 * base)), brier, baseline


def _calibration_summary(model: ScoreModel) -> dict[str, Any] | None:
    cal = model.calibration
    if cal is None:
        return None
    n, late, base, brier, baseline = calibration_stats(model)
    return {
        "model_version": model.version,
        "n_projects": n,
        "n_late": late,
        "base_rate_per_100": base,
        "brier": float(round_half_up(brier, 2)),
        "brier_baseline": float(round_half_up(baseline, 2)),
        "illustrative": cal.illustrative,
        "reference_class_line": cal.reference_class_line,
        "source": cal.summary_source,
    }


def _rescore(x: Rescore) -> dict[str, Any]:
    return {
        "phase": x.phase,
        "trigger_fact": x.trigger_fact,
        "quarter": x.quarter,
        "filed_on": x.filed_on,
        "appeared_on": x.appeared_on,
        "fetched_at": x.fetched_at,
        "due_by": x.due_by,
        "status": x.status,
        "source": x.source,
    }


def _stale(x: StaleInput) -> dict[str, Any]:
    return {
        "phase": x.phase,
        "latest_quarter": x.latest_quarter,
        "latest_filed_on": x.latest_filed_on,
        "age_days_on_clock": x.age_days_on_clock,
        "stale_after_days": x.stale_after_days,
        "source": x.source,
    }


def _stall(x: StallRecord) -> dict[str, Any]:
    return {
        "phase": x.phase,
        "quarters": list(x.quarters),
        "built_pct": x.built_pct,
        "source": x.source,
    }


# ---- JSON text ----------------------------------------------------------------------------


def plain(v: Any) -> Json:
    """Dates to ISO, instants to IST ISO, enums to their values; recursively."""
    if isinstance(v, Enum):
        return plain(v.value)
    if isinstance(v, datetime):
        return iso_ist(v)
    if isinstance(v, date):
        return v.isoformat()
    if isinstance(v, dict):
        return {str(k): plain(x) for k, x in v.items()}
    if isinstance(v, list | tuple):
        return [plain(x) for x in v]
    if v is None or isinstance(v, str | int | float | bool):
        return v
    raise TypeError(f"cannot emit {type(v).__name__}")


def dumps(value: Any) -> str:
    """JSON as `JSON.stringify(v, null, 2)` then Prettier (parser json, printWidth 100).

    Objects stay expanded; an array of scalars goes on one line when that line (with its
    trailing comma) fits in 100 columns. Ends with a newline.
    """
    return _fmt(plain(value), 0, 0, trailing=0) + "\n"


def _scalar(v: Json) -> str:
    return json.dumps(v, ensure_ascii=False)


def _fmt(v: Json, indent: int, column: int, trailing: int) -> str:
    pad = "  " * indent
    inner = "  " * (indent + 1)
    if isinstance(v, dict):
        if not v:
            return "{}"
        items = list(v.items())
        lines = []
        for i, (k, x) in enumerate(items):
            last = i == len(items) - 1
            key = f"{_scalar(k)}: "
            body = _fmt(x, indent + 1, len(inner) + len(key), trailing=0 if last else 1)
            lines.append(f"{inner}{key}{body}{'' if last else ','}")
        return "{\n" + "\n".join(lines) + "\n" + pad + "}"
    if isinstance(v, list):
        if not v:
            return "[]"
        if all(not isinstance(x, dict | list) for x in v):
            flat = "[" + ", ".join(_scalar(x) for x in v) + "]"
            if column + len(flat) + trailing <= PRINT_WIDTH:
                return flat
        lines = []
        for i, x in enumerate(v):
            last = i == len(v) - 1
            body = _fmt(x, indent + 1, len(inner), trailing=0 if last else 1)
            lines.append(f"{inner}{body}{'' if last else ','}")
        return "[\n" + "\n".join(lines) + "\n" + pad + "]"
    return _scalar(v)


def computed_only(doc: Json, *, top: bool = True) -> Json:
    """The document without provenance (every `source`, the header `note`)."""
    if isinstance(doc, dict):
        drop = {"source", "note"} if top else {"source"}
        return {k: computed_only(v, top=False) for k, v in doc.items() if k not in drop}
    if isinstance(doc, list):
        return [computed_only(v, top=False) for v in doc]
    return doc


__all__ = ["COMPUTED_SOURCE", "calibration_stats", "computed_only", "document", "dumps", "plain"]
