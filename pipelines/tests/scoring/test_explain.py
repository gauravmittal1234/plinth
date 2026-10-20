"""Interpretability: every band traces to bins, contributions and sourced reasons; the
counterfactual lines are checked by re-scoring; the replay audit reports the ledger gap."""

from __future__ import annotations

from datetime import date

import pytest
from plinth_contracts import BandCode

from plinth.scoring.change import smallest_crossing
from plinth.scoring.cli import main
from plinth.scoring.explain import explain, replay_audit
from plinth.scoring.fixture_world import load_ledger
from plinth.scoring.model import load_model
from plinth.scoring.runs import ScoringResult, run_scoring
from plinth.scoring.world import World

V12 = load_model("v1.2")


def test_explain_traces_every_phase(result: ScoringResult) -> None:
    text = explain(result)
    assert "Factor weights from the scorecard's spreads: finances 30, track_record 30," in text
    for a in result.assessments.values():
        assert f"({a.phase.slug})" in text
        for r in a.reasons:
            assert r.text in text
    assert "watch pass at the clock: proposes High" in text
    assert "due by 2026-10-19T19:40:00+05:30 (reading)" in text


def test_contributions_add_up(result: ScoringResult) -> None:
    for a in result.assessments.values():
        total = V12.scorecard.intercept + sum(c.contribution for c in a.score.contributions)
        assert total == pytest.approx(a.score.logit)
        if a.set_by is not None and a.set_by.value == "model":
            r = V12.config.band_ranges[a.score.band]
            assert r.low <= 100 * a.score.p_late12 < r.high  # p sits in its band's range


@pytest.mark.parametrize(
    ("slug", "scenario", "to"),
    [
        ("aurelia-heights-phase-2", "catch_up_sales", BandCode.moderate),
        ("sapphire-grove-phase-1", "catch_up_schedule", BandCode.low),
        ("coral-towers", "catch_up_schedule", BandCode.elevated),
        ("cedar-walk-phase-2", "catch_up_schedule", BandCode.low),
    ],
)
def test_what_would_change_is_a_real_counterfactual(
    result: ScoringResult, slug: str, scenario: str, to: BandCode
) -> None:
    a = result.assessments[slug]
    assert a.band is not None
    cf = smallest_crossing(a.values, a.band, V12)
    assert cf is not None and (cf.scenario, cf.band) == (scenario, to)
    assert a.what_would_change is not None and a.what_would_change.endswith(
        f"to {to.value.title()}."
    )


def test_replay_audit_reports_the_gap(world: World) -> None:
    text = replay_audit(world, load_ledger())
    rows = {
        (line.split()[0], line.split()[2]): line.split()[-1] for line in text.splitlines()[2:-1]
    }
    assert rows[("aurelia-heights-phase-2", "2026-09-30")] == "agrees"
    assert rows[("kestrel-park", "2026-07-15")] == "agrees"
    assert rows[("laurel-residency", "2026-07-15")] == "agrees"
    # Inputs of the day that the canonical facts don't hold: complaint history (C-11) and
    # Sapphire's first QPR on record (Apr-Jun 2026, filed 27 Jul 2026).
    assert rows[("aurelia-heights-phase-2", "2026-09-02")] == "differs"
    assert rows[("sapphire-grove-phase-1", "2026-07-15")] == "differs"
    assert text.endswith("6 of 10 agree.\n")


def test_cli_explain_and_audit(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["score", "--fixtures", "--as-of", "2026-10-14", "--emit", "explain"]) == 0
    assert "Delivery Risk v1.2 · data as of 14 Oct 2026" in capsys.readouterr().out
    assert main(["score", "--fixtures", "--as-of", "2026-10-14", "--replay-audit"]) == 0
    assert "6 of 10 agree." in capsys.readouterr().out


def test_as_of_selects_the_model(world: World) -> None:
    res = run_scoring(world, date(2026, 9, 2))
    assert res.model.version == "v1.1"
    assert [m.version for m in res.models] == ["v1.0", "v1.1"]
