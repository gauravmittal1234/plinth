"""BUILD_PLAN §7.1 properties (hypothesis): widening sold - built never lowers the band; an
extra late QPR never improves it; a red flag always gives Severe; reasons <= 4; every
published reason cites a fact. Plus: no look-ahead, and missing data never moves a band."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from plinth_contracts import BandCode, BandSetBy, ScoreState

from plinth.scoring.assess import Assessment, assess
from plinth.scoring.features import FeatureValue, build_view
from plinth.scoring.model import (
    BANDS,
    band_step,
    load_model,
    load_reasons,
    load_red_flags,
)
from plinth.scoring.runs import ScoringResult
from plinth.scoring.scorecard import score
from plinth.scoring.world import InsolvencyEvent, QprFiling, Registration, World, ref_instant

IST = timezone(timedelta(hours=5, minutes=30))
AS_OF = date(2026, 10, 14)
V12 = load_model("v1.2")
CAT = load_reasons()
FLAGS = load_red_flags()
SCORED = [
    "aurelia-heights-phase-2",
    "kestrel-park",
    "sapphire-grove-phase-1",
    "coral-towers",
    "cedar-walk-phase-2",
]
PHASES = [*SCORED, "laurel-residency", "juniper-enclave", "heron-point-phase-2"]
LATE_LEVELS = ["0, full window", "0, short record", "1", "2", "3 or more"]
SETTINGS = settings(
    max_examples=60, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture]
)


def run(world: World, slug: str, on: date = AS_OF) -> Assessment:
    return assess(world, world.phase(slug), ref_instant(on), V12, CAT, FLAGS)


def step(a: Assessment) -> int:
    return band_step(a.band) if a.band is not None else 0


def maybe(s: st.SearchStrategy[FeatureValue]) -> st.SearchStrategy[FeatureValue]:
    return st.one_of(st.none(), s)


values_strategy = st.fixed_dictionaries(
    {
        "sold_minus_built_pct": maybe(st.integers(-100, 100)),
        "group_late12_pct": maybe(st.floats(0, 100)),
        "time_used_minus_built_pct": maybe(st.integers(-100, 150)),
        "late_filings_last_8": maybe(st.sampled_from(LATE_LEVELS)),
        "missing_qprs": st.integers(0, 6),
        "extensions": st.integers(0, 5),
        "complaints_per_100_units": maybe(st.floats(0, 30)),
        "stall": st.sampled_from(["no", "yes"]),
    }
)


# ---- scorecard-level monotonicity ---------------------------------------------------------


@SETTINGS
@given(values_strategy, st.integers(0, 100))
def test_widening_sold_minus_built_never_lowers_the_band(
    values: dict[str, FeatureValue], widen: int
) -> None:
    if values["sold_minus_built_pct"] is None:
        values["sold_minus_built_pct"] = 0
    wider = {**values, "sold_minus_built_pct": float(values["sold_minus_built_pct"] or 0) + widen}
    assert band_step(score(wider, V12).band) >= band_step(score(values, V12).band)


@SETTINGS
@given(values_strategy)
def test_more_late_filings_never_improve_the_band(values: dict[str, FeatureValue]) -> None:
    steps = [
        band_step(score({**values, "late_filings_last_8": level}, V12).band)
        for level in LATE_LEVELS
    ]
    assert steps == sorted(steps)


@SETTINGS
@given(values_strategy, st.integers(1, 3))
def test_more_missing_qprs_never_improve_the_band(
    values: dict[str, FeatureValue], extra: int
) -> None:
    more = {**values, "missing_qprs": int(values["missing_qprs"] or 0) + extra}
    assert band_step(score(more, V12).band) >= band_step(score(values, V12).band)


# ---- the same properties on the fixture world ---------------------------------------------


def _set_sold(world: World, slug: str, sold: int) -> World:
    rows = list(world.catalogue.qpr_filings)
    last = max(
        (i for i, f in enumerate(rows) if f.phase == slug and f.built_pct is not None),
        key=lambda i: rows[i].quarter,
    )
    rows[last] = rows[last].model_copy(update={"sold_pct": sold})
    return world.replace(qpr_filings=rows)


@SETTINGS
@given(st.integers(41, 100), st.integers(0, 59))
def test_aurelia_wider_sales_gap_never_lowers_the_band(world: World, sold: int, more: int) -> None:
    a = run(_set_sold(world, "aurelia-heights-phase-2", sold), "aurelia-heights-phase-2")
    b = run(
        _set_sold(world, "aurelia-heights-phase-2", min(100, sold + more)),
        "aurelia-heights-phase-2",
    )
    assert step(b) >= step(a)


@SETTINGS
@given(st.sampled_from(SCORED), st.data())
def test_an_extra_late_qpr_never_improves_the_band(
    world: World, slug: str, data: st.DataObject
) -> None:
    before = run(world, slug)
    on_time = [
        f
        for f in before.view.window.rows
        if f.status == "on_time" and f.known_at() <= ref_instant(AS_OF)
    ]
    if not on_time:
        return
    target: QprFiling = data.draw(st.sampled_from(on_time))
    days = data.draw(st.integers(1, 120))
    rows = [
        f.model_copy(
            update={
                "status": "late",
                "days_late": days,
                "filed_on": target.due_on + timedelta(days=days) if f.filed_on else None,
            }
        )
        if f is target
        else f
        for f in world.catalogue.qpr_filings
    ]
    after = run(world.replace(qpr_filings=rows), slug)
    assert step(after) >= step(before)


@SETTINGS
@given(st.sampled_from(PHASES), st.dates(date(2015, 1, 1), AS_OF))
def test_a_red_flag_always_gives_severe(world: World, slug: str, admitted: date) -> None:
    group = world.group_of(world.phase(slug)).slug
    dev = next((d.key for d in world.catalogue.developers if d.group == group), group)
    event = InsolvencyEvent(
        developer=dev, group=group, kind="admitted", event_on=admitted, forum="NCLT"
    )
    flagged = world.replace(insolvency_events=[*world.catalogue.insolvency_events, event])
    a = run(flagged, slug)
    assert (a.state, a.band, a.set_by, a.rule_code) == (
        ScoreState.scored,
        BandCode.severe,
        BandSetBy.red_flag_rule,
        "RF1_GROUP_CIRP",
    )
    assert a.frequency is None and a.confidence is None


@SETTINGS
@given(st.sampled_from(PHASES), st.sampled_from(["revoked", "deregistered", "lapsed"]))
def test_a_revoked_registration_gives_severe(world: World, slug: str, status: str) -> None:
    regs: list[Registration] = [
        r.model_copy(update={"status": status}) if r.phase == slug else r
        for r in world.catalogue.rera_registrations
    ]
    a = run(world.replace(rera_registrations=regs), slug)
    assert a.band == BandCode.severe and a.set_by == BandSetBy.red_flag_rule


# ---- reasons ------------------------------------------------------------------------------


def test_published_reasons_cite_facts(result: ScoringResult, world: World) -> None:
    known = world.facts_by_id
    for r in result.runs:
        assert len(r.reasons) <= 4
        for reason in r.reasons:
            assert reason.fact_ids, reason
            assert all(fid in known for fid in reason.fact_ids)
    for n in result.notices:
        assert all(fid in known for fid in n.trigger_fact_ids)


@SETTINGS
@given(st.sampled_from(SCORED), st.integers(-30, 40), st.integers(0, 4), st.data())
def test_reasons_bounded_and_sourced_under_perturbation(
    world: World, slug: str, built_delta: int, late: int, data: st.DataObject
) -> None:
    rows = list(world.catalogue.qpr_filings)
    for i, f in enumerate(rows):
        if f.phase != slug:
            continue
        if f.built_pct is not None:
            rows[i] = f.model_copy(
                update={"built_pct": max(0, min(100, f.built_pct + built_delta))}
            )
    on_time = [i for i, f in enumerate(rows) if f.phase == slug and f.status == "on_time"]
    for i in (
        data.draw(st.lists(st.sampled_from(on_time), max_size=late, unique=True)) if on_time else []
    ):
        rows[i] = rows[i].model_copy(update={"status": "late", "days_late": 9})
    a = run(world.replace(qpr_filings=rows), slug)
    assert len(a.reasons) <= 4
    known = world.facts_by_id
    for reason in a.reasons:
        assert reason.fact_ids and all(fid in known for fid in reason.fact_ids)
        assert "{" not in reason.text and "}" not in reason.text
    if a.state == ScoreState.scored and a.set_by == BandSetBy.model:
        assert a.what_would_change is not None


# ---- point in time and missing data -------------------------------------------------------


@SETTINGS
@given(st.sampled_from(PHASES), st.dates(date(2023, 1, 1), date(2026, 10, 18)))
def test_no_look_ahead(world: World, slug: str, on: date) -> None:
    ref = datetime(on.year, on.month, on.day, 23, 59, tzinfo=IST)
    v = build_view(world, world.phase(slug), ref, V12)
    for f in v.window.rows:
        if f in v.window.missing:
            assert f.due_on < on
        else:
            assert f.known_at() <= ref
    assert all(e.granted_on <= on for e in v.extensions)
    if v.progress is not None:
        assert v.progress.filing.known_at() <= ref


@SETTINGS
@given(values_strategy, st.sampled_from(sorted(f.code for f in V12.scorecard.features)))
def test_missing_data_never_moves_the_band(values: dict[str, FeatureValue], code: str) -> None:
    feature = V12.scorecard.feature(code)
    assert feature.missing_woe == 0.0
    blank = {**values, code: None}
    s = score(blank, V12)
    assert s.contribution(code) == 0.0
    assert s.band in BANDS
