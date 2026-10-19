"""The fixture world's published history (ledger.yaml) and provenance strings (provenance.yaml).

Loaded only in fixtures mode. In M2+ the ledger is `core.score_runs` / `core.band_notices`.
"""

from __future__ import annotations

from datetime import date
from functools import cache
from pathlib import Path
from typing import Any

import yaml
from plinth_contracts import BandCode, BandSetBy, ConfidenceLevel, ScoreState
from pydantic import BaseModel, ConfigDict, Field

HERE = Path(__file__).parent


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class LedgerRun(_Strict):
    phase: str
    model_version: str
    data_cutoff: date
    computed_on: date
    published_on: date | None
    state: ScoreState
    band: BandCode | None
    set_by: BandSetBy | None
    rule_code: str | None
    confidence: ConfidenceLevel | None
    stall: bool
    stale: bool
    source: str
    history_source: str


class RunRef(_Strict):
    model_version: str
    computed_on: date


class LedgerNotice(_Strict):
    phase: str
    kind: str
    from_band: BandCode
    to_band: BandCode
    proposed_run: RunRef
    reason_text: str
    trigger_facts: list[str]
    sent_on: date
    effective_on: date
    public_marker_text: str | None
    status: str
    source: str


class Ledger(_Strict):
    runs: list[LedgerRun]
    notices: list[LedgerNotice]

    def runs_for(self, phase: str, up_to: date) -> list[LedgerRun]:
        rows = [r for r in self.runs if r.phase == phase and r.computed_on <= up_to]
        return sorted(rows, key=lambda r: r.computed_on)


class Provenance(_Strict):
    note: str
    runs: dict[str, str] = Field(default_factory=dict)
    proposals: dict[str, str] = Field(default_factory=dict)
    reasons: dict[str, str] = Field(default_factory=dict)
    notices: str | None = None
    red_flags: str | None = None
    rescoring: str | None = None
    stale: str | None = None
    stalls: str | None = None

    def reason_source(self, phase: str) -> str | None:
        return self.reasons.get(phase, self.reasons.get("*"))


EMPTY_LEDGER = Ledger(runs=[], notices=[])


def _load(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


@cache
def load_ledger(path: Path = HERE / "ledger.yaml") -> Ledger:
    return Ledger.model_validate(_load(path))


@cache
def load_provenance(path: Path = HERE / "provenance.yaml") -> Provenance:
    return Provenance.model_validate(_load(path))
