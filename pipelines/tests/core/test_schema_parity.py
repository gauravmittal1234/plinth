"""The SQL the pipelines send matches T04's schema and pipeline_writer's grants.

No database: this reads the migration files. If a later migration renames a column the
pipelines write, or narrows pipeline_writer's grants, this test fails before CI's Postgres job.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from plinth.core import store
from plinth.core.jobs import JOB_RUN_COLUMNS, SQL_INSERT_JOB_RUN

REPO = Path(__file__).resolve().parents[3]
MIGRATIONS = REPO / "supabase" / "migrations"
DATA_MODEL = REPO / "docs" / "engineering" / "DATA_MODEL.md"
FLAG_SQL = "select ops.flag(%s)"


def all_migrations() -> str:
    files = sorted(MIGRATIONS.glob("*.sql"))
    assert files, "no migrations found"
    return "\n".join(f.read_text(encoding="utf-8") for f in files)


def table_columns(sql: str, table: str) -> set[str]:
    m = re.search(rf"create table {re.escape(table)} \((.*?)\n\);", sql, re.S)
    assert m, f"{table} not created in supabase/migrations"
    cols: set[str] = set()
    for line in m.group(1).splitlines():
        word = line.strip().split(" ", 1)[0]
        if word and word not in ("unique", "check", "primary", "constraint", "foreign", "--"):
            cols.add(word)
    return cols


@pytest.fixture(scope="module")
def migrations() -> str:
    return all_migrations()


def test_snapshot_columns_exist(migrations: str) -> None:
    cols = table_columns(migrations, "core.snapshots")
    assert set(store.SNAPSHOT_INSERT_COLUMNS) <= cols, set(store.SNAPSHOT_INSERT_COLUMNS) - cols


def test_fact_columns_exist(migrations: str) -> None:
    cols = table_columns(migrations, "core.facts")
    assert set(store.FACT_INSERT_COLUMNS) <= cols, set(store.FACT_INSERT_COLUMNS) - cols
    assert set(store.FACT_UPDATE_COLUMNS) <= cols


def test_pipeline_writer_grants_cover_what_we_send(migrations: str) -> None:
    flat = " ".join(migrations.split())
    assert "grant select, insert on core.snapshots to pipeline_writer;" in flat
    assert "grant select, insert on core.facts to pipeline_writer;" in flat
    granted = re.search(r"grant update \(([^)]*)\) on core\.facts to pipeline_writer;", flat)
    assert granted, "pipeline_writer's supersede grant on core.facts is gone"
    assert {c.strip() for c in granted.group(1).split(",")} == set(store.FACT_UPDATE_COLUMNS)
    assert "grant select on core.sources to pipeline_writer;" in flat


def test_snapshot_uniqueness_is_sha256_and_url(migrations: str) -> None:
    m = re.search(r"create table core\.snapshots \((.*?)\n\);", migrations, re.S)
    assert m and "unique (sha256, url)" in m.group(1)
    assert "on conflict (sha256, url) do nothing" in store.SQL_INSERT_SNAPSHOT


RELATION = re.compile(r"\b(core|ops|ws|app|pii|comms|auth|public|storage)\.([a-z_]+)")
ALLOWED = {
    ("core", "sources"),
    ("core", "snapshots"),
    ("core", "facts"),
    ("ops", "job_runs"),
    ("ops", "flag"),
}


@pytest.mark.parametrize("sql", [*store.ALL_SQL, SQL_INSERT_JOB_RUN, FLAG_SQL])
def test_statements_stay_inside_pipeline_writer_limits(sql: str) -> None:
    lowered = sql.lower()
    touched = set(RELATION.findall(lowered))
    assert touched <= ALLOWED, touched - ALLOWED
    assert "delete" not in lowered and "truncate" not in lowered
    assert "score_runs" not in lowered and "published" not in lowered  # never publish
    if lowered.startswith("update"):
        assert lowered.startswith("update core.facts set ")
        assigned = re.findall(r"(\w+) = ", lowered.split(" where ")[0])
        assert set(assigned) <= set(store.FACT_UPDATE_COLUMNS)


def test_job_run_columns_match_the_data_model() -> None:
    row = next(
        line
        for line in DATA_MODEL.read_text(encoding="utf-8").splitlines()
        if line.startswith("| `ops.job_runs`")
    )
    key_columns = row.split("|")[3]
    documented = re.findall(r"`([a-z_]+)[^`]*`", key_columns)  # `errors jsonb` -> errors
    assert documented == list(JOB_RUN_COLUMNS)
