"""What would change this: the smallest public-record change that crosses a band boundary.

For a model-set band the engine tries counterfactuals in order and re-scores each one:

  catch_up_sales      (sales reported) the sold-minus-built gap closes into a lower bin
  catch_up_schedule   the time-used-minus-built gap closes into a lower bin
  file_missing        the missing QPRs appear on HARERA
  file_on_time        the filing record improves to none late in a full window of 8

Each moves its feature one bin at a time (the smallest change first). The first change that
lowers the band gives the line, naming the band it actually reaches. If no single change is
enough, all of them together are tried (`catch_up_all`); if even that is not, the line says
so (`no_single_change`). Low has nowhere lower to go; red flags, limited history and not
scored have their own published lines.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from plinth_contracts import BandCode

from .features import FeatureValue
from .model import BAND_LABELS, Feature, ReasonCatalogue, ScoreModel, band_step
from .scorecard import score

SCENARIOS: tuple[tuple[str, str], ...] = (
    ("catch_up_sales", "sold_minus_built_pct"),
    ("catch_up_schedule", "time_used_minus_built_pct"),
    ("file_missing", "missing_qprs"),
    ("file_on_time", "late_filings_last_8"),
)


@dataclass(frozen=True)
class Counterfactual:
    scenario: str
    changes: tuple[tuple[str, FeatureValue, FeatureValue], ...]  # (feature, from, to)
    band: BandCode


def _lower_values(feature: Feature, v: FeatureValue) -> list[FeatureValue]:
    """Values in each lower-risk bin, nearest first (a numeric bin's upper edge, or a level)."""
    i = feature.bin_index(v)
    assert i is not None
    out: list[FeatureValue] = []
    for j in range(i - 1, -1, -1):
        b = feature.bins[j]
        if feature.kind == "levels":
            out.append(b.level)
        elif b.max is not None:
            out.append(b.max)
    return out


def smallest_crossing(
    values: Mapping[str, FeatureValue], band: BandCode, model: ScoreModel
) -> Counterfactual | None:
    best: dict[str, FeatureValue] = {}
    for scenario, code in SCENARIOS:
        v = values.get(code)
        if v is None:
            continue
        options = _lower_values(model.scorecard.feature(code), v)
        if options:
            best[code] = options[-1]
        for to in options:
            new_band = score({**values, code: to}, model).band
            if band_step(new_band) < band_step(band):
                return Counterfactual(scenario, ((code, v, to),), new_band)
    if len(best) > 1:
        new_band = score({**values, **best}, model).band
        if band_step(new_band) < band_step(band):
            changes = tuple((c, values.get(c), to) for c, to in best.items())
            return Counterfactual("catch_up_all", changes, new_band)
    return None


def change_line(
    values: Mapping[str, FeatureValue], band: BandCode, model: ScoreModel, cat: ReasonCatalogue
) -> str:
    texts = cat.what_would_change
    if band == BandCode.low:
        return texts.lowest_band
    cf = smallest_crossing(values, band, model)
    if cf is None:
        return texts.no_single_change
    template = {
        "catch_up_sales": texts.catch_up_sales,
        "catch_up_schedule": texts.catch_up_schedule,
        "file_missing": texts.file_missing,
        "file_on_time": texts.file_on_time,
        "catch_up_all": texts.catch_up_all,
    }[cf.scenario]
    return template.format(band=BAND_LABELS[cf.band])


def possessive(name: str) -> str:
    return f"{name}'" if name.endswith("s") else f"{name}'s"
