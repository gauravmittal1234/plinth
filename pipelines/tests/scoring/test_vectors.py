"""The shared golden vectors (packages/fixtures/vectors): time used, Late12, dates."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

import pytest

from plinth.scoring.dates import (
    fmt_date,
    fmt_month,
    fmt_quarter,
    qpr_due,
    quarter_end_month,
    time_used_pct,
)
from plinth.scoring.features import late12
from plinth.scoring.model import load_model
from plinth.scoring.world import World


def load(fixtures_dir: Path, name: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads(
        (fixtures_dir / "vectors" / f"{name}.json").read_text(encoding="utf-8")
    )
    return data


def ym(s: str) -> date:
    y, m = s.split("-")[:2]
    return date(int(y), int(m), 1)


def test_time_used_vectors(fixtures_dir: Path) -> None:
    cases = load(fixtures_dir, "time_used")["cases"]
    assert len(cases) >= 9
    for c in cases:
        got = time_used_pct(
            ym(c["registered"]), ym(c["original_completion"]), ym(c["reference_month"])
        )
        assert got == c["expected_pct"], c


def test_aurelia_quarters_10_to_70(world: World) -> None:
    """DESIGN §5b: 10/20/30/40/50/60/65/70% by QPR quarter (the quarter's last month)."""
    expected = {
        "2023-Q2": 10,
        "2023-Q4": 20,
        "2024-Q2": 30,
        "2024-Q4": 40,
        "2025-Q2": 50,
        "2025-Q4": 60,
        "2026-Q1": 65,
        "2026-Q2": 70,
    }
    reg = world.registration("aurelia-heights-phase-2")
    assert reg.registered_on is not None
    got = {
        f.quarter: time_used_pct(
            reg.registered_on, reg.original_completion, quarter_end_month(f.quarter)
        )
        for f in world.filings("aurelia-heights-phase-2")
        if f.built_pct is not None
    }
    assert got == expected


def test_late12_vectors(world: World, fixtures_dir: Path) -> None:
    v12 = load_model("v1.2")
    for c in load(fixtures_dir, "late12")["cases"]:
        original = ym(c["original_completion"])
        line = late12(world, original, v12, date(2026, 10, 14))
        assert line.blanket_extension_months == c["blanket_extension_months"], c
        assert line.late_after == ym(c["expected_late_after"]), c
        assert fmt_month(line.late_after) == c["expected_label"], c


@pytest.mark.parametrize("section", ["dates", "months", "quarters"])
def test_formatting_vectors(fixtures_dir: Path, section: str) -> None:
    for c in load(fixtures_dir, "formatting")[section]:
        if section == "dates":
            assert fmt_date(date.fromisoformat(c["iso"])) == c["label"]
        elif section == "months":
            assert fmt_month(ym(c["iso"])) == c["label"]
        else:
            assert fmt_quarter(c["quarter"]) == c["label"]


def test_qpr_due_dates(world: World) -> None:
    for f in world.catalogue.qpr_filings:
        assert qpr_due(f.quarter) == f.due_on
    assert qpr_due("2026-Q3") == date(2026, 10, 15)
