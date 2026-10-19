"""Config, modes and the frozen clock."""

from __future__ import annotations

from datetime import UTC, date, datetime
from pathlib import Path

import pytest

from plinth.core.clock import (
    FROZEN_NOW,
    IST,
    FrozenClock,
    SystemClock,
    parse_instant,
    require_aware,
    today_ist,
)
from plinth.core.config import ConfigError, FetchMode, PipelineConfig


def test_frozen_now_is_the_design_today() -> None:
    assert FROZEN_NOW.isoformat() == "2026-10-18T12:00:00+05:30"
    assert FrozenClock().now() == FROZEN_NOW
    assert today_ist(FrozenClock()) == date(2026, 10, 18)


def test_today_is_the_ist_date() -> None:
    late_utc = FrozenClock(datetime(2026, 10, 18, 20, 0, tzinfo=UTC))  # 01:30 IST on the 19th
    assert today_ist(late_utc) == date(2026, 10, 19)


def test_clocks_refuse_naive_times() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        FrozenClock(datetime(2026, 10, 18, 12, 0))
    with pytest.raises(ValueError, match="timezone-aware"):
        parse_instant("2026-10-18T12:00:00")
    assert SystemClock().now().tzinfo is not None
    assert require_aware(FROZEN_NOW, "x") is FROZEN_NOW


def test_parse_instant_accepts_offsets_and_z() -> None:
    assert parse_instant("2026-10-18T12:00:00+05:30") == FROZEN_NOW
    assert parse_instant("2026-10-18T06:30:00Z") == FROZEN_NOW


def test_defaults_are_fixtures_mode_on_the_frozen_clock(tmp_path: Path) -> None:
    cfg = PipelineConfig.from_env({"XDG_CACHE_HOME": str(tmp_path)})
    assert cfg.mode is FetchMode.FIXTURES
    assert cfg.clock().now() == FROZEN_NOW
    assert cfg.db_url is None
    assert cfg.live_approved is False
    assert cfg.snapshot_dir == tmp_path / "plinth" / "snapshots"


def test_from_env_reads_every_name(tmp_path: Path) -> None:
    cfg = PipelineConfig.from_env(
        {
            "PLINTH_FETCH_MODE": "LIVE",
            "HARERA_LIVE_FETCH_APPROVED": "yes",
            "PIPELINE_DB_URL": "postgresql://pipeline_writer@db.example.test/postgres",
            "PLINTH_FETCH_CONTACT": "data@example.test",
            "PLINTH_SNAPSHOT_DIR": str(tmp_path),
            "CI": "true",
            "PYTEST_CURRENT_TEST": "x",
        }
    )
    assert cfg.mode is FetchMode.LIVE
    assert cfg.live_approved is True
    assert cfg.db_url is not None
    assert cfg.contact == "data@example.test"
    assert cfg.snapshot_dir == tmp_path
    assert cfg.ci is True
    assert cfg.under_pytest is True
    assert isinstance(cfg.clock(), SystemClock)


@pytest.mark.parametrize("value", ["YES", "yes ", "true", "1", "y", "approved", ""])
def test_only_exact_yes_is_approval(value: str) -> None:
    assert PipelineConfig.from_env({"HARERA_LIVE_FETCH_APPROVED": value}).live_approved is False


@pytest.mark.parametrize(
    ("value", "ci"), [("true", True), ("1", True), ("false", False), ("", False)]
)
def test_ci_detection(value: str, ci: bool) -> None:
    assert PipelineConfig.from_env({"CI": value}).ci is ci


def test_unknown_mode_is_an_error() -> None:
    with pytest.raises(ConfigError, match="PLINTH_FETCH_MODE"):
        PipelineConfig.from_env({"PLINTH_FETCH_MODE": "scrape"})


def test_fixed_now_moves_the_fixture_clock_only() -> None:
    cfg = PipelineConfig.from_env({"PLINTH_FIXED_NOW": "2026-10-25T09:00:00+05:30"})
    assert cfg.clock().now() == datetime(2026, 10, 25, 9, 0, tzinfo=IST)
    with pytest.raises(ConfigError, match="fixture mode only"):
        PipelineConfig.from_env(
            {"PLINTH_FETCH_MODE": "live", "PLINTH_FIXED_NOW": "2026-10-25T09:00:00+05:30"}
        )


def test_politeness_floor_cannot_be_configured_away() -> None:
    with pytest.raises(ConfigError, match="politeness floor"):
        PipelineConfig(request_interval=(1.0, 2.0))
    with pytest.raises(ConfigError):
        PipelineConfig(request_interval=(5.0, 4.0))


def test_describe_never_prints_the_db_url() -> None:
    url = "postgresql://pipeline_writer@db.example.test:5432/postgres"
    cfg = PipelineConfig.from_env({"PIPELINE_DB_URL": url})
    described = repr(cfg.describe()) + repr(cfg)
    assert "db.example.test" not in described
    assert cfg.describe()["db"] == "set (pipeline_writer)"
