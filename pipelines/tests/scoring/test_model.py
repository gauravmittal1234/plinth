"""The model files: published weights equal the scorecard's spreads, bins are monotone, the
three versions differ only where their changelogs say, and catalogues agree."""

from __future__ import annotations

import re
import string
from datetime import date
from itertools import pairwise

import pytest
from plinth_contracts import BandCode

from plinth.scoring.change import possessive
from plinth.scoring.model import (
    BANDS,
    FACTORS,
    current_model,
    load_model,
    load_models,
    load_reasons,
    load_red_flags,
)
from plinth.scoring.scorecard import band_for

VERSIONS = ("v1.0", "v1.1", "v1.2")
LEVEL_ORDER = {
    "late_filings_last_8": ["0, full window", "0, short record", "1", "2", "3 or more"],
    "stall": ["no", "yes"],
}


@pytest.mark.parametrize("version", VERSIONS)
def test_published_weights_are_the_scorecard_spreads(version: str) -> None:
    m = load_model(version)
    spreads = m.factor_spreads()
    total = sum(spreads.values())
    shares = {f: 100 * spreads[f] / total for f in FACTORS}
    for f in FACTORS:
        assert shares[f] == pytest.approx(m.config.factor_weights[f], abs=1e-9), f
    assert m.config.factor_weights == {
        "finances": 30,
        "track_record": 30,
        "timeline": 20,
        "legal": 15,
        "site": 5,
    }


@pytest.mark.parametrize("version", VERSIONS)
def test_bins_are_monotone_in_risk(version: str) -> None:
    """Higher values (more sold ahead of built, more late, more missing...) never score lower."""
    for f in load_model(version).scorecard.features:
        if f.kind == "levels":
            assert [b.level for b in f.bins] == LEVEL_ORDER[f.code]
        woes = [b.woe for b in f.bins]
        assert all(b >= a for a, b in pairwise(woes)), f.code
        assert f.missing_woe == 0.0, f.code  # missing data never moves a band
        assert min(woes) <= 0.0 <= max(woes), f.code


def test_versions_differ_only_as_their_changelogs_say() -> None:
    v10, v11, v12 = (load_model(v) for v in VERSIONS)
    assert v10.scorecard == v11.scorecard == v12.scorecard
    assert (v10.config.stale_days, v11.config.stale_days, v12.config.stale_days) == (180, 180, 120)
    assert [m.config.blanket_extensions for m in (v10, v11, v12)] == [False, False, True]
    assert [m.rules.built_share_drop_is_filing_problem for m in (v10, v11, v12)] == [
        False,
        True,
        True,
    ]
    strip = {"stale_days", "blanket_extensions"}
    assert (
        v10.config.model_dump(exclude=strip)
        == v11.config.model_dump(exclude=strip)
        == v12.config.model_dump(exclude=strip)
    )
    assert v12.calibration is not None


def test_model_dates() -> None:
    assert [m.version for m in load_models()] == list(VERSIONS)
    assert current_model(date(2026, 7, 15)).version == "v1.0"
    assert current_model(date(2026, 9, 1)).version == "v1.0"
    assert current_model(date(2026, 9, 2)).version == "v1.1"
    assert current_model(date(2026, 10, 13)).version == "v1.1"
    assert current_model(date(2026, 10, 14)).version == "v1.2"
    with pytest.raises(ValueError, match="no score model"):
        current_model(date(2026, 7, 14))
    for m in load_models():
        assert m.approved_on < m.released_on


def test_band_thresholds_are_the_published_ranges() -> None:
    m = load_model("v1.2")
    for band in BANDS:
        r = m.config.band_ranges[band]
        assert band_for(r.low / 100 + 1e-9, m) == band
        if band != BandCode.severe:
            assert band_for(r.high / 100 - 1e-9, m) == band
    lows = [m.config.band_ranges[b] for b in BANDS]
    assert all(a.high == b.low for a, b in pairwise(lows))
    assert set(m.config.high_confidence_points) == {BandCode.low, BandCode.moderate}


def test_red_flag_catalogue_matches_config() -> None:
    flags = load_red_flags()
    assert [r.code for r in flags.rules] == load_model("v1.2").config.red_flag_rules
    assert [r.n for r in flags.rules] == [1, 2, 3, 4]
    reasons = load_reasons()
    for r in flags.rules:
        if r.reason_code is not None:
            reasons.template(r.reason_code)  # exists


def test_reason_templates() -> None:
    cat = load_reasons()
    codes = [t.code for t in cat.templates]
    assert len(codes) == len(set(codes)) == 12
    fields = {
        t.code: {f for _, f, _, _ in string.Formatter().parse(t.template_en) if f}
        for t in cat.templates
    }
    assert fields["FIN_SOLD_AHEAD_BUILT"] == {"sold", "built"}
    assert fields["LEG_COMPLAINTS"] == {"count", "rate", "median"}
    for t in cat.templates:
        assert t.factor in FACTORS
        assert not re.search(r"% chance|1 in \d", t.template_en)  # natural frequencies only
    wwc = cat.what_would_change
    assert "{band}" in wwc.catch_up_sales and "{band}" in wwc.catch_up_schedule


def test_possessive() -> None:
    assert possessive("Halcyon Homes") == "Halcyon Homes'"
    assert possessive("Orbis Land") == "Orbis Land's"
