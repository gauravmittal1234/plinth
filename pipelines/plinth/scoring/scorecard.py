"""The scorecard: WoE bins -> logistic -> p(Late12) -> band (BUILD_PLAN §7.1).

    logit p = intercept + sum over features of coef x WoE(bin of the feature's value)

The band is the published range that holds p (Low below 15 of 100, Moderate below 30,
Elevated below 45, High below 65, Severe from 65). p and the contributions are internal:
they rank reasons and test counterfactuals, and are never published (no 300-900 number).
"""

from __future__ import annotations

import math
from collections.abc import Mapping
from dataclasses import dataclass

from plinth_contracts import BandCode

from .features import FeatureValue
from .model import BANDS, ScoreModel


@dataclass(frozen=True)
class Contribution:
    feature: str
    factor: str
    value: FeatureValue
    bin_label: str | None
    contribution: float


@dataclass(frozen=True)
class Score:
    logit: float
    p_late12: float
    band: BandCode
    contributions: tuple[Contribution, ...]

    def contribution(self, feature: str) -> float:
        for c in self.contributions:
            if c.feature == feature:
                return c.contribution
        raise KeyError(feature)


def score(values: Mapping[str, FeatureValue], model: ScoreModel) -> Score:
    sc = model.scorecard
    parts: list[Contribution] = []
    for f in sc.features:
        v = values.get(f.code)
        i = f.bin_index(v)
        parts.append(
            Contribution(
                feature=f.code,
                factor=f.factor,
                value=v,
                bin_label=None if i is None else f.bins[i].label,
                contribution=f.contribution(v),
            )
        )
    logit = sc.intercept + math.fsum(c.contribution for c in parts)
    p = 1.0 / (1.0 + math.exp(-logit))
    return Score(logit, p, band_for(p, model), tuple(parts))


def band_for(p: float, model: ScoreModel) -> BandCode:
    """The band whose published range holds p; Severe from its lower edge up."""
    ranges = model.config.band_ranges
    for band in BANDS[:-1]:
        if 100.0 * p < ranges[band].high:
            return band
    return BANDS[-1]
