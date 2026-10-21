"""BUILD_PLAN §7.1: every row is a test. Canonical facts, data cutoff 14 Oct 2026, model v1.2,
clock 18 Oct 2026 12:00 IST."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from itertools import pairwise
from pathlib import Path

import pytest
from plinth_contracts import BandCode, BandSetBy, ConfidenceLevel, FrequencyKind, ScoreState

from plinth.scoring.dates import fmt_month, fmt_quarter
from plinth.scoring.emit import calibration_stats, document
from plinth.scoring.features import build_view, complaints_rate, late12
from plinth.scoring.model import load_model
from plinth.scoring.runs import Run, ScoringResult, run_scoring, settle_notice
from plinth.scoring.world import QprFiling, World

IST = timezone(timedelta(hours=5, minutes=30))
AS_OF = date(2026, 10, 14)
CLOCK = datetime(2026, 10, 18, 12, 0, tzinfo=IST)
AURELIA = "aurelia-heights-phase-2"
NORTHFIELD_FINISHED = 6


def current(result: ScoringResult, slug: str) -> Run:
    return result.current_run(slug)


# ---- the eight phases ---------------------------------------------------------------------


def test_aurelia_elevated_low_confidence_range(result: ScoringResult) -> None:
    run = current(result, AURELIA)
    assert (run.state, run.band, run.set_by) == (
        ScoreState.scored,
        BandCode.elevated,
        BandSetBy.model,
    )
    assert run.model_version == "v1.2" and run.data_cutoff == AS_OF
    # Low confidence: Northfield has 6 finished RERA projects, below confidence.min_finished 8.
    a = result.assessments[AURELIA]
    assert a.view.track is not None and a.view.track.finished == NORTHFIELD_FINISHED
    assert result.model.config.confidence.min_finished == 8
    assert run.confidence == ConfidenceLevel.low
    # "Between 30 and 45 of 100": icon array 30 filled + 15 hatched.
    f = run.frequency
    assert f is not None and f.kind == FrequencyKind.range and (f.low, f.high) == (30, 45)
    assert (f.low, f.high - f.low) == (30, 15)


@pytest.mark.parametrize(
    ("slug", "band", "point"),
    [("kestrel-park", BandCode.low, 10), ("sapphire-grove-phase-1", BandCode.moderate, 20)],
)
def test_high_confidence_points(
    result: ScoringResult, slug: str, band: BandCode, point: int
) -> None:
    run = current(result, slug)
    assert run.band == band and run.confidence == ConfidenceLevel.high
    assert run.frequency is not None and run.frequency.kind == FrequencyKind.point
    assert run.frequency.point == point  # "About 10 of 100" / "About 20 of 100"


def test_coral_high_low_confidence_and_stale(result: ScoringResult) -> None:
    run = current(result, "coral-towers")
    assert (run.band, run.confidence, run.stale) == (BandCode.high, ConfidenceLevel.low, True)
    [stale] = result.stale
    assert stale.phase == "coral-towers"
    assert (stale.latest_quarter, stale.latest_filed_on) == ("2026-Q1", date(2026, 4, 14))
    assert fmt_quarter(stale.latest_quarter) == "Jan–Mar 2026"  # noqa: RUF001 (en dash is the copy)
    assert stale.age_days_on_clock == 187 and stale.stale_after_days == 120


def test_laurel_severe_by_red_flag_with_stall(result: ScoringResult) -> None:
    run = current(result, "laurel-residency")
    assert (run.band, run.set_by, run.rule_code) == (
        BandCode.severe,
        BandSetBy.red_flag_rule,
        "RF1_GROUP_CIRP",
    )
    assert run.frequency is None and run.confidence is None  # no frequency shown
    [flag] = result.red_flags
    assert (flag.rule_code, flag.subject, flag.triggered_on) == (
        "RF1_GROUP_CIRP",
        "elmstone-developers",
        date(2023, 3, 12),  # NCLT order
    )
    assert run.stall
    [stall] = result.stalls
    assert stall.quarters == ("2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2")
    assert stall.built_pct == 34
    assert result.assessments["laurel-residency"].view.time_used_pct == 106


def test_juniper_limited_history(result: ScoringResult) -> None:
    run = current(result, "juniper-enclave")
    assert run.state == ScoreState.limited_history
    assert run.band is None and run.frequency is None and run.reasons == ()
    a = result.assessments["juniper-enclave"]
    assert a.view.track is not None and a.view.track.finished < 3  # Halcyon Homes: no penalty


def test_heron_point_not_scored(result: ScoringResult) -> None:
    run = current(result, "heron-point-phase-2")
    assert run.state == ScoreState.not_scored and run.band is None
    reg = result.assessments["heron-point-phase-2"].view.registration
    assert reg.registered_on == date(2026, 4, 28)  # < 6 months before 14 Oct 2026


def test_cedar_walk_moderate(result: ScoringResult) -> None:
    run = current(result, "cedar-walk-phase-2")
    assert (run.band, run.confidence) == (BandCode.moderate, ConfidenceLevel.low)
    assert run.frequency is not None and (run.frequency.low, run.frequency.high) == (15, 30)


# ---- Late12 and time used -----------------------------------------------------------------


def test_aurelia_late12_is_apr_2029(result: ScoringResult) -> None:
    line = result.assessments[AURELIA].view.late12
    assert line.blanket_extension_months == 4
    assert fmt_month(line.late_after) == "Apr 2029"
    assert fmt_month(line.late_after) != "Dec 2028"


def test_time_used_is_month_based(result: ScoringResult) -> None:
    expected = {
        AURELIA: 77,
        "kestrel-park": 58,
        "sapphire-grove-phase-1": 55,
        "coral-towers": 70,
        "laurel-residency": 106,
        "juniper-enclave": 31,
        "heron-point-phase-2": 10,
        "cedar-walk-phase-2": 92,
    }
    assert {s: a.view.time_used_pct for s, a in result.assessments.items()} == expected


# ---- Aurelia's reasons and filings --------------------------------------------------------


def test_aurelia_reasons_exact(result: ScoringResult) -> None:
    run = current(result, AURELIA)
    assert [(r.factor, r.text) for r in run.reasons] == [
        ("finances", "72% of units sold, 41% built."),
        (
            "timeline",
            "77% of the promised time used. QPRs filed late in 3 of the last 8 quarters.",
        ),
        (
            "legal",
            "14 complaints decided against the promoter in 24 months · 2.8 per 100 units."
            " Median count for similar projects: 3.",
        ),
        (
            "track_record",
            "2 of the group's 6 finished RERA projects got OC more than 12 months late.",
        ),
    ]
    assert all(len(r.fact_ids) >= 1 for r in run.reasons)
    contribs = [abs(r.contribution or 0) for r in run.reasons]
    assert contribs == sorted(contribs, reverse=True)  # ranked by contribution


def test_aurelia_late_filings(result: ScoringResult) -> None:
    window = result.assessments[AURELIA].view.window
    assert [(f.quarter, f.days_late) for f in window.late] == [
        ("2024-Q3", 12),
        ("2025-Q1", 41),
        ("2025-Q4", 38),
    ]
    assert [f.quarter for f in window.rows] == [
        "2024-Q3",
        "2024-Q4",
        "2025-Q1",
        "2025-Q2",
        "2025-Q3",
        "2025-Q4",
        "2026-Q1",
        "2026-Q2",
    ]
    q2 = next(f for f in window.rows if f.quarter == "2026-Q2")
    assert q2.status == "on_time" and q2.filed_on == date(2026, 7, 15)  # D-118 upheld


# ---- band history and the pending change --------------------------------------------------


def test_band_history(result: ScoringResult) -> None:
    rows = [h for h in result.history if h.phase == AURELIA]
    assert [(h.band, h.from_date, h.to_date, h.model_version) for h in rows] == [
        (BandCode.moderate, date(2026, 7, 15), date(2026, 9, 2), "v1.0"),
        (BandCode.moderate, date(2026, 9, 2), date(2026, 10, 2), "v1.1"),
        (BandCode.elevated, date(2026, 10, 2), date(2026, 10, 14), "v1.1"),
        (BandCode.elevated, date(2026, 10, 14), None, "v1.2"),
    ]
    assert not [h for h in rows if h.band == BandCode.elevated and h.from_date < date(2026, 10, 2)]
    heads_up = next(n for n in result.notices if n.kind == "heads_up_48h")
    assert (heads_up.sent_on, heads_up.effective_on) == (date(2026, 9, 30), date(2026, 10, 2))
    assert heads_up.effective_on - heads_up.sent_on == timedelta(hours=48)
    elevated_run = next(r for r in result.runs if r.id == rows[2].run)
    assert elevated_run.notice == heads_up.id


def test_history_intervals_chain(result: ScoringResult) -> None:
    for slug in result.assessments:
        rows = [h for h in result.history if h.phase == slug]
        assert rows[-1].to_date is None
        for a, b in pairwise(rows):
            assert a.to_date == b.from_date


def test_pending_change_needs_seven_day_notice(result: ScoringResult) -> None:
    pending = result.pending_run(AURELIA)
    assert pending is not None
    assert (pending.band, pending.status, pending.published_on) == (
        BandCode.high,
        "pending_notice",
        None,
    )
    assert pending.data_cutoff == date(2026, 10, 18)
    assert pending.reasons == () and pending.what_would_change is None
    notice = next(n for n in result.notices if n.kind == "notice_7day")
    assert (notice.from_band, notice.to_band) == (BandCode.elevated, BandCode.high)
    assert (notice.sent_on, notice.effective_on) == (date(2026, 10, 18), date(2026, 10, 25))
    assert notice.proposed_run == pending.id and pending.notice == notice.id
    expected = "The Jul–Sep 2026 QPR, due 15 Oct 2026, is not on HARERA."  # noqa: RUF001
    assert notice.reason_text == expected
    # Buyers never see High before publication: the current band stays Elevated.
    assert current(result, AURELIA).band == BandCode.elevated
    assert all(h.band != BandCode.high for h in result.history if h.phase == AURELIA)


def test_pending_change_needs_the_missing_qpr(result: ScoringResult, world: World) -> None:
    """The proposal comes from the missing Jul-Sep QPR alone: only that feature moved."""
    b = result.proposals[AURELIA]
    a = result.assessments[AURELIA]
    moved = {
        c.feature
        for c, d in zip(b.score.contributions, a.score.contributions, strict=True)
        if c.contribution != d.contribution
    }
    assert "missing_qprs" in moved
    assert [f.quarter for f in b.view.window.missing] == ["2026-Q3"]


def _with_q3_filed(world: World, filed_on: date) -> World:
    rows = []
    for f in world.catalogue.qpr_filings:
        if f.phase == AURELIA and f.quarter == "2026-Q3":
            f = QprFiling.model_validate(
                {
                    **f.model_dump(),
                    "status": "late",
                    "filed_on": filed_on,
                    "days_late": (filed_on - f.due_on).days,
                }
            )
        rows.append(f)
    return world.replace(qpr_filings=rows)


def test_notice_withdrawn_if_qpr_lands_before_25_oct(result: ScoringResult, world: World) -> None:
    on = datetime(2026, 10, 25, 12, 0, tzinfo=IST)
    assert settle_notice(world, result, AURELIA, on) == "effective"  # still missing
    landed = _with_q3_filed(world, date(2026, 10, 22))
    assert settle_notice(landed, result, AURELIA, on) == "withdrawn"  # Elevated stays


def test_the_database_publishes_a_notice_that_holds() -> None:
    """settle_notice decides and writes nothing: the database's daily job publishes (T59 gap 1)."""
    root = Path(__file__).resolve().parents[3]
    sql = (root / "supabase/migrations/20261127000300_lead_publish_due_notices.sql").read_text()
    assert "create function ops.publish_due_notice_runs()" in sql
    assert "cron.schedule('publish-due-notice-runs', '35 18 * * *'" in sql  # 00:05 IST
    assert "ops.publish_due_notice_runs()" in (settle_notice.__doc__ or "")


def test_no_proposal_if_the_qpr_was_on_record(world: World) -> None:
    landed = _with_q3_filed(world, date(2026, 10, 16))
    res = run_scoring(landed, AS_OF)
    assert AURELIA not in res.proposals and res.pending_run(AURELIA) is None
    assert not [n for n in res.notices if n.kind == "notice_7day"]


# ---- re-scoring ---------------------------------------------------------------------------


def test_sapphire_rescoring_window(result: ScoringResult) -> None:
    [rs] = result.rescoring
    assert (rs.phase, rs.quarter) == ("sapphire-grove-phase-1", "2026-Q3")
    assert rs.fetched_at == datetime(2026, 10, 16, 19, 40, tzinfo=IST)
    assert rs.due_by == datetime(2026, 10, 19, 19, 40, tzinfo=IST)  # 72 hours
    assert rs.status == "reading"
    # It shows Moderate from the Apr-Jun 2026 QPR and no figures from the new filing.
    a = result.assessments["sapphire-grove-phase-1"]
    assert a.view.progress is not None and a.view.progress.filing.quarter == "2026-Q2"
    assert current(result, "sapphire-grove-phase-1").band == BandCode.moderate


def test_rescoring_overdue_after_72_hours(world: World) -> None:
    late = run_scoring(world, AS_OF, clock=datetime(2026, 10, 19, 19, 41, tzinfo=IST))
    [rs] = late.rescoring
    assert rs.status == "overdue"


# ---- complaint rates and calibration ------------------------------------------------------


@pytest.mark.parametrize(
    ("subject_type", "subject", "count", "units", "rate"),
    [
        ("phase", AURELIA, 14, 500, 2.8),
        ("group", "northfield-estates", 24, 3400, 0.7),
        ("phase", "kestrel-park", 2, 420, 0.5),
        ("phase", "sapphire-grove-phase-1", 5, 360, 1.4),
    ],
)
def test_complaint_rates(
    world: World, subject_type: str, subject: str, count: int, units: int, rate: float
) -> None:
    c = world.complaints(subject_type, subject)
    assert c is not None and (c.count_24m, c.units_base) == (count, units)
    assert complaints_rate(c) == rate


def test_calibration(result: ScoringResult) -> None:
    doc = document(result)
    per_100 = {row["band"]: row["per_100"] for row in doc["calibration"]}
    assert per_100 == {
        BandCode.low: 9,
        BandCode.moderate: 31,
        BandCode.elevated: 38,
        BandCode.high: 56,
        BandCode.severe: 74,
    }
    n, late, base, brier, baseline = calibration_stats(result.model)
    assert (n, late, base) == (212, 76, 36)
    assert (round(brier, 2), round(baseline, 2)) == (Decimal("0.19"), Decimal("0.23"))


def test_late12_uses_model_blanket_rule(world: World) -> None:
    """v1.0 and v1.1 did not add blanket extensions; v1.2 does (changelog)."""
    reg = world.registration(AURELIA)
    for version, months in (("v1.0", 0), ("v1.1", 0), ("v1.2", 4)):
        line = late12(world, reg.original_completion, load_model(version), AS_OF)
        assert line.blanket_extension_months == months


def test_view_ignores_facts_after_the_cutoff(world: World) -> None:
    """Point in time: on 30 Sep 2026 Kestrel's Jul-Sep QPR (filed 12 Oct) is not known."""
    m = load_model("v1.2")
    early = build_view(
        world, world.phase("kestrel-park"), datetime(2026, 9, 30, 23, 59, tzinfo=IST), m
    )
    assert early.progress is not None and early.progress.built_pct == 59
    later = build_view(world, world.phase("kestrel-park"), CLOCK, m)
    assert later.progress is not None and later.progress.built_pct == 63
