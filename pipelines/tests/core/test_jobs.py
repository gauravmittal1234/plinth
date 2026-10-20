"""ops.job_runs logging."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from plinth.core.clock import IST
from plinth.core.config import FetchMode
from plinth.core.jobs import (
    JOB_RUN_COLUMNS,
    MAX_ERRORS,
    JobRun,
    JobSink,
    JsonlJobSink,
    MemoryJobSink,
    PgJobSink,
)
from plinth.core.testing import FakeConnection


class TickClock:
    def __init__(self) -> None:
        self.at = datetime(2026, 10, 18, 12, 0, tzinfo=IST)

    def now(self) -> datetime:
        self.at += timedelta(seconds=30)
        return self.at


def run(sink: JobSink) -> JobRun:
    return JobRun(
        "harera.qpr",
        source_code="harera_qpr",
        mode=FetchMode.FIXTURES,
        clock=TickClock(),
        sink=sink,
    )


def test_a_run_records_counts_and_times() -> None:
    sink = MemoryJobSink()
    with run(sink) as r:
        r.fetched += 4
        r.changed += 2
        r.parsed += 1
    rec = sink.records[0]
    assert (rec.fetched, rec.changed, rec.parsed) == (4, 2, 1)
    assert rec.yield_pct == 50.0
    assert rec.finished_at is not None and rec.finished_at > rec.started_at
    doc = rec.to_json()
    assert doc["mode"] == "fixtures"
    assert set(doc) == set(JOB_RUN_COLUMNS)


def test_heartbeat_run_has_no_yield() -> None:
    sink = MemoryJobSink()
    with run(sink) as r:
        r.fetched += 3
    assert sink.records[0].yield_pct is None


def test_exceptions_are_recorded_then_raised_with_pii_stripped() -> None:
    sink = MemoryJobSink()
    with pytest.raises(ValueError), run(sink):
        raise ValueError("bad row for promoter mobile +91 99000 00318")
    rec = sink.records[0]
    assert rec.finished_at is not None
    err = rec.errors[0]
    assert err["kind"] == "exception"
    assert err["message"] == "ValueError: bad row for promoter mobile [phone removed]"
    assert err["at"].startswith("test_jobs.py:")


def test_errors_are_capped() -> None:
    sink = MemoryJobSink()
    with run(sink) as r:
        for i in range(MAX_ERRORS + 7):
            r.error("parse", f"row {i} unreadable", url="fixture://x", row=i)
    rec = sink.records[0]
    assert len(rec.errors) == MAX_ERRORS
    assert rec.errors[0] == {
        "kind": "parse",
        "message": "row 0 unreadable",
        "url": "fixture://x",
        "row": 0,
    }
    assert rec.to_json()["errors"][-1] == {"kind": "truncated", "dropped": 7}


def test_jsonl_sink_appends_lines(tmp_path: Path) -> None:
    path = tmp_path / "logs" / "job_runs.jsonl"
    sink = JsonlJobSink(path)
    for _ in range(2):
        with run(sink) as r:
            r.fetched += 1
    lines = [json.loads(x) for x in path.read_text().splitlines()]
    assert len(lines) == 2
    assert lines[0]["pipeline"] == "harera.qpr" and lines[0]["fetched"] == 1


def test_pg_sink_inserts_into_ops_job_runs() -> None:
    conn = FakeConnection()
    with run(PgJobSink(conn)) as r:
        r.fetched += 2
        r.changed += 1
        r.parsed += 1
    ((sql, params),) = conn.statements
    assert sql.startswith(
        "insert into ops.job_runs (pipeline, source_code, started_at, finished_at, mode,"
    )
    assert params[0:2] == ("harera.qpr", "harera_qpr")
    assert params[4:9] == ("fixtures", 2, 1, 1, 100.0)
    assert json.loads(params[9]) == []
    assert conn.transactions == 1


def test_pg_sink_falls_back_while_the_table_is_missing() -> None:
    conn = FakeConnection()
    conn.fail("insert into ops.job_runs", RuntimeError('relation "ops.job_runs" does not exist'))
    fallback = MemoryJobSink()
    with run(PgJobSink(conn, fallback=fallback)) as r:
        r.fetched += 1
    assert len(fallback.records) == 1
    conn2 = FakeConnection()
    conn2.fail("insert into ops.job_runs", RuntimeError("permission denied"))
    with pytest.raises(RuntimeError, match="permission denied"), run(PgJobSink(conn2)):
        pass
