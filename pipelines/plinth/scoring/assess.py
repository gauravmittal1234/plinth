"""One phase, one model, one reference instant -> state, band, confidence, frequency,
reasons and "what would change" (WORK_BREAKDOWN T11 "Rules" and "Outputs").

Order of the rules:
  1. red flags (RF1-RF4) set Severe, with no frequency and no confidence;
  2. not scored: registered less than 6 months, or no QPR progress to compare with time;
  3. limited history: the group has fewer than 3 finished RERA projects (no penalty);
  4. the scorecard sets the band; confidence is high only with >= 8 finished projects.
The scorecard runs in every case, so a red-flag band still lists the model's top reasons.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from plinth_contracts import BandCode, BandSetBy, ConfidenceLevel, FrequencyKind, ScoreState

from .change import change_line, possessive
from .features import FeatureValue, PhaseView, build_view, registered_long_enough
from .model import ReasonCatalogue, RedFlagCatalogue, ScoreModel
from .reasons import Reason, candidates, rank, red_flag_reasons
from .scorecard import Score, score
from .world import Phase, World


@dataclass(frozen=True)
class Frequency:
    kind: FrequencyKind
    low: int
    high: int
    point: int | None


@dataclass(frozen=True)
class Assessment:
    view: PhaseView
    model: ScoreModel
    values: dict[str, FeatureValue]
    score: Score
    state: ScoreState
    band: BandCode | None
    set_by: BandSetBy | None
    rule_code: str | None
    confidence: ConfidenceLevel | None
    frequency: Frequency | None
    stall: bool
    stale: bool
    candidates: tuple[Reason, ...]
    reasons: tuple[Reason, ...]
    what_would_change: str | None

    @property
    def phase(self) -> Phase:
        return self.view.phase


def assess(
    world: World,
    phase: Phase,
    ref: datetime,
    model: ScoreModel,
    cat: ReasonCatalogue,
    flags: RedFlagCatalogue,
) -> Assessment:
    view = build_view(world, phase, ref, model)
    values = view.values()
    sc = score(values, model)
    cfg = model.config
    texts = cat.what_would_change

    band: BandCode | None = None
    set_by: BandSetBy | None = None
    rule_code: str | None = None
    confidence: ConfidenceLevel | None = None
    wwc: str | None
    hits = [h for h in view.red_flags if h.rule_code in cfg.red_flag_rules]

    if hits:
        state = ScoreState.scored
        band, set_by, rule_code = BandCode.severe, BandSetBy.red_flag_rule, hits[0].rule_code
        wwc = flags.rule(rule_code).what_would_change
    elif not registered_long_enough(view, model) or view.progress is None:
        state = ScoreState.not_scored
        wwc = texts.not_scored
    elif view.track is not None and view.track.finished < cfg.limited_history.min_finished:
        state = ScoreState.limited_history
        wwc = texts.limited_history.format(group_possessive=possessive(view.group.name))
    else:
        state = ScoreState.scored
        band, set_by = sc.band, BandSetBy.model
        enough = view.track is not None and view.track.finished >= cfg.confidence.min_finished
        confidence = ConfidenceLevel.high if enough else ConfidenceLevel.low
        wwc = change_line(values, band, model, cat)

    cands = tuple(candidates(view, sc, world, cat))
    reasons: tuple[Reason, ...] = ()
    if state == ScoreState.scored:
        rf = red_flag_reasons(hits, view, world, cat, flags)
        reasons = tuple(rank(rf, cands))

    age = view.stale_age_days(view.ref_date)
    return Assessment(
        view=view,
        model=model,
        values=values,
        score=sc,
        state=state,
        band=band,
        set_by=set_by,
        rule_code=rule_code,
        confidence=confidence,
        frequency=frequency(band, set_by, confidence, model),
        stall=view.stall is not None,
        stale=age is not None and age > cfg.stale_days,
        candidates=cands,
        reasons=reasons,
        what_would_change=wwc,
    )


def frequency(
    band: BandCode | None,
    set_by: BandSetBy | None,
    confidence: ConfidenceLevel | None,
    model: ScoreModel,
) -> Frequency | None:
    """Natural frequency of 100: a point only with high confidence and a published point."""
    if band is None or set_by != BandSetBy.model:
        return None
    points = model.config.high_confidence_points
    if confidence == ConfidenceLevel.high and band in points:
        pt = points[band]
        return Frequency(FrequencyKind.point, pt, pt, pt)
    r = model.config.band_ranges[band]
    return Frequency(FrequencyKind.range, r.low, r.high, None)
