"""Shared fixtures for the scoring tests: the DESIGN §5b world on the frozen clock."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

import pytest

from plinth.scoring.cli import find_canonical
from plinth.scoring.fixture_world import load_ledger, load_provenance
from plinth.scoring.runs import ScoringResult, run_scoring
from plinth.scoring.world import World

AS_OF = date(2026, 10, 14)


@pytest.fixture(scope="session")
def canonical_dir() -> Path:
    return find_canonical(Path(__file__).resolve())


@pytest.fixture(scope="session")
def fixtures_dir(canonical_dir: Path) -> Path:
    return canonical_dir.parent


@pytest.fixture(scope="session")
def golden_text(canonical_dir: Path) -> str:
    return (canonical_dir / "scoring.json").read_text(encoding="utf-8")


@pytest.fixture(scope="session")
def golden(golden_text: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads(golden_text)
    return data


@pytest.fixture(scope="session")
def world(canonical_dir: Path) -> World:
    return World.from_dir(canonical_dir)


@pytest.fixture(scope="session")
def result(world: World) -> ScoringResult:
    return run_scoring(world, AS_OF, ledger=load_ledger(), provenance=load_provenance())
