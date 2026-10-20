"""The brief's acceptance command: `plinth-pipe harera run --fixtures --as-of 2026-10-14
--emit facts` equals the canonical Aurelia QPR and filing facts (the pipeline <-> seed
equivalence test).

The "seed" is DESIGN.md §5b's Aurelia Heights, Phase 2 progress table and "Late QPRs" note,
written out here as the expected JSON. `plinth.cli.main` is T10's; this test exercises the
real `plinth-pipe harera run` command end to end, including `add_harera_parser` registration
(INTEGRATION_NOTES: "add plinth/sources/harera/cli.py with add_harera_parser").
"""

from __future__ import annotations

import json

import pytest

from plinth.cli import main
from plinth.sources.harera.cli import find_default_fixtures

AURELIA = "GGM/673/405/2022/117"

# DESIGN.md §5b, Aurelia Heights, Phase 2: the QPR quarter -> (sold%, built%, time_used%) table.
CANONICAL_PROGRESS = {
    "2023-Q2": (24.0, 6.0, 10.0),
    "2023-Q4": (38.0, 12.0, 20.0),
    "2024-Q2": (49.0, 19.0, 30.0),
    "2024-Q4": (58.0, 26.0, 40.0),
    "2025-Q2": (64.0, 31.0, 50.0),
    "2025-Q4": (68.0, 36.0, 60.0),
    "2026-Q1": (70.0, 38.0, 65.0),
    "2026-Q2": (72.0, 41.0, 70.0),  # "Filed 15 Jul 2026, on time."
}

# DESIGN.md §5b: "Late QPRs: 3 of the last 8 quarters... Earlier quarters were all filed on
# time." Every quarter below either names its days late or is on time.
CANONICAL_FILING_ON_TIME = {
    "2023-Q2": True,
    "2023-Q4": True,
    "2024-Q2": True,
    "2024-Q3": False,
    "2024-Q4": True,
    "2025-Q1": False,
    "2025-Q2": True,
    "2025-Q3": True,
    "2025-Q4": False,
    "2026-Q1": True,
    "2026-Q2": True,
}
CANONICAL_DAYS_LATE = {"2024-Q3": 12, "2025-Q1": 41, "2025-Q4": 38}


def test_find_default_fixtures_resolves_to_the_t18_directory() -> None:
    assert (find_default_fixtures() / "manifest.json").is_file()


def test_harera_run_emit_facts_equals_the_canonical_aurelia_facts(
    capsys: pytest.CaptureFixture[str],
) -> None:
    code = main(["harera", "run", "--fixtures", "--as-of", "2026-10-14", "--emit", "facts"])
    assert code == 0
    doc = json.loads(capsys.readouterr().out)

    aurelia_facts = [f for f in doc["facts"] if f["subject_id"] == AURELIA]
    progress = {
        f["value"]["quarter"]: f["value"] for f in aurelia_facts if f["attribute"] == "qpr.progress"
    }
    filing = {
        f["value"]["quarter"]: f["value"] for f in aurelia_facts if f["attribute"] == "qpr.filing"
    }

    assert set(progress) == set(CANONICAL_PROGRESS)
    for quarter, (sold, built, time_used) in CANONICAL_PROGRESS.items():
        value = progress[quarter]
        assert (value["sold_pct"], value["built_pct"], value["time_used_pct"]) == (
            sold,
            built,
            time_used,
        )

    assert set(filing) == set(CANONICAL_FILING_ON_TIME)
    for quarter, on_time in CANONICAL_FILING_ON_TIME.items():
        assert filing[quarter]["on_time"] is on_time
    for quarter, days_late in CANONICAL_DAYS_LATE.items():
        assert filing[quarter]["days_late"] == days_late

    # The data cutoff (14 Oct 2026) is before the Jul-Sep 2026 QPR's due date: not missing yet.
    assert doc["missing_qprs"] == []


def test_harera_run_emit_records_lists_the_parsed_doc_types(
    capsys: pytest.CaptureFixture[str],
) -> None:
    code = main(["harera", "run", "--fixtures", "--as-of", "2026-10-14", "--emit", "records"])
    assert code == 0
    doc = json.loads(capsys.readouterr().out)
    assert set(doc["records"]) == {
        "harera.registered_list",
        "harera.form_a_h",
        "harera.qpr_detail",
        "harera.qpr_register",
        "harera.corrigendum",
        "harera.judgments",
    }
    assert len(doc["records"]["harera.registered_list"]) == 7
