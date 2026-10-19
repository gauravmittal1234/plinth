"""The facts writer: bitemporal facts with supersede chains (DATA_MODEL §2, §12 inv. 3).

A fact is never updated. A new reading of the same thing (same `FactIdentity`) is written as a
new row, and the previous current row gets its one-time `superseded_by` link (and `valid_to`
when it was open). So a cited fact id keeps its history, and following `superseded_by` from
any version reaches the current one.

    writer = FactsWriter(store, clock)
    writer.write(FactDraft("registration", reg_id, "qpr.progress",
                           {"quarter": "2026-Q2", "sold_pct": 72, "built_pct": 41},
                           as_of=date(2026, 6, 30), snapshot_id=put.record.id,
                           extract_text="Percentage of work completed: 41%.",
                           key_fields=("quarter",)))

Rules:
- the same value as the current version: nothing is written (`WriteKind.UNCHANGED`);
- a different value: insert, then link the old version (`WriteKind.SUPERSEDED`), in one
  transaction;
- the PII stripper runs on `extract_text` and every string in `value` before insert;
- developer content never enters through the pipelines: the `developer` method and the
  developer lanes are refused (DATA_MODEL §0: pipeline_writer has no grant on `ws`).
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import date
from enum import StrEnum

from plinth_contracts import Lane

from .clock import Clock, today_ist
from .pii import Json, strip_pii, strip_pii_json
from .records import FactIdentity, FactRecord, NewFact, canonical_json, identity_of
from .store import EvidenceStore, SupersedeConflict

#: Lanes a pipeline may write. Developer voices come only from the workspace (ws.*).
PIPELINE_LANES: frozenset[Lane] = frozenset(
    {Lane.records_show, Lane.our_estimate, Lane.reported_unverified}
)
PIPELINE_METHODS: frozenset[str] = frozenset({"parser", "llm_x2", "manual", "rules"})


class ForbiddenFact(PermissionError):
    """A fact the pipelines must not write (developer content, or an unknown method)."""


@dataclass(frozen=True)
class FactDraft:
    subject_type: str
    subject_id: str
    attribute: str
    value: Json
    as_of: date | None = None
    valid_from: date | None = None
    valid_to: date | None = None
    snapshot_id: str | None = None
    page_ref: str | None = None
    extract_text: str | None = None
    method: str = "parser"
    method_version: str | None = None
    read_note: str | None = None
    confidence: float | None = None
    lane: Lane = Lane.records_show
    #: Keys inside `value` that tell versions of one series apart (e.g. ("quarter",)).
    key_fields: tuple[str, ...] = ()

    def identity(self) -> FactIdentity:
        return identity_of(
            self.subject_type, self.subject_id, self.attribute, self.value, self.key_fields
        )


class WriteKind(StrEnum):
    INSERTED = "inserted"
    UNCHANGED = "unchanged"
    SUPERSEDED = "superseded"


@dataclass(frozen=True)
class FactWrite:
    kind: WriteKind
    fact: FactRecord
    previous: FactRecord | None = None
    pii_stripped: int = 0


class FactsWriter:
    def __init__(self, store: EvidenceStore, clock: Clock) -> None:
        self.store = store
        self.clock = clock

    def write(self, draft: FactDraft) -> FactWrite:
        if draft.lane not in PIPELINE_LANES:
            raise ForbiddenFact(
                f"{draft.attribute}: lane {draft.lane.value!r} is not a pipeline lane"
            )
        if draft.method not in PIPELINE_METHODS:
            raise ForbiddenFact(
                f"{draft.attribute}: method {draft.method!r} is not a pipeline method"
            )

        value, stripped = strip_pii_json(draft.value)
        extract = None
        if draft.extract_text is not None:
            cleaned = strip_pii(draft.extract_text)
            extract, stripped = cleaned.text, stripped + cleaned.stripped
        identity = identity_of(
            draft.subject_type, draft.subject_id, draft.attribute, value, draft.key_fields
        )
        valid_from = draft.valid_from or draft.as_of or today_ist(self.clock)

        with self.store.transaction():
            current = self.store.current_facts(identity)
            if len(current) > 1:
                raise SupersedeConflict(
                    f"{identity.describe()} has {len(current)} current versions; resolve by hand"
                )
            previous = current[0] if current else None
            if previous is not None and canonical_json(previous.value) == canonical_json(value):
                return FactWrite(WriteKind.UNCHANGED, previous, None, stripped)

            fact = self.store.insert_fact(
                NewFact(
                    subject_type=draft.subject_type,
                    subject_id=draft.subject_id,
                    attribute=draft.attribute,
                    value=value,
                    as_of=draft.as_of,
                    valid_from=valid_from,
                    valid_to=draft.valid_to,
                    learned_at=self.clock.now(),
                    snapshot_id=draft.snapshot_id,
                    page_ref=draft.page_ref,
                    extract_text=extract,
                    method=draft.method,
                    method_version=draft.method_version,
                    read_note=draft.read_note,
                    confidence=draft.confidence,
                    lane=draft.lane,
                )
            )
            if previous is None:
                return FactWrite(WriteKind.INSERTED, fact, None, stripped)
            # Close the old version's validity where the new one starts, unless that would
            # end it before it began (a re-read of an older period keeps its own range).
            closing = (
                valid_from
                if previous.valid_from is None or valid_from >= previous.valid_from
                else None
            )
            self.store.supersede_fact(previous.id, fact.id, closing)
            return FactWrite(WriteKind.SUPERSEDED, fact, previous, stripped)

    def write_many(self, drafts: Iterable[FactDraft]) -> list[FactWrite]:
        return [self.write(d) for d in drafts]


def check_supersede_chains(
    facts: Iterable[FactRecord], key_fields: Mapping[str, tuple[str, ...]] | None = None
) -> list[str]:
    """Every way a set of facts can break its supersede chains. Empty means intact.

    Checks: links point at existing facts of the same subject and attribute; no fact has two
    predecessors (no forks); no cycles, so every chain ends at a current fact; validity does
    not overlap across a link; a successor was not learned before its predecessor. With
    `key_fields` (attribute -> key fields), also: at most one current version per identity.
    """
    rows = list(facts)
    by_id = {f.id: f for f in rows}
    problems: list[str] = []
    predecessors: dict[str, list[str]] = defaultdict(list)

    for f in rows:
        if f.superseded_by is None:
            continue
        nxt = by_id.get(f.superseded_by)
        if nxt is None:
            problems.append(f"{f.id}: superseded_by {f.superseded_by} does not exist")
            continue
        if nxt.id == f.id:
            problems.append(f"{f.id}: supersedes itself")
            continue
        if (nxt.subject_type, nxt.subject_id, nxt.attribute) != (
            f.subject_type,
            f.subject_id,
            f.attribute,
        ):
            problems.append(f"{f.id} -> {nxt.id}: link crosses subjects or attributes")
        predecessors[nxt.id].append(f.id)
        if f.valid_to is not None and nxt.valid_from is not None and f.valid_to > nxt.valid_from:
            problems.append(
                f"{f.id} -> {nxt.id}: validity overlaps ({f.valid_to} > {nxt.valid_from})"
            )
        if nxt.learned_at < f.learned_at:
            problems.append(f"{f.id} -> {nxt.id}: successor learned before its predecessor")

    for succ, preds in predecessors.items():
        if len(preds) > 1:
            problems.append(f"{succ}: superseded from {len(preds)} facts (a fork): {sorted(preds)}")

    for f in rows:
        seen: set[str] = set()
        cur: FactRecord | None = f
        while cur is not None and cur.superseded_by is not None:
            if cur.id in seen:
                problems.append(f"{f.id}: supersede cycle through {cur.id}")
                break
            seen.add(cur.id)
            cur = by_id.get(cur.superseded_by)

    if key_fields:
        heads: dict[FactIdentity, int] = defaultdict(int)
        for f in rows:
            if f.superseded_by is None and f.attribute in key_fields:
                heads[f.identity(key_fields[f.attribute])] += 1
        problems += [f"{i.describe()}: {n} current versions" for i, n in heads.items() if n > 1]

    return sorted(set(problems))
