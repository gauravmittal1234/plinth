"""Database access as the `pipeline_writer` role (BUILD_PLAN §5.4, §12.5).

The pipelines never use the Supabase secret key. They log in as `pipeline_writer`, which T04
limits to reading the public record and inserting evidence (snapshots, facts) and draft score
runs: it cannot publish, delete, or touch ws, app, comms or pii (DATA_MODEL §12 inv. 6).
`connect()` checks the role after login and refuses any other.

Tests never open a connection: they use `plinth.core.store.MemoryStore` or a fake that
satisfies the `Connection` protocol below.
"""

from __future__ import annotations

from contextlib import AbstractContextManager
from typing import Any, Protocol

PIPELINE_ROLE = "pipeline_writer"


class WrongRole(PermissionError):
    """The connection is not the pipeline_writer role."""


class Cursor(Protocol):
    def fetchone(self) -> tuple[Any, ...] | None: ...

    def fetchall(self) -> list[tuple[Any, ...]]: ...

    @property
    def rowcount(self) -> int: ...


class Connection(Protocol):
    """The slice of `psycopg.Connection` the pipelines use (tuple rows)."""

    def execute(self, query: Any, params: Any = None) -> Cursor: ...

    def transaction(self) -> AbstractContextManager[Any]: ...

    def close(self) -> None: ...


def connect(db_url: str, *, application_name: str = "plinth-pipe") -> Connection:
    """Open a psycopg connection and verify it runs as pipeline_writer."""
    import psycopg  # imported lazily: nothing below runs in tests

    conn = psycopg.connect(db_url, application_name=application_name, autocommit=True)
    try:
        check_role(conn)
    except BaseException:
        conn.close()
        raise
    return conn


def check_role(conn: Connection) -> None:
    row = conn.execute("select current_user").fetchone()
    role = row[0] if row else None
    if role != PIPELINE_ROLE:
        raise WrongRole(
            f"pipelines connect as {PIPELINE_ROLE!r}, not {role!r}: "
            "set PIPELINE_DB_URL to the pipeline_writer login (never the secret key)"
        )
