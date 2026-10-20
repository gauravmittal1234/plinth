"""`ops.job_runs` logging (DATA_MODEL §10; BUILD_PLAN §11 "Pipelines").

One row per pipeline run: what was fetched, how much changed, how much parsed, and the errors.
`ops.source_freshness` and the parse-yield alert (> 20% move) read these rows, which is how a
silent portal change gets noticed.

    with JobRun("harera.qpr", source_code="harera_qpr", mode=mode, clock=clock, sink=sink) as run:
        put = capture(request, fetcher=fetcher, snapshots=snapshots, run=run)
        if put.changed:
            ...parse...
            run.parsed += 1

`yield_pct` is parsed / changed x 100: the share of changed snapshots that parsed. It is null
when nothing changed (a heartbeat run).

Sinks: `PgJobSink` (insert as pipeline_writer), `JsonlJobSink` (a local file), `MemoryJobSink`
(tests). Until a migration creates ops.job_runs (see the T10 PR handoff), `PgJobSink` falls back
to its fallback sink with a warning instead of failing the run.
"""

from __future__ import annotations

import json
import logging
import traceback
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from types import TracebackType
from typing import Any, Protocol

from .clock import Clock
from .config import FetchMode
from .db import Connection
from .pii import strip_pii

log = logging.getLogger(__name__)

MAX_ERRORS = 100

JOB_RUN_COLUMNS: tuple[str, ...] = (
    "pipeline",
    "source_code",
    "started_at",
    "finished_at",
    "mode",
    "fetched",
    "changed",
    "parsed",
    "yield_pct",
    "errors",
)
SQL_INSERT_JOB_RUN = (
    f"insert into ops.job_runs ({', '.join(JOB_RUN_COLUMNS)})"
    " values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)"
)


@dataclass
class JobRunRecord:
    pipeline: str
    source_code: str | None
    mode: FetchMode
    started_at: datetime
    finished_at: datetime | None = None
    fetched: int = 0
    changed: int = 0
    parsed: int = 0
    errors: list[dict[str, Any]] = field(default_factory=list)
    errors_dropped: int = 0

    @property
    def yield_pct(self) -> float | None:
        if self.changed == 0:
            return None
        return round(100.0 * self.parsed / self.changed, 2)

    def to_json(self) -> dict[str, Any]:
        errors = list(self.errors)
        if self.errors_dropped:
            errors.append({"kind": "truncated", "dropped": self.errors_dropped})
        return {
            "pipeline": self.pipeline,
            "source_code": self.source_code,
            "started_at": self.started_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "mode": self.mode.value,
            "fetched": self.fetched,
            "changed": self.changed,
            "parsed": self.parsed,
            "yield_pct": self.yield_pct,
            "errors": errors,
        }


class JobSink(Protocol):
    def write(self, record: JobRunRecord) -> None: ...


class MemoryJobSink:
    def __init__(self) -> None:
        self.records: list[JobRunRecord] = []

    def write(self, record: JobRunRecord) -> None:
        self.records.append(record)


class JsonlJobSink:
    def __init__(self, path: Path) -> None:
        self.path = path

    def write(self, record: JobRunRecord) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record.to_json(), ensure_ascii=False, sort_keys=True) + "\n")


class PgJobSink:
    """Insert into ops.job_runs as pipeline_writer; fall back when the table is not there yet."""

    def __init__(self, conn: Connection, fallback: JobSink | None = None) -> None:
        self._conn = conn
        self._fallback = fallback

    def write(self, record: JobRunRecord) -> None:
        doc = record.to_json()
        params = (
            record.pipeline,
            record.source_code,
            record.started_at,
            record.finished_at,
            record.mode.value,
            record.fetched,
            record.changed,
            record.parsed,
            record.yield_pct,
            json.dumps(doc["errors"], ensure_ascii=False),
        )
        try:
            with self._conn.transaction():
                self._conn.execute(SQL_INSERT_JOB_RUN, params)
        except Exception as exc:
            if self._fallback is None:
                raise
            log.warning("ops.job_runs not writable (%s); logged to the fallback sink", exc)
            self._fallback.write(record)


class JobRun:
    """Context manager around one pipeline run. Exceptions are recorded, then re-raised."""

    def __init__(
        self,
        pipeline: str,
        *,
        source_code: str | None,
        mode: FetchMode,
        clock: Clock,
        sink: JobSink,
    ) -> None:
        self._clock = clock
        self._sink = sink
        self.record = JobRunRecord(
            pipeline=pipeline, source_code=source_code, mode=mode, started_at=clock.now()
        )

    # Counters, for brevity at call sites.
    @property
    def fetched(self) -> int:
        return self.record.fetched

    @fetched.setter
    def fetched(self, value: int) -> None:
        self.record.fetched = value

    @property
    def changed(self) -> int:
        return self.record.changed

    @changed.setter
    def changed(self, value: int) -> None:
        self.record.changed = value

    @property
    def parsed(self) -> int:
        return self.record.parsed

    @parsed.setter
    def parsed(self, value: int) -> None:
        self.record.parsed = value

    def error(self, kind: str, message: str, **context: str | int | None) -> None:
        """Record an error. The message goes through the PII stripper."""
        if len(self.record.errors) >= MAX_ERRORS:
            self.record.errors_dropped += 1
            return
        entry: dict[str, Any] = {"kind": kind, "message": strip_pii(message).text}
        entry.update({k: v for k, v in context.items() if v is not None})
        self.record.errors.append(entry)

    def __enter__(self) -> JobRun:
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if exc is not None:
            where = traceback.extract_tb(tb)[-1] if tb is not None else None
            self.error(
                "exception",
                f"{type(exc).__name__}: {exc}",
                at=f"{Path(where.filename).name}:{where.lineno}" if where else None,
            )
        self.record.finished_at = self._clock.now()
        self._sink.write(self.record)
