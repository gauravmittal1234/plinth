"""Where evidence rows go: Postgres as `pipeline_writer`, or an in-memory / local-file mirror.

`EvidenceStore` is the narrow interface the snapshot store and the facts writer use. It has no
update or delete for content, because T04's triggers forbid them (DATA_MODEL §12 inv. 3):

- core.snapshots: insert only; unique (sha256, url), so re-storing the same bytes for the same
  URL returns the existing row;
- core.facts: insert, plus the one-time supersede link (`superseded_by`, and `valid_to` when it
  is still open). pipeline_writer's column grant allows nothing else.

`PgStore` issues exactly that SQL. `MemoryStore` enforces the same rules in Python, so tests
run with no database, and `LocalIndexStore` persists a MemoryStore to one JSON file for local,
offline runs of the CLI.
"""

from __future__ import annotations

import copy
import json
import os
import uuid
from collections.abc import Callable, Iterable, Iterator
from contextlib import AbstractContextManager, contextmanager
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any, Protocol

from plinth_contracts import Lane

from .db import Connection
from .records import (
    FactIdentity,
    FactRecord,
    NewFact,
    NewSnapshot,
    SnapshotRecord,
    canonical_json,
)

#: core.sources codes (DATA_MODEL §2, plus harera_extension from the canonical evidence).
SOURCE_CODES: tuple[str, ...] = (
    "harera_registration",
    "harera_qpr",
    "harera_qpr_register",
    "harera_orders",
    "harera_corrigendum",
    "harera_extension",
    "dtcp_oc",
    "ibbi",
    "news",
    "developer_workspace",
)

_SOURCE_NS = uuid.UUID("6f0f3f6c-2d55-5a8e-9d0e-1f4c6c1b7a10")


class UnknownSource(LookupError):
    """No core.sources row has this code."""


class ImmutableRow(RuntimeError):
    """The change would rewrite history (T04 raises PT409 for the same thing)."""


class SupersedeConflict(RuntimeError):
    """The fact was superseded already, or its identity has more than one current version."""


class EvidenceStore(Protocol):
    def transaction(self) -> AbstractContextManager[Any]: ...

    def source_id(self, code: str) -> str: ...

    def latest_snapshot(self, source_code: str, url: str) -> SnapshotRecord | None: ...

    def insert_snapshot(self, row: NewSnapshot) -> tuple[SnapshotRecord, bool]: ...

    def current_facts(self, identity: FactIdentity) -> list[FactRecord]: ...

    def insert_fact(self, row: NewFact) -> FactRecord: ...

    def supersede_fact(self, old_id: str, new_id: str, valid_to: date | None) -> None: ...


def _matches(fact: FactRecord, identity: FactIdentity) -> bool:
    if (fact.subject_type, fact.subject_id, fact.attribute) != (
        identity.subject_type,
        identity.subject_id,
        identity.attribute,
    ):
        return False
    value = fact.value
    for name, encoded in identity.key:
        if not isinstance(value, dict) or name not in value:
            return False
        if canonical_json(value[name]) != encoded:
            return False
    return True


# --------------------------------------------------------------------------------------------
# In memory (tests) and a local JSON file (offline CLI runs)
# --------------------------------------------------------------------------------------------


class MemoryStore:
    """The evidence tables in memory, with T04's constraints and pipeline_writer's limits."""

    def __init__(
        self,
        sources: Iterable[str] = SOURCE_CODES,
        *,
        id_factory: Callable[[], str] | None = None,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._sources = {code: str(uuid.uuid5(_SOURCE_NS, code)) for code in sources}
        self._snapshots: dict[str, SnapshotRecord] = {}
        self._facts: dict[str, FactRecord] = {}
        self._new_id = id_factory or (lambda: str(uuid.uuid4()))
        self._created_at = clock
        self._depth = 0

    # -- transactions -------------------------------------------------------------------

    @contextmanager
    def transaction(self) -> Iterator[None]:
        saved = (dict(self._snapshots), dict(self._facts)) if self._depth == 0 else None
        self._depth += 1
        try:
            yield
        except BaseException:
            if saved is not None:
                self._snapshots, self._facts = saved
            raise
        finally:
            self._depth -= 1
        if self._depth == 0:
            self._committed()

    def _committed(self) -> None:
        """Hook: called after an outermost transaction commits."""

    # -- reads --------------------------------------------------------------------------

    def source_id(self, code: str) -> str:
        try:
            return self._sources[code]
        except KeyError:
            raise UnknownSource(f"no core.sources row with code {code!r}") from None

    def snapshots(self) -> list[SnapshotRecord]:
        return list(self._snapshots.values())

    def facts(self) -> list[FactRecord]:
        return list(self._facts.values())

    def fact(self, fact_id: str) -> FactRecord:
        return self._facts[fact_id]

    def latest_snapshot(self, source_code: str, url: str) -> SnapshotRecord | None:
        rows = [
            s for s in self._snapshots.values() if s.source_code == source_code and s.url == url
        ]
        return max(rows, key=lambda s: s.fetched_at, default=None)

    def current_facts(self, identity: FactIdentity) -> list[FactRecord]:
        return [
            f for f in self._facts.values() if f.superseded_by is None and _matches(f, identity)
        ]

    # -- writes -------------------------------------------------------------------------

    def insert_snapshot(self, row: NewSnapshot) -> tuple[SnapshotRecord, bool]:
        self.source_id(row.source_code)
        for existing in self._snapshots.values():
            if existing.sha256 == row.sha256 and existing.url == row.url:
                return existing, False  # on conflict (sha256, url) do nothing
        with self.transaction():
            record = SnapshotRecord(
                **vars(row),
                id=self._new_id(),
                created_at=self._created_at() if self._created_at else None,
            )
            self._snapshots[record.id] = record
        return record, True

    def insert_fact(self, row: NewFact) -> FactRecord:
        if row.snapshot_id is not None and row.snapshot_id not in self._snapshots:
            raise LookupError(f"snapshot {row.snapshot_id} does not exist (foreign key)")
        with self.transaction():
            record = FactRecord(**vars(row), id=self._new_id())
            self._facts[record.id] = record
        return record

    def supersede_fact(self, old_id: str, new_id: str, valid_to: date | None) -> None:
        """ops.facts_guard: once, to another fact, closing valid_to only if it is open."""
        old = self._facts.get(old_id)
        if old is None or new_id not in self._facts:
            raise LookupError(f"supersede {old_id} -> {new_id}: unknown fact")
        if new_id == old_id:
            raise ImmutableRow("a fact cannot supersede itself")
        if old.superseded_by is not None:
            raise SupersedeConflict(f"fact {old_id} is already superseded by {old.superseded_by}")
        closing = old.valid_to if old.valid_to is not None else valid_to
        if closing is not None and old.valid_from is not None and closing < old.valid_from:
            raise ValueError("valid_to would fall before valid_from")
        with self.transaction():
            self._facts[old_id] = copy.replace(old, superseded_by=new_id, valid_to=closing)

    # -- persistence (LocalIndexStore) --------------------------------------------------

    def dump(self) -> dict[str, Any]:
        return {
            "schema": "plinth.local_evidence/1",
            "snapshots": [_to_json(vars(s)) for s in self._snapshots.values()],
            "facts": [_to_json(vars(f)) for f in self._facts.values()],
        }

    def load(self, doc: dict[str, Any]) -> None:
        if doc.get("schema") != "plinth.local_evidence/1":
            raise ValueError("not a plinth.local_evidence/1 document")
        self._snapshots = {}
        for raw in doc["snapshots"]:
            s = SnapshotRecord(
                **{
                    **raw,
                    "fetched_at": datetime.fromisoformat(raw["fetched_at"]),
                    "created_at": datetime.fromisoformat(raw["created_at"])
                    if raw.get("created_at")
                    else None,
                }
            )
            self._snapshots[s.id] = s
        self._facts = {}
        for raw in doc["facts"]:
            f = FactRecord(
                **{
                    **raw,
                    "as_of": _date(raw.get("as_of")),
                    "valid_from": _date(raw.get("valid_from")),
                    "valid_to": _date(raw.get("valid_to")),
                    "learned_at": datetime.fromisoformat(raw["learned_at"]),
                    "lane": Lane(raw["lane"]),
                }
            )
            self._facts[f.id] = f


def _date(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def _to_json(row: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in row.items():
        if isinstance(value, datetime | date):
            out[key] = value.isoformat()
        elif isinstance(value, Lane):
            out[key] = value.value
        else:
            out[key] = value
    return out


class LocalIndexStore(MemoryStore):
    """A MemoryStore saved to `<dir>/index.json` after every committed write."""

    def __init__(self, path: Path, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.path = path
        if path.is_file():
            self.load(json.loads(path.read_text(encoding="utf-8")))

    def _committed(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.dump(), indent=1, ensure_ascii=False), encoding="utf-8")
        os.replace(tmp, self.path)


# --------------------------------------------------------------------------------------------
# Postgres, as pipeline_writer
# --------------------------------------------------------------------------------------------

#: Columns PgStore writes. tests/core/test_schema_parity.py checks them against T04's DDL.
SNAPSHOT_INSERT_COLUMNS: tuple[str, ...] = (
    "source_id",
    "url",
    "method",
    "params",
    "fetched_at",
    "http_status",
    "sha256",
    "storage_key",
    "content_type",
    "bytes",
    "parser_version",
    "fixture",
)
FACT_INSERT_COLUMNS: tuple[str, ...] = (
    "subject_type",
    "subject_id",
    "attribute",
    "value",
    "as_of",
    "valid_from",
    "valid_to",
    "learned_at",
    "snapshot_id",
    "page_ref",
    "extract_text",
    "method",
    "method_version",
    "read_note",
    "confidence",
    "lane",
)
FACT_UPDATE_COLUMNS: tuple[str, ...] = ("superseded_by", "valid_to")

_SNAPSHOT_COLS = (
    "s.id, s.url, s.method, s.params, s.fetched_at, s.http_status, s.sha256, s.storage_key,"
    " s.content_type, s.bytes, s.parser_version, s.fixture, s.created_at"
)
_FACT_COLS = (
    "id, subject_type, subject_id, attribute, value, as_of, valid_from, valid_to, learned_at,"
    " snapshot_id, page_ref, extract_text, method, method_version, read_note, confidence, lane,"
    " superseded_by, corrections"
)

SQL_SOURCE_ID = "select id from core.sources where code = %s"
SQL_LATEST_SNAPSHOT = (
    f"select {_SNAPSHOT_COLS} from core.snapshots s"
    " join core.sources src on src.id = s.source_id"
    " where src.code = %s and s.url = %s"
    " order by s.fetched_at desc, s.created_at desc limit 1"
)
SQL_INSERT_SNAPSHOT = (
    f"insert into core.snapshots as s ({', '.join(SNAPSHOT_INSERT_COLUMNS)})"
    " values (%s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s, %s)"
    f" on conflict (sha256, url) do nothing returning {_SNAPSHOT_COLS}"
)
SQL_SNAPSHOT_BY_HASH = (
    f"select {_SNAPSHOT_COLS} from core.snapshots s where s.sha256 = %s and s.url = %s"
)
SQL_CURRENT_FACTS = (
    f"select {_FACT_COLS} from core.facts"
    " where subject_type = %s and subject_id = %s and attribute = %s and superseded_by is null"
)
SQL_FACT_KEY_FILTER = " and (value -> %s) = %s::jsonb"
SQL_CURRENT_FACTS_ORDER = " order by learned_at, created_at"
SQL_INSERT_FACT = (
    f"insert into core.facts ({', '.join(FACT_INSERT_COLUMNS)})"
    " values (%s, %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
    f" returning {_FACT_COLS}"
)
SQL_SUPERSEDE_FACT = (
    "update core.facts set superseded_by = %s, valid_to = coalesce(valid_to, %s)"
    " where id = %s and superseded_by is null"
)

#: Every statement PgStore can send (the grant check in tests reads this).
ALL_SQL: tuple[str, ...] = (
    SQL_SOURCE_ID,
    SQL_LATEST_SNAPSHOT,
    SQL_INSERT_SNAPSHOT,
    SQL_SNAPSHOT_BY_HASH,
    SQL_CURRENT_FACTS + SQL_FACT_KEY_FILTER + SQL_CURRENT_FACTS_ORDER,
    SQL_INSERT_FACT,
    SQL_SUPERSEDE_FACT,
)


def _s(value: Any) -> str | None:
    return None if value is None else str(value)


class PgStore:
    """EvidenceStore over a pipeline_writer connection (see plinth.core.db.connect)."""

    def __init__(self, conn: Connection) -> None:
        self._conn = conn
        self._source_ids: dict[str, str] = {}

    def transaction(self) -> AbstractContextManager[Any]:
        return self._conn.transaction()

    def source_id(self, code: str) -> str:
        if code not in self._source_ids:
            row = self._conn.execute(SQL_SOURCE_ID, (code,)).fetchone()
            if row is None:
                raise UnknownSource(f"no core.sources row with code {code!r}")
            self._source_ids[code] = str(row[0])
        return self._source_ids[code]

    @staticmethod
    def _snapshot(source_code: str, row: tuple[Any, ...]) -> SnapshotRecord:
        (
            id_,
            url,
            method,
            params,
            fetched_at,
            status,
            sha,
            key,
            ctype,
            size,
            parser,
            fixture,
            created,
        ) = row
        return SnapshotRecord(
            source_code=source_code,
            url=url,
            method=method,
            params=params,
            fetched_at=fetched_at,
            http_status=status,
            sha256=sha.strip(),
            storage_key=key,
            content_type=ctype,
            bytes=int(size or 0),
            parser_version=parser,
            fixture=bool(fixture),
            id=str(id_),
            created_at=created,
        )

    @staticmethod
    def _fact(row: tuple[Any, ...]) -> FactRecord:
        (
            id_,
            subject_type,
            subject_id,
            attribute,
            value,
            as_of,
            valid_from,
            valid_to,
            learned_at,
            snapshot_id,
            page_ref,
            extract_text,
            method,
            method_version,
            read_note,
            confidence,
            lane,
            superseded_by,
            corrections,
        ) = row
        return FactRecord(
            subject_type=subject_type,
            subject_id=str(subject_id),
            attribute=attribute,
            value=value,
            as_of=as_of,
            valid_from=valid_from,
            valid_to=valid_to,
            learned_at=learned_at,
            snapshot_id=_s(snapshot_id),
            page_ref=page_ref,
            extract_text=extract_text,
            method=method,
            method_version=method_version,
            read_note=read_note,
            confidence=float(confidence) if isinstance(confidence, Decimal | float) else None,
            lane=Lane(lane),
            id=str(id_),
            superseded_by=_s(superseded_by),
            corrections=list(corrections or []),
        )

    def latest_snapshot(self, source_code: str, url: str) -> SnapshotRecord | None:
        row = self._conn.execute(SQL_LATEST_SNAPSHOT, (source_code, url)).fetchone()
        return None if row is None else self._snapshot(source_code, row)

    def insert_snapshot(self, row: NewSnapshot) -> tuple[SnapshotRecord, bool]:
        params = (
            self.source_id(row.source_code),
            row.url,
            row.method,
            None if row.params is None else canonical_json(row.params),
            row.fetched_at,
            row.http_status,
            row.sha256,
            row.storage_key,
            row.content_type,
            row.bytes,
            row.parser_version,
            row.fixture,
        )
        inserted = self._conn.execute(SQL_INSERT_SNAPSHOT, params).fetchone()
        if inserted is not None:
            return self._snapshot(row.source_code, inserted), True
        existing = self._conn.execute(SQL_SNAPSHOT_BY_HASH, (row.sha256, row.url)).fetchone()
        if existing is None:
            raise RuntimeError(f"snapshot {row.sha256} for {row.url} neither inserted nor found")
        return self._snapshot(row.source_code, existing), False

    def current_facts(self, identity: FactIdentity) -> list[FactRecord]:
        query = (
            SQL_CURRENT_FACTS + SQL_FACT_KEY_FILTER * len(identity.key) + SQL_CURRENT_FACTS_ORDER
        )
        params: list[Any] = [identity.subject_type, identity.subject_id, identity.attribute]
        for name, encoded in identity.key:
            params += [name, encoded]
        return [self._fact(r) for r in self._conn.execute(query, tuple(params)).fetchall()]

    def insert_fact(self, row: NewFact) -> FactRecord:
        params = (
            row.subject_type,
            row.subject_id,
            row.attribute,
            canonical_json(row.value),
            row.as_of,
            row.valid_from,
            row.valid_to,
            row.learned_at,
            row.snapshot_id,
            row.page_ref,
            row.extract_text,
            row.method,
            row.method_version,
            row.read_note,
            row.confidence,
            row.lane.value,
        )
        out = self._conn.execute(SQL_INSERT_FACT, params).fetchone()
        if out is None:
            raise RuntimeError("insert into core.facts returned no row")
        return self._fact(out)

    def supersede_fact(self, old_id: str, new_id: str, valid_to: date | None) -> None:
        cur = self._conn.execute(SQL_SUPERSEDE_FACT, (new_id, valid_to, old_id))
        if cur.rowcount != 1:
            raise SupersedeConflict(
                f"fact {old_id} was superseded concurrently (or does not exist)"
            )
