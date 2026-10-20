"""Reading runtime feature flags (ops.feature_flags) from the pipelines.

Flags are operator switches stored in the database and audited there (BUILD_PLAN §10). The
pipelines only read them, and every reader fails closed: a flag that cannot be read is off.
There is deliberately no way to turn a flag on from the command line or the environment,
so `harera_live_fetch` stays a database decision and `HARERA_LIVE_FETCH_APPROVED` stays the
founder's: two separate keys (BUILD_PLAN §1 rule 8).
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Protocol

from plinth_contracts import FLAG_KEYS

from .db import Connection

log = logging.getLogger(__name__)

HARERA_LIVE_FETCH = "harera_live_fetch"


@dataclass(frozen=True)
class FlagRead:
    key: str
    enabled: bool
    source: str
    note: str | None = None


class FlagSource(Protocol):
    def read(self, key: str) -> FlagRead: ...


def _known(key: str) -> str:
    if key not in FLAG_KEYS:
        raise KeyError(f"unknown flag {key!r} (packages/contracts/catalogues/flags.json)")
    return key


class NoFlags:
    """No database: every flag is off."""

    def read(self, key: str) -> FlagRead:
        return FlagRead(_known(key), False, "none", "no database connection: flags read as off")


@dataclass(frozen=True)
class StaticFlags:
    """Fixed values, for tests and programmatic callers. Unlisted flags are off."""

    values: Mapping[str, bool]

    def read(self, key: str) -> FlagRead:
        return FlagRead(_known(key), bool(self.values.get(key, False)), "static")


class DbFlags:
    """`ops.flag(key)` as the pipeline_writer role.

    T04 gives pipeline_writer no privilege on ops.feature_flags, so until a migration grants a
    flag reader (see the T10 PR handoff), this returns off with a note: fail closed.
    """

    def __init__(self, conn: Connection) -> None:
        self._conn = conn

    def read(self, key: str) -> FlagRead:
        _known(key)
        try:
            row = self._conn.execute("select ops.flag(%s)", (key,)).fetchone()
        except Exception as exc:  # any database error means "not readable", which means off
            log.warning("flag %s unreadable, treated as off: %s", key, exc)
            self._rollback()
            return FlagRead(key, False, "database", f"unreadable ({type(exc).__name__}): off")
        enabled = bool(row is not None and row[0] is True)
        return FlagRead(key, enabled, "database")

    def _rollback(self) -> None:
        rollback = getattr(self._conn, "rollback", None)
        if callable(rollback):
            rollback()
