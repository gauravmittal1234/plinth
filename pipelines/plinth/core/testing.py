"""Test doubles for pipeline code: a fake monotonic clock and a scripted database connection.

They let parsers, writers and fetchers be tested with no sleeping, no database and no network
(WORK_BREAKDOWN T10: "no database connection in tests"). Nothing here can fetch or connect.

    t = FakeTime()
    limiter = HostRateLimiter(monotonic=t.monotonic, sleep=t.sleep)

    conn = FakeConnection()
    conn.script("select current_user", [("pipeline_writer",)])
    check_role(conn)
    assert conn.statements[0][0] == "select current_user"
"""

from __future__ import annotations

from collections.abc import Callable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Any

Row = tuple[Any, ...]


class FakeTime:
    """A monotonic clock that only moves when slept on (or advanced). Records every sleep."""

    def __init__(self, start: float = 1000.0) -> None:
        self.now = start
        self.sleeps: list[float] = []

    def monotonic(self) -> float:
        return self.now

    def sleep(self, seconds: float) -> None:
        self.sleeps.append(seconds)
        self.now += max(0.0, seconds)

    def advance(self, seconds: float) -> None:
        self.now += seconds


@dataclass
class FakeCursor:
    rows: list[Row] = field(default_factory=list)
    rowcount: int = 0

    def fetchone(self) -> Row | None:
        return self.rows[0] if self.rows else None

    def fetchall(self) -> list[Row]:
        return list(self.rows)


@dataclass
class _Script:
    prefix: str
    respond: Callable[[Any], FakeCursor]


class FakeConnection:
    """Satisfies plinth.core.db.Connection. Answers statements by prefix, records them all.

    `script(prefix, rows)` answers every statement that starts with `prefix` (whitespace
    normalised) with those rows; `script_fn(prefix, fn)` computes the cursor from the params;
    `fail(prefix, exc)` raises. Unscripted statements return an empty cursor.
    """

    def __init__(self) -> None:
        self.statements: list[tuple[str, Any]] = []
        self.transactions = 0
        self.rollbacks = 0
        self.closed = False
        self._scripts: list[_Script] = []

    @staticmethod
    def _norm(query: str) -> str:
        return " ".join(query.split())

    def script(self, prefix: str, rows: list[Row], rowcount: int | None = None) -> None:
        cursor = FakeCursor(list(rows), len(rows) if rowcount is None else rowcount)
        self._scripts.append(_Script(self._norm(prefix), lambda _params: cursor))

    def script_fn(self, prefix: str, fn: Callable[[Any], FakeCursor]) -> None:
        self._scripts.append(_Script(self._norm(prefix), fn))

    def fail(self, prefix: str, exc: BaseException) -> None:
        def raise_(_params: Any) -> FakeCursor:
            raise exc

        self._scripts.append(_Script(self._norm(prefix), raise_))

    def execute(self, query: Any, params: Any = None) -> FakeCursor:
        text = self._norm(str(query))
        self.statements.append((text, params))
        for s in reversed(self._scripts):
            if text.startswith(s.prefix):
                return s.respond(params)
        return FakeCursor()

    @contextmanager
    def transaction(self) -> Iterator[None]:
        self.transactions += 1
        yield

    def rollback(self) -> None:
        self.rollbacks += 1

    def close(self) -> None:
        self.closed = True
