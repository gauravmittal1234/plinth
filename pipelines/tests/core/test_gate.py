"""Live fetch is refused without both keys (BUILD_PLAN §1 rule 8), in CI and under pytest."""

from __future__ import annotations

import itertools
import os

import httpx
import pytest

from plinth.core.clock import FrozenClock
from plinth.core.config import FetchMode, PipelineConfig
from plinth.core.flags import HARERA_LIVE_FETCH, DbFlags, NoFlags, StaticFlags
from plinth.core.gate import HARERA_HOSTS, LiveFetchRefused, LiveGate, LivePermit
from plinth.core.http_fetcher import HttpFetcher
from plinth.core.pipeline import make_fetcher
from plinth.core.testing import FakeConnection

CLOCK = FrozenClock()
ON = StaticFlags({HARERA_LIVE_FETCH: True})
OFF = StaticFlags({HARERA_LIVE_FETCH: False})


def live_config(**changes: object) -> PipelineConfig:
    """Every live condition met, except what `changes` takes away."""
    base: dict[str, object] = {
        "mode": FetchMode.LIVE,
        "live_approved": True,
        "contact": "data@example.test",
        "ci": False,
        "under_pytest": False,
    }
    base.update(changes)
    return PipelineConfig(**base)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("flag_on", "approved"), list(itertools.product([False, True], [False, True]))
)
def test_live_needs_both_keys(flag_on: bool, approved: bool) -> None:
    gate = LiveGate(live_config(live_approved=approved), ON if flag_on else OFF, CLOCK)
    decision = gate.decide()
    assert decision.allowed is (flag_on and approved)
    if not flag_on:
        assert any("harera_live_fetch is off" in r for r in decision.refusals)
    if not approved:
        assert any("HARERA_LIVE_FETCH_APPROVED" in r for r in decision.refusals)
    if decision.allowed:
        permit = gate.authorize()
        assert permit.hosts == HARERA_HOSTS
        assert permit.contact == "data@example.test"
    else:
        with pytest.raises(LiveFetchRefused):
            gate.authorize()


@pytest.mark.parametrize(
    ("changes", "reason"),
    [
        ({"mode": FetchMode.FIXTURES}, "PLINTH_FETCH_MODE is 'fixtures'"),
        ({"ci": True}, "running in CI"),
        ({"under_pytest": True}, "running under pytest"),
        ({"contact": None}, "PLINTH_FETCH_CONTACT"),
        ({"contact": "not-an-email"}, "PLINTH_FETCH_CONTACT"),
    ],
)
def test_live_refused_for_each_missing_condition(changes: dict[str, object], reason: str) -> None:
    decision = LiveGate(live_config(**changes), ON, CLOCK).decide()
    assert not decision.allowed
    assert any(reason in r for r in decision.refusals), decision.refusals
    assert reason in decision.explain()


def test_default_environment_refuses_everything() -> None:
    decision = LiveGate(PipelineConfig.from_env({}), NoFlags(), CLOCK).decide()
    assert not decision.allowed
    assert len(decision.refusals) == 4  # mode, flag, approval, contact


def test_this_test_process_can_never_go_live() -> None:
    """Even with every key set in the environment, pytest itself is refused."""
    env = dict(os.environ) | {
        "PLINTH_FETCH_MODE": "live",
        "HARERA_LIVE_FETCH_APPROVED": "yes",
        "PLINTH_FETCH_CONTACT": "data@example.test",
    }
    cfg = PipelineConfig.from_env(env)
    assert cfg.under_pytest
    decision = LiveGate(cfg, ON, CLOCK).decide()
    assert not decision.allowed
    assert any("pytest" in r for r in decision.refusals)


def test_permit_cannot_be_forged() -> None:
    with pytest.raises(LiveFetchRefused, match=r"LiveGate\.authorize"):
        LivePermit(
            hosts=frozenset({"haryanarera.gov.in"}), contact="x@example.test", issued_at=CLOCK.now()
        )


def test_http_fetcher_refuses_a_real_transport_without_a_permit() -> None:
    with pytest.raises(LiveFetchRefused, match="LivePermit"):
        HttpFetcher(None, clock=CLOCK)
    with pytest.raises(LiveFetchRefused):
        HttpFetcher(None, clock=CLOCK, transport=httpx.HTTPTransport())


def test_make_fetcher_in_live_mode_goes_through_the_gate() -> None:
    with pytest.raises(LiveFetchRefused, match="harera_live_fetch is off"):
        make_fetcher(live_config(), flags=OFF, clock=CLOCK, fixtures_dir=None)


def test_permit_covers_only_its_hosts() -> None:
    permit = LiveGate(live_config(), ON, CLOCK).authorize(["Portal.Example.Test"])
    assert permit.covers("portal.example.test")
    assert not permit.covers("haryanarera.gov.in")


def test_unknown_flag_keys_are_rejected() -> None:
    with pytest.raises(KeyError):
        NoFlags().read("scrape_everything")
    with pytest.raises(KeyError):
        ON.read("scrape_everything")


def test_db_flags_read_ops_flag() -> None:
    conn = FakeConnection()
    conn.script("select ops.flag(", [(True,)])
    read = DbFlags(conn).read(HARERA_LIVE_FETCH)
    assert read.enabled and read.source == "database"
    assert conn.statements == [("select ops.flag(%s)", ("harera_live_fetch",))]


def test_db_flags_fail_closed() -> None:
    conn = FakeConnection()
    conn.fail("select ops.flag(", PermissionError("permission denied for function flag"))
    read = DbFlags(conn).read(HARERA_LIVE_FETCH)
    assert read.enabled is False
    assert read.note is not None and "unreadable" in read.note
    assert conn.rollbacks == 1
    decision = LiveGate(live_config(), DbFlags(conn), CLOCK).decide()
    assert not decision.allowed
    assert any("unreadable" in r for r in decision.refusals)


def test_db_flags_null_or_false_is_off() -> None:
    for rows in ([], [(None,)], [(False,)]):
        conn = FakeConnection()
        conn.script("select ops.flag(", rows)
        assert DbFlags(conn).read(HARERA_LIVE_FETCH).enabled is False
