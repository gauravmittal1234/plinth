"""The acceptance diff: `plinth-pipe score --fixtures --as-of 2026-10-14 --emit json` equals
packages/fixtures/canonical/scoring.json byte for byte, and the computed part does not lean
on the provenance file."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import date
from pathlib import Path
from typing import Any

import pytest
import yaml

from plinth.scoring.cli import main
from plinth.scoring.emit import computed_only, document, dumps, plain
from plinth.scoring.fixture_world import HERE, load_ledger
from plinth.scoring.runs import COMPUTED_SOURCE, ScoringResult, run_scoring
from plinth.scoring.world import World

ARGS = ["score", "--fixtures", "--as-of", "2026-10-14", "--emit", "json"]


def test_emit_json_is_byte_identical(result: ScoringResult, golden_text: str) -> None:
    assert dumps(document(result)) == golden_text


def test_cli_prints_the_golden_file(
    golden_text: str, canonical_dir: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    assert main([*ARGS[:1], "--fixtures-dir", str(canonical_dir), *ARGS[2:]]) == 0
    assert capsys.readouterr().out == golden_text


def test_module_entry_point(golden_text: str, canonical_dir: Path) -> None:
    root = canonical_dir.parents[2]
    out = subprocess.run(
        [sys.executable, "-m", "plinth.scoring", *ARGS],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    )
    assert out.stdout == golden_text


def test_computed_content_without_provenance(world: World, golden: dict[str, Any]) -> None:
    """With no provenance file every `source` reads "computed by ...", nothing else moves."""
    bare = plain(document(run_scoring(world, date(2026, 10, 14), ledger=load_ledger())))
    assert computed_only(bare) == computed_only(golden)
    assert isinstance(bare, dict)
    assert bare["runs"][3]["source"] == COMPUTED_SOURCE  # Aurelia's v1.2 run


def test_provenance_holds_strings_only() -> None:
    """provenance.yaml can only label records; it cannot carry a band or a number."""
    data = yaml.safe_load((HERE / "provenance.yaml").read_text(encoding="utf-8"))

    def leaves(v: object) -> list[object]:
        if isinstance(v, dict):
            return [x for item in v.values() for x in leaves(item)]
        return [v]

    assert all(isinstance(x, str) for x in leaves(data))
    assert set(data) <= {
        "note",
        "runs",
        "proposals",
        "reasons",
        "notices",
        "red_flags",
        "rescoring",
        "stale",
        "stalls",
    }


def test_v12_runs_are_computed_not_ledgered(result: ScoringResult) -> None:
    ledger = load_ledger()
    assert all(r.model_version != "v1.2" for r in ledger.runs)
    new = [r for r in result.runs if r.model_version == "v1.2"]
    assert len(new) == 9  # 8 recalculations + Aurelia's proposal
    assert all(r.assessment is not None for r in new)


def test_document_shape(golden: dict[str, Any], result: ScoringResult) -> None:
    doc = plain(document(result))
    assert isinstance(doc, dict)
    assert list(doc) == list(golden)
    counts = {k: len(v) for k, v in doc.items() if isinstance(v, list)}
    assert counts == {
        "score_models": 3,
        "red_flag_rules": 4,
        "red_flags": 1,
        "reason_templates": 12,
        "runs": 19,
        "reasons": 19,
        "band_history": 18,
        "band_notices": 2,
        "calibration": 5,
        "methodology_changelog": 3,
        "rescoring": 1,
        "stale": 1,
        "stalls": 1,
    }


def test_internal_values_never_published(golden_text: str) -> None:
    for word in ("p_late12", "logit", "contribution", "woe", "internal_points"):
        assert f'"{word}"' not in golden_text


def test_dumps_wraps_like_prettier() -> None:
    short = {"k": ["a", "b"]}
    assert dumps(short) == '{\n  "k": ["a", "b"]\n}\n'
    long_ids = {"fact_ids": [f"{i:08d}-0000-0000-0000-000000000000" for i in range(3)]}
    text = dumps(long_ids)
    assert text.splitlines()[1] == '  "fact_ids": ['
    assert json.loads(text) == long_ids
    assert dumps({"a": [], "b": {}}) == '{\n  "a": [],\n  "b": {}\n}\n'
