"""Score model definitions: `models/v1.0.yaml`, `v1.1.yaml`, `v1.2.yaml`, plus the reason
catalogue (`models/reasons.yaml`) and the red-flag rules (`models/red_flags.yaml`).

A model file has three parts:

- `config`: the published methodology numbers, emitted verbatim as `score_models[].config`
  (band ranges, confidence rules, stale days, weights...).
- `rules`: behaviour switches that are not part of the published config.
- `scorecard`: the expert-set WoE bins and logistic coefficients (BUILD_PLAN §7.1).

Each model file is a frozen artefact: a published version never changes.
"""

from __future__ import annotations

from datetime import date
from functools import cache
from pathlib import Path
from typing import Any, Literal

import yaml
from plinth_contracts import BandCode
from pydantic import BaseModel, ConfigDict, Field, model_validator

MODELS_DIR = Path(__file__).with_name("models")
BANDS: tuple[BandCode, ...] = (
    BandCode.low,
    BandCode.moderate,
    BandCode.elevated,
    BandCode.high,
    BandCode.severe,
)
BAND_LABELS: dict[BandCode, str] = {
    BandCode.low: "Low",
    BandCode.moderate: "Moderate",
    BandCode.elevated: "Elevated",
    BandCode.high: "High",
    BandCode.severe: "Severe",
}
Factor = Literal["finances", "track_record", "timeline", "legal", "site"]
FACTORS: tuple[Factor, ...] = ("finances", "track_record", "timeline", "legal", "site")


def band_step(band: BandCode) -> int:
    return BANDS.index(band) + 1


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class BandRange(_Strict):
    low: int
    high: int


class MinFinished(_Strict):
    min_finished: int


class MinMonths(_Strict):
    min_months_registered: int


class PublishedConfig(_Strict):
    """`score_models[].config`, in the published key order."""

    target: str
    factor_weights: dict[Factor, int]
    band_ranges: dict[BandCode, BandRange]
    high_confidence_points: dict[BandCode, int]
    confidence: MinFinished
    limited_history: MinFinished
    not_scored: MinMonths
    stale_days: int
    rescore_hours: int
    blanket_extensions: bool
    late_filings_window_quarters: int
    red_flag_rules: list[str]


class NoticeRules(_Strict):
    downgrade_into: list[BandCode]
    notice_days: int
    heads_up_hours: int


class ModelRules(_Strict):
    built_share_drop_is_filing_problem: bool
    stall_quarters: int
    notice: NoticeRules


class Bin(_Strict):
    """A numeric bin covers (previous max, max]; `max: null` is the open top bin."""

    label: str
    max: float | None = None
    level: str | None = None
    woe: float


class Feature(_Strict):
    code: str
    factor: Factor
    title: str
    kind: Literal["numeric", "levels"]
    coef: float
    missing_woe: float
    bins: list[Bin]

    @model_validator(mode="after")
    def _check_bins(self) -> Feature:
        if self.kind == "numeric":
            maxes = [b.max for b in self.bins]
            if maxes[-1] is not None or any(m is None for m in maxes[:-1]):
                raise ValueError(f"{self.code}: only the last numeric bin is open")
            closed = [m for m in maxes[:-1] if m is not None]
            if closed != sorted(closed):
                raise ValueError(f"{self.code}: bins must ascend")
        elif any(b.level is None for b in self.bins):
            raise ValueError(f"{self.code}: every level bin needs `level`")
        return self

    def bin_index(self, value: float | str | None) -> int | None:
        if value is None:
            return None
        if self.kind == "levels":
            for i, b in enumerate(self.bins):
                if b.level == value:
                    return i
            raise ValueError(f"{self.code}: unknown level {value!r}")
        assert isinstance(value, int | float)
        for i, b in enumerate(self.bins):
            if b.max is None or value <= b.max:
                return i
        raise AssertionError("unreachable: the last bin is open")

    def contribution(self, value: float | str | None) -> float:
        i = self.bin_index(value)
        woe = self.missing_woe if i is None else self.bins[i].woe
        return self.coef * woe

    def spread(self) -> float:
        """The range of contributions this feature can make (missing included)."""
        cs = [self.coef * b.woe for b in self.bins] + [self.coef * self.missing_woe]
        return max(cs) - min(cs)


class Scorecard(_Strict):
    intercept: float
    features: list[Feature]

    def feature(self, code: str) -> Feature:
        for f in self.features:
            if f.code == code:
                return f
        raise KeyError(code)


class CalibrationRow(_Strict):
    band: BandCode
    n_projects: int
    n_late: int


class Calibration(_Strict):
    illustrative: bool
    reference_class_line: str
    source: str
    summary_source: str
    bands: list[CalibrationRow]


class ScoreModel(_Strict):
    version: str
    released_on: date
    approved_on: date
    title: str
    changelog: list[str]
    note: str
    source: str
    config: PublishedConfig
    rules: ModelRules
    scorecard: Scorecard
    calibration: Calibration | None = None

    def factor_spreads(self) -> dict[Factor, float]:
        out: dict[Factor, float] = dict.fromkeys(FACTORS, 0.0)
        for f in self.scorecard.features:
            out[f.factor] += f.spread()
        return out


class ReasonTemplate(_Strict):
    code: str
    factor: Factor
    template_en: str


class ChangeTexts(_Strict):
    lowest_band: str
    catch_up_sales: str
    catch_up_schedule: str
    file_missing: str
    file_on_time: str
    catch_up_all: str
    no_single_change: str
    limited_history: str
    not_scored: str


class NoticeTexts(_Strict):
    qpr_missing_marker: str


class ReasonCatalogue(_Strict):
    version: str
    source: str
    templates: list[ReasonTemplate]
    what_would_change: ChangeTexts
    notices: NoticeTexts

    def template(self, code: str) -> ReasonTemplate:
        for t in self.templates:
            if t.code == code:
                return t
        raise KeyError(code)


class RedFlagRule(_Strict):
    code: str
    n: int = Field(ge=1)
    title: str
    text: str
    reason_code: str | None
    what_would_change: str | None


class RedFlagCatalogue(_Strict):
    source: str
    rules: list[RedFlagRule]

    def rule(self, code: str) -> RedFlagRule:
        for r in self.rules:
            if r.code == code:
                return r
        raise KeyError(code)


def _load_yaml(path: Path) -> Any:
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


@cache
def load_models(models_dir: Path = MODELS_DIR) -> tuple[ScoreModel, ...]:
    models = [ScoreModel.model_validate(_load_yaml(p)) for p in sorted(models_dir.glob("v*.yaml"))]
    return tuple(sorted(models, key=lambda m: m.released_on))


def load_model(version: str, models_dir: Path = MODELS_DIR) -> ScoreModel:
    for m in load_models(models_dir):
        if m.version == version:
            return m
    raise KeyError(f"no score model {version}")


def current_model(as_of: date, models_dir: Path = MODELS_DIR) -> ScoreModel:
    """The latest model released on or before `as_of`."""
    released = [m for m in load_models(models_dir) if m.released_on <= as_of]
    if not released:
        raise ValueError(f"no score model released by {as_of.isoformat()}")
    return released[-1]


@cache
def load_reasons(models_dir: Path = MODELS_DIR) -> ReasonCatalogue:
    return ReasonCatalogue.model_validate(_load_yaml(models_dir / "reasons.yaml"))


@cache
def load_red_flags(models_dir: Path = MODELS_DIR) -> RedFlagCatalogue:
    return RedFlagCatalogue.model_validate(_load_yaml(models_dir / "red_flags.yaml"))
