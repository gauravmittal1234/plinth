"""Row types for the evidence tables the pipelines write: core.snapshots and core.facts.

They mirror T04's columns (supabase/migrations/20261020000300_t04_core_evidence.sql) and the
checks on them. `tests/core/test_schema_parity.py` reads that migration and fails if a column
written here is missing there.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from plinth_contracts import Lane

from .pii import Json

SUBJECT_TYPES = ("phase", "developer", "group", "tower", "registration")
FACT_METHODS = ("parser", "llm_x2", "manual", "developer", "rules")
SHA256 = re.compile(r"^[0-9a-f]{64}$")


def canonical_json(value: Any) -> str:
    """Stable JSON text for comparisons and identity keys (sorted keys, no spaces)."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


@dataclass(frozen=True)
class NewSnapshot:
    source_code: str
    url: str
    method: str
    params: dict[str, Any] | None
    fetched_at: datetime
    http_status: int
    sha256: str
    storage_key: str
    content_type: str | None
    bytes: int
    parser_version: str | None
    fixture: bool

    def __post_init__(self) -> None:
        if not SHA256.match(self.sha256):
            raise ValueError(f"sha256 must be 64 lower-case hex characters, got {self.sha256!r}")
        if self.bytes < 0:
            raise ValueError("bytes must be >= 0")


@dataclass(frozen=True, kw_only=True)
class SnapshotRecord(NewSnapshot):
    id: str
    created_at: datetime | None = None


@dataclass(frozen=True)
class FactIdentity:
    """What makes two facts versions of the same thing.

    Subject and attribute, plus the values of `key_fields` inside the fact's value: the 2023-Q2
    and 2023-Q3 `qpr.progress` facts of one registration are different facts, both current;
    a re-read of 2023-Q2 supersedes only the 2023-Q2 one.
    """

    subject_type: str
    subject_id: str
    attribute: str
    key: tuple[tuple[str, str], ...] = ()

    def describe(self) -> str:
        key = ",".join(f"{k}={v}" for k, v in self.key)
        return f"{self.subject_type}:{self.subject_id}:{self.attribute}" + (
            f"[{key}]" if key else ""
        )


@dataclass(frozen=True)
class NewFact:
    subject_type: str
    subject_id: str
    attribute: str
    value: Json
    as_of: date | None
    valid_from: date | None
    valid_to: date | None
    learned_at: datetime
    snapshot_id: str | None
    page_ref: str | None
    extract_text: str | None
    method: str
    method_version: str | None
    read_note: str | None
    confidence: float | None
    lane: Lane

    def __post_init__(self) -> None:
        if self.subject_type not in SUBJECT_TYPES:
            raise ValueError(f"subject_type {self.subject_type!r} not in {SUBJECT_TYPES}")
        if self.method not in FACT_METHODS:
            raise ValueError(f"method {self.method!r} not in {FACT_METHODS}")
        if self.confidence is not None and not 0 <= self.confidence <= 1:
            raise ValueError("confidence is between 0 and 1")
        if self.valid_from and self.valid_to and self.valid_to < self.valid_from:
            raise ValueError("valid_to is before valid_from")
        if self.learned_at.tzinfo is None:
            raise ValueError("learned_at must be timezone-aware")
        canonical_json(self.value)  # must be JSON


@dataclass(frozen=True, kw_only=True)
class FactRecord(NewFact):
    id: str
    superseded_by: str | None = None
    corrections: list[Json] = field(default_factory=list)

    def identity(self, key_fields: tuple[str, ...] = ()) -> FactIdentity:
        return identity_of(
            self.subject_type, self.subject_id, self.attribute, self.value, key_fields
        )


def identity_of(
    subject_type: str, subject_id: str, attribute: str, value: Json, key_fields: tuple[str, ...]
) -> FactIdentity:
    key: list[tuple[str, str]] = []
    for name in key_fields:
        if not isinstance(value, dict) or name not in value:
            raise ValueError(f"{attribute}: key field {name!r} is missing from the value")
        key.append((name, canonical_json(value[name])))
    return FactIdentity(subject_type, subject_id, attribute, tuple(key))
