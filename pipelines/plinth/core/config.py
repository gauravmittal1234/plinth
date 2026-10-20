"""Pipeline configuration and modes.

One immutable `PipelineConfig`, read once from the environment (`PipelineConfig.from_env`).
Modes are build-time switches, not feature flags (BUILD_PLAN §10):

- `PLINTH_FETCH_MODE=fixtures` (the default): saved files only, frozen clock, no network.
- `PLINTH_FETCH_MODE=live`: real HTTP, which `plinth.core.gate.LiveGate` still refuses unless
  the `harera_live_fetch` flag is on *and* `HARERA_LIVE_FETCH_APPROVED=yes` (BUILD_PLAN §1
  rule 8), outside CI and outside tests.

Environment variables (names only; values never live in the repo):

| Name | Meaning |
|---|---|
| `PLINTH_FETCH_MODE` | `fixtures` (default) or `live` |
| `HARERA_LIVE_FETCH_APPROVED` | `yes` only after the legal memo; the founder sets it |
| `PIPELINE_DB_URL` | connection string for the `pipeline_writer` role (never the secret key) |
| `PLINTH_FETCH_CONTACT` | contact email sent in the live User-Agent (live mode only) |
| `PLINTH_SNAPSHOT_DIR` | local snapshot store (default `~/.cache/plinth/snapshots`) |
| `PLINTH_FIXED_NOW` | override of the frozen clock, fixture mode only |
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from pathlib import Path

from .clock import FROZEN_NOW, Clock, FrozenClock, SystemClock, parse_instant

ENV_FETCH_MODE = "PLINTH_FETCH_MODE"
ENV_LIVE_APPROVED = "HARERA_LIVE_FETCH_APPROVED"
ENV_DB_URL = "PIPELINE_DB_URL"
ENV_CONTACT = "PLINTH_FETCH_CONTACT"
ENV_SNAPSHOT_DIR = "PLINTH_SNAPSHOT_DIR"
ENV_FIXED_NOW = "PLINTH_FIXED_NOW"

#: The only value of HARERA_LIVE_FETCH_APPROVED that counts as approval.
APPROVED = "yes"

#: Politeness floor for live fetching: one request per 3-5 s per host (platform_architecture §4.2).
REQUEST_INTERVAL_S: tuple[float, float] = (3.0, 5.0)


class ConfigError(ValueError):
    """The environment describes an impossible or unsafe configuration."""


class FetchMode(StrEnum):
    FIXTURES = "fixtures"
    LIVE = "live"


def _default_snapshot_dir(env: Mapping[str, str]) -> Path:
    cache = env.get("XDG_CACHE_HOME") or str(Path.home() / ".cache")
    return Path(cache) / "plinth" / "snapshots"


def _truthy(value: str | None) -> bool:
    return value is not None and value.strip().lower() not in ("", "0", "false", "no", "off")


@dataclass(frozen=True)
class PipelineConfig:
    """Everything a pipeline run needs to know about its environment."""

    mode: FetchMode = FetchMode.FIXTURES
    db_url: str | None = field(default=None, repr=False)
    snapshot_dir: Path = field(default_factory=lambda: _default_snapshot_dir(os.environ))
    fixed_now: datetime | None = None
    live_approved: bool = False
    contact: str | None = None
    request_interval: tuple[float, float] = REQUEST_INTERVAL_S
    #: Set when the process runs in CI (`CI` is truthy). Live fetching never runs there.
    ci: bool = False
    #: Set when the process runs under pytest. Tests use saved fixtures only.
    under_pytest: bool = False

    def __post_init__(self) -> None:
        if self.fixed_now is not None and self.mode is FetchMode.LIVE:
            raise ConfigError(
                f"{ENV_FIXED_NOW} is for fixture mode only; live mode uses the real clock"
            )
        low, high = self.request_interval
        if not REQUEST_INTERVAL_S[0] <= low <= high:
            raise ConfigError(
                f"request_interval {self.request_interval} is below the politeness floor "
                f"of {REQUEST_INTERVAL_S[0]:g} s per request per host"
            )

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> PipelineConfig:
        e: Mapping[str, str] = os.environ if env is None else env
        raw_mode = (e.get(ENV_FETCH_MODE) or FetchMode.FIXTURES.value).strip().lower()
        try:
            mode = FetchMode(raw_mode)
        except ValueError:
            raise ConfigError(
                f"{ENV_FETCH_MODE}={raw_mode!r}: expected 'fixtures' or 'live'"
            ) from None
        fixed = e.get(ENV_FIXED_NOW) or None
        return cls(
            mode=mode,
            db_url=e.get(ENV_DB_URL) or None,
            snapshot_dir=Path(e[ENV_SNAPSHOT_DIR])
            if e.get(ENV_SNAPSHOT_DIR)
            else _default_snapshot_dir(e),
            fixed_now=parse_instant(fixed) if fixed else None,
            # Exactly "yes": "YES ", "true" or "1" are not an approval.
            live_approved=e.get(ENV_LIVE_APPROVED) == APPROVED,
            contact=(e.get(ENV_CONTACT) or "").strip() or None,
            ci=_truthy(e.get("CI")),
            under_pytest="PYTEST_CURRENT_TEST" in e,
        )

    def clock(self) -> Clock:
        """Frozen in fixture mode (18 Oct 2026 12:00 IST unless PLINTH_FIXED_NOW); real in live."""
        if self.mode is FetchMode.FIXTURES:
            return FrozenClock(self.fixed_now or FROZEN_NOW)
        return SystemClock()

    def describe(self) -> dict[str, object]:
        """A printable summary with no secret in it (the DB URL is reported as set or unset)."""
        return {
            "mode": self.mode.value,
            "clock": "frozen " + (self.fixed_now or FROZEN_NOW).isoformat()
            if self.mode is FetchMode.FIXTURES
            else "system",
            "db": "set (pipeline_writer)" if self.db_url else "unset (local store only)",
            "snapshot_dir": str(self.snapshot_dir),
            "live_approved": self.live_approved,
            "contact": "set" if self.contact else "unset",
            "request_interval_s": list(self.request_interval),
            "ci": self.ci,
        }
