"""The HARERA run: fetch each manifest entry (fixtures only), parse what changed, write facts.

    result = run_harera(fixtures_dir, as_of=date(2026, 10, 14), store=MemoryStore(), clock=clock)

Every request in `manifest.json` is fetched through `plinth.core.pipeline.capture`, which is
what gives this module "heartbeat when the hash is unchanged" for free: `put.changed` is False
on a re-fetch of identical bytes, and this module skips parsing (and does not re-write facts)
for those. Documents are told apart by `parsers.sniff_doc_type`, not by `core.sources` code, so
one source code (e.g. `harera_registration`) can carry both the list page and Form A-H.

Facts carry a snapshot id and a `page_ref` (brief T18 Build: "records -> facts with page
refs"). What a quarter is overdue by (`MissingQpr`) is reported separately, not as a fact
(see `missing.py`).
"""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

from plinth.core.clock import Clock
from plinth.core.facts import FactDraft, FactsWriter, FactWrite
from plinth.core.fetchers import FetchRequest, FixtureFetcher
from plinth.core.jobs import JobRun
from plinth.core.pipeline import capture
from plinth.core.records import SnapshotRecord
from plinth.core.snapshots import SnapshotStore
from plinth.core.store import EvidenceStore

from .facts import (
    corrigendum_fact,
    form_a_h_fact,
    judgment_fact,
    qpr_filing_fact,
    qpr_progress_fact,
    registration_fact,
)
from .missing import missing_qprs
from .parsers import (
    parse_corrigendum,
    parse_form_a_h,
    parse_judgments,
    parse_qpr_detail,
    parse_qpr_register,
    parse_registered_list,
    sniff_doc_type,
)
from .records import MissingQpr, QprFiling, qpr_due_date, quarter_bounds

MANIFEST = "manifest.json"


class _MemoryBlobStore:
    """A content-addressed dict: enough for `SnapshotStore`, with no disk or network."""

    def __init__(self) -> None:
        self._blobs: dict[str, bytes] = {}

    def put(self, key: str, data: bytes, content_type: str | None) -> bool:
        if key in self._blobs:
            return False
        self._blobs[key] = data
        return True

    def get(self, key: str) -> bytes:
        return self._blobs[key]


@dataclass
class HareraRunResult:
    facts: list[FactWrite] = field(default_factory=list)
    missing_qprs: list[MissingQpr] = field(default_factory=list)
    #: Parsed records by doc type, for `--emit records` and for tests.
    records: dict[str, list[Any]] = field(default_factory=dict)
    fetched: int = 0
    changed: int = 0


def _load_manifest_entries(fixtures_dir: Path) -> list[dict[str, Any]]:
    path = fixtures_dir / MANIFEST
    doc = json.loads(path.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]] = doc.get("entries", [])
    return entries


def run_harera(
    fixtures_dir: Path,
    *,
    as_of: date,
    store: EvidenceStore,
    clock: Clock,
    job: JobRun | None = None,
) -> HareraRunResult:
    fetcher = FixtureFetcher(fixtures_dir, clock=clock)
    snapshots = SnapshotStore(_MemoryBlobStore(), store)
    writer = FactsWriter(store, clock)

    drafts: list[FactDraft] = []
    records: dict[str, list[Any]] = defaultdict(list)
    filed: dict[str, dict[str, date]] = defaultdict(dict)
    known_quarters: dict[str, list[str]] = defaultdict(list)
    result = HareraRunResult()

    for entry in _load_manifest_entries(fixtures_dir):
        request = FetchRequest(
            source_code=entry.get("source", "fixture"),
            url=entry["url"],
            method=entry.get("method", "GET"),
            params=entry.get("params"),
            data=entry.get("data"),
        )
        put = capture(request, fetcher=fetcher, snapshots=snapshots, run=job)
        result.fetched += 1
        if not put.changed:
            continue  # heartbeat only: identical bytes already on record, nothing to parse
        result.changed += 1

        body = snapshots.read(put.record)
        doc_type = sniff_doc_type(body, put.record.content_type)
        _parse_one(doc_type, body, put.record, drafts, records, filed, known_quarters)
        if job is not None:
            job.parsed += 1

    result.facts = writer.write_many(drafts)
    for registration_no, quarters in known_quarters.items():
        result.missing_qprs.extend(
            missing_qprs(
                registration_no,
                quarters=quarters,
                filed=filed.get(registration_no, {}).keys(),
                as_of=as_of,
            )
        )
    result.records = dict(records)
    return result


def _parse_one(
    doc_type: str,
    body: bytes,
    snapshot: SnapshotRecord,
    drafts: list[FactDraft],
    records: dict[str, list[Any]],
    filed: dict[str, dict[str, date]],
    known_quarters: dict[str, list[str]],
) -> None:
    if doc_type == "harera.registered_list":
        registered_rows = parse_registered_list(body)
        records[doc_type].extend(registered_rows)
        drafts.extend(registration_fact(row, snapshot_id=snapshot.id) for row in registered_rows)
    elif doc_type == "harera.form_a_h":
        form_a_h = parse_form_a_h(body)
        records[doc_type].append(form_a_h)
        drafts.append(form_a_h_fact(form_a_h, snapshot_id=snapshot.id))
    elif doc_type == "harera.qpr_detail":
        progress = parse_qpr_detail(body)
        records[doc_type].append(progress)
        _, quarter_end = quarter_bounds(progress.quarter)
        drafts.append(qpr_progress_fact(progress, snapshot_id=snapshot.id, quarter_end=quarter_end))
    elif doc_type == "harera.qpr_register":
        registration_no, pairs = parse_qpr_register(body)
        known_quarters[registration_no] = [quarter for quarter, _ in pairs]
        for quarter, filed_at in pairs:
            if filed_at is None:
                continue
            filing = QprFiling(
                registration_no=registration_no,
                quarter=quarter,
                filed_at=filed_at,
                due_at=qpr_due_date(quarter),
                page_ref=f"qpr-register {quarter}",
            )
            records[doc_type].append(filing)
            drafts.append(qpr_filing_fact(filing, snapshot_id=snapshot.id))
            filed[registration_no][quarter] = filed_at
    elif doc_type == "harera.corrigendum":
        entries = parse_corrigendum(body)
        records[doc_type].extend(entries)
        drafts.extend(corrigendum_fact(e, snapshot_id=snapshot.id) for e in entries)
    elif doc_type == "harera.judgments":
        judgment_rows = parse_judgments(body)
        records[doc_type].extend(judgment_rows)
        drafts.extend(judgment_fact(row, snapshot_id=snapshot.id) for row in judgment_rows)
