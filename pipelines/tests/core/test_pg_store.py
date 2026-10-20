"""PgStore against a scripted connection: the SQL it sends and how it reads answers.

No database: `FakeConnection` answers by statement prefix and records every statement.
"""

from __future__ import annotations

import json
import uuid
from datetime import date, datetime
from decimal import Decimal

import pytest
from plinth_contracts import Lane

from plinth.core.clock import IST, FrozenClock
from plinth.core.db import WrongRole, check_role
from plinth.core.facts import FactDraft, FactsWriter, WriteKind
from plinth.core.records import FactIdentity, NewSnapshot
from plinth.core.store import (
    SQL_INSERT_FACT,
    SQL_INSERT_SNAPSHOT,
    SQL_SUPERSEDE_FACT,
    PgStore,
    SupersedeConflict,
    UnknownSource,
)
from plinth.core.testing import FakeConnection, FakeCursor

SRC = uuid.UUID(int=10)
SNAP = uuid.UUID(int=11)
REG = str(uuid.UUID(int=12))
AT = datetime(2026, 10, 14, 10, 0, tzinfo=IST)
SHA = "b" * 64


def snapshot_row() -> tuple[object, ...]:
    key = "sha256/bb/" + SHA
    # id, url, method, params, fetched_at, status, sha256 (char(64) may pad), key, type, bytes,
    # parser_version, fixture, created_at
    return (SNAP, "fixture://q", "POST", {"form": {"q": "1"}}, AT, 200, SHA + "  ", key,
            "text/html", Decimal(10), "harera@1", True, AT)  # fmt: skip


def new_snapshot() -> NewSnapshot:
    return NewSnapshot(
        source_code="harera_qpr",
        url="fixture://q",
        method="POST",
        params={"form": {"q": "1"}},
        fetched_at=AT,
        http_status=200,
        sha256=SHA,
        storage_key="sha256/bb/" + SHA,
        content_type="text/html",
        bytes=10,
        parser_version="harera@1",
        fixture=True,
    )


def fact_row(
    id_: uuid.UUID, value: object, superseded_by: uuid.UUID | None = None
) -> tuple[object, ...]:
    return (id_, "registration", uuid.UUID(REG), "registration.dates", value, date(2026, 10, 14),
            date(2026, 10, 14), None, AT, None, "p. 1", "text", "parser", "harera@1", None,
            Decimal("0.950"), "records_show", superseded_by, [])  # fmt: skip


def test_check_role_accepts_only_pipeline_writer() -> None:
    conn = FakeConnection()
    conn.script("select current_user", [("pipeline_writer",)])
    check_role(conn)
    for role in ("postgres", "service_role", "authenticated"):
        bad = FakeConnection()
        bad.script("select current_user", [(role,)])
        with pytest.raises(WrongRole, match="pipeline_writer"):
            check_role(bad)


def test_insert_snapshot_new_row() -> None:
    conn = FakeConnection()
    conn.script("select id from core.sources", [(SRC,)])
    conn.script("insert into core.snapshots", [snapshot_row()])
    record, created = PgStore(conn).insert_snapshot(new_snapshot())
    assert created
    assert record.id == str(SNAP) and record.sha256 == SHA and record.bytes == 10
    sql, params = conn.statements[-1]
    assert sql == " ".join(SQL_INSERT_SNAPSHOT.split())
    assert params[0] == str(SRC)
    assert json.loads(params[3]) == {"form": {"q": "1"}}


def test_insert_snapshot_conflict_returns_the_existing_row() -> None:
    conn = FakeConnection()
    conn.script("select id from core.sources", [(SRC,)])
    conn.script("insert into core.snapshots", [])  # on conflict do nothing
    conn.script("select s.id", [snapshot_row()])
    store = PgStore(conn)
    record, created = store.insert_snapshot(new_snapshot())
    assert not created and record.id == str(SNAP)
    assert conn.statements[-1][1] == (SHA, "fixture://q")
    store.insert_snapshot(new_snapshot())
    assert (
        sum(s.startswith("select id from core.sources") for s, _ in conn.statements) == 1
    )  # cached


def test_unknown_source() -> None:
    with pytest.raises(UnknownSource):
        PgStore(FakeConnection()).source_id("nope")


def test_latest_snapshot_reads_by_source_and_url() -> None:
    conn = FakeConnection()
    conn.script("select s.id", [snapshot_row()])
    rec = PgStore(conn).latest_snapshot("harera_qpr", "fixture://q")
    assert rec is not None and rec.source_code == "harera_qpr"
    sql, params = conn.statements[0]
    assert "order by s.fetched_at desc" in sql and params == ("harera_qpr", "fixture://q")


def test_current_facts_filters_on_key_fields() -> None:
    conn = FakeConnection()
    PgStore(conn).current_facts(
        FactIdentity("registration", REG, "qpr.progress", (("quarter", '"2026-Q2"'),))
    )
    sql, params = conn.statements[0]
    assert "superseded_by is null and (value -> %s) = %s::jsonb order by" in sql
    assert params == ("registration", REG, "qpr.progress", "quarter", '"2026-Q2"')


def test_writer_over_pg_supersedes_in_one_transaction() -> None:
    old, new = uuid.UUID(int=1), uuid.UUID(int=2)
    conn = FakeConnection()
    conn.script("select id, subject_type", [fact_row(old, {"original_completion": "2027-12"})])
    conn.script_fn(
        "insert into core.facts",
        lambda params: FakeCursor([fact_row(new, json.loads(params[3]))], 1),
    )
    conn.script("update core.facts", [], rowcount=1)
    writer = FactsWriter(PgStore(conn), FrozenClock())
    w = writer.write(
        FactDraft(
            "registration",
            REG,
            "registration.dates",
            {"original_completion": "2028-06"},
            as_of=date(2026, 10, 16),
        )
    )
    assert w.kind is WriteKind.SUPERSEDED
    assert w.fact.id == str(new) and w.fact.confidence == 0.95 and w.fact.lane is Lane.records_show
    assert conn.transactions == 1
    insert_sql, insert_params = conn.statements[1]
    assert insert_sql == " ".join(SQL_INSERT_FACT.split())
    assert json.loads(insert_params[3]) == {"original_completion": "2028-06"}
    assert insert_params[-1] == "records_show"
    update_sql, update_params = conn.statements[2]
    assert update_sql == " ".join(SQL_SUPERSEDE_FACT.split())
    assert update_params == (str(new), date(2026, 10, 16), str(old))


def test_concurrent_supersede_is_a_conflict() -> None:
    conn = FakeConnection()
    conn.script("update core.facts", [], rowcount=0)
    with pytest.raises(SupersedeConflict):
        PgStore(conn).supersede_fact("a", "b", None)
