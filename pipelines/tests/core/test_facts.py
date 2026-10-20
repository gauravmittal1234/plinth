"""Facts writer: supersede chains stay intact; facts are never rewritten; PII stripped first."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st
from plinth_contracts import Lane

from plinth.core.clock import IST, FrozenClock
from plinth.core.facts import (
    FactDraft,
    FactsWriter,
    ForbiddenFact,
    WriteKind,
    check_supersede_chains,
)
from plinth.core.records import FactRecord, NewFact, NewSnapshot
from plinth.core.store import ImmutableRow, MemoryStore, SupersedeConflict

REG = str(uuid.UUID(int=1))
PHASE = str(uuid.UUID(int=2))
KEYS = {"qpr.progress": ("quarter",)}


class StepClock:
    """Moves forward one hour on every reading, so learned_at orders the writes."""

    def __init__(self) -> None:
        self.at = datetime(2026, 10, 14, 10, 0, tzinfo=IST)

    def now(self) -> datetime:
        self.at += timedelta(hours=1)
        return self.at


def progress(quarter: str, built: int, **kw: object) -> FactDraft:
    return FactDraft(
        "registration",
        REG,
        "qpr.progress",
        {"quarter": quarter, "sold_pct": 72, "built_pct": built},
        key_fields=("quarter",),
        **kw,  # type: ignore[arg-type]
    )


def dates(completion: str, as_of: date) -> FactDraft:
    return FactDraft(
        "registration",
        REG,
        "registration.dates",
        {"original_completion": completion, "units": 500},
        as_of=as_of,
    )


@pytest.fixture
def store() -> MemoryStore:
    return MemoryStore()


@pytest.fixture
def writer(store: MemoryStore) -> FactsWriter:
    return FactsWriter(store, StepClock())


def heads(store: MemoryStore) -> dict[object, object]:
    """Current built_pct per quarter."""
    out: dict[object, object] = {}
    for f in store.facts():
        if f.superseded_by is None and isinstance(f.value, dict):
            out[f.value["quarter"]] = f.value["built_pct"]
    return out


def chain_from(store: MemoryStore, fact_id: str) -> list[FactRecord]:
    out = [store.fact(fact_id)]
    while out[-1].superseded_by is not None:
        out.append(store.fact(out[-1].superseded_by))
    return out


def test_first_write_inserts(writer: FactsWriter, store: MemoryStore) -> None:
    w = writer.write(dates("2027-12", date(2026, 10, 14)))
    assert w.kind is WriteKind.INSERTED
    assert w.fact.valid_from == date(2026, 10, 14)  # from as_of
    assert w.fact.lane is Lane.records_show
    assert w.fact.learned_at.tzinfo is not None
    assert store.facts() == [w.fact]


def test_same_value_is_unchanged(writer: FactsWriter, store: MemoryStore) -> None:
    first = writer.write(dates("2027-12", date(2026, 10, 14)))
    again = writer.write(dates("2027-12", date(2026, 11, 14)))
    assert again.kind is WriteKind.UNCHANGED
    assert again.fact.id == first.fact.id
    assert len(store.facts()) == 1


def test_new_value_supersedes_and_the_chain_stays_intact(
    writer: FactsWriter, store: MemoryStore
) -> None:
    v1 = writer.write(dates("2027-12", date(2026, 7, 14)))
    v2 = writer.write(dates("2028-06", date(2026, 8, 14)))
    v3 = writer.write(dates("2028-09", date(2026, 9, 14)))
    assert (v2.kind, v3.kind) == (WriteKind.SUPERSEDED, WriteKind.SUPERSEDED)
    assert v2.previous is not None and v2.previous.id == v1.fact.id

    chain = chain_from(store, v1.fact.id)
    assert [f.id for f in chain] == [v1.fact.id, v2.fact.id, v3.fact.id]
    assert [f.value for f in chain] == [
        {"original_completion": "2027-12", "units": 500},
        {"original_completion": "2028-06", "units": 500},
        {"original_completion": "2028-09", "units": 500},
    ]
    # Validity closes where the next version starts; only the head is open and current.
    assert [f.valid_to for f in chain] == [date(2026, 8, 14), date(2026, 9, 14), None]
    assert [f.superseded_by is None for f in store.facts()] == [False, False, True]
    assert check_supersede_chains(store.facts(), KEYS) == []


def test_series_keys_keep_quarters_apart(writer: FactsWriter, store: MemoryStore) -> None:
    q1 = writer.write(progress("2026-Q1", 38, as_of=date(2026, 3, 31)))
    q2 = writer.write(progress("2026-Q2", 41, as_of=date(2026, 6, 30)))
    assert (q1.kind, q2.kind) == (WriteKind.INSERTED, WriteKind.INSERTED)
    fix = writer.write(progress("2026-Q1", 37, as_of=date(2026, 3, 31)))  # a corrected re-read
    assert fix.kind is WriteKind.SUPERSEDED
    assert fix.previous is not None and fix.previous.id == q1.fact.id
    assert heads(store) == {"2026-Q1": 37, "2026-Q2": 41}
    assert check_supersede_chains(store.facts(), KEYS) == []


def test_missing_key_field_is_an_error(writer: FactsWriter) -> None:
    with pytest.raises(ValueError, match="key field 'quarter'"):
        writer.write(
            FactDraft(
                "registration", REG, "qpr.progress", {"built_pct": 1}, key_fields=("quarter",)
            )
        )


def test_rereading_an_older_period_keeps_validity_sane(
    writer: FactsWriter, store: MemoryStore
) -> None:
    writer.write(dates("2027-12", date(2026, 9, 14)))
    older = writer.write(dates("2028-01", date(2026, 7, 1)))  # starts before the current version
    assert older.kind is WriteKind.SUPERSEDED
    assert older.previous is not None
    assert store.fact(older.previous.id).valid_to is None  # not closed before it began
    assert store.fact(older.previous.id).superseded_by == older.fact.id


def test_snapshot_reference_must_exist(writer: FactsWriter, store: MemoryStore) -> None:
    with pytest.raises(LookupError, match="foreign key"):
        writer.write(FactDraft("phase", PHASE, "price.quoted", 1, snapshot_id=str(uuid.uuid4())))
    snap, _ = store.insert_snapshot(
        NewSnapshot(
            source_code="harera_qpr",
            url="fixture://x",
            method="GET",
            params=None,
            fetched_at=FrozenClock().now(),
            http_status=200,
            sha256="a" * 64,
            storage_key="sha256/aa/" + "a" * 64,
            content_type=None,
            bytes=1,
            parser_version=None,
            fixture=True,
        )
    )
    w = writer.write(
        FactDraft("phase", PHASE, "price.quoted", 1, snapshot_id=snap.id, page_ref="p. 2")
    )
    assert w.fact.snapshot_id == snap.id and w.fact.page_ref == "p. 2"


def test_pii_is_stripped_before_insert(writer: FactsWriter) -> None:
    w = writer.write(
        FactDraft(
            "developer",
            PHASE,
            "promoter.contact",
            {
                "office": "Sector 37D",
                "line": "Call +91 99000 00318",
                "emails": ["sales@example.com"],
            },
            extract_text="Promoter: Fixture Estates. Mobile 99000 00318, sales@example.com. "
            "RERA GGM/673/405/2022/117",
        )
    )
    assert w.pii_stripped == 4
    assert w.fact.value == {
        "office": "Sector 37D",
        "line": "Call [phone removed]",
        "emails": ["[email removed]"],
    }
    assert w.fact.extract_text == (
        "Promoter: Fixture Estates. Mobile [phone removed], [email removed]. "
        "RERA GGM/673/405/2022/117"
    )


@pytest.mark.parametrize("lane", [Lane.developer_says, Lane.from_developer, Lane.buyer_upload])
def test_developer_and_buyer_lanes_are_refused(writer: FactsWriter, lane: Lane) -> None:
    with pytest.raises(ForbiddenFact, match="lane"):
        writer.write(FactDraft("phase", PHASE, "price.quoted", 1, lane=lane))


def test_developer_method_is_refused(writer: FactsWriter) -> None:
    with pytest.raises(ForbiddenFact, match="method"):
        writer.write(FactDraft("phase", PHASE, "price.quoted", 1, method="developer"))


def test_rows_validate_like_the_table(writer: FactsWriter) -> None:
    with pytest.raises(ValueError, match="subject_type"):
        writer.write(FactDraft("project", PHASE, "x", 1))
    with pytest.raises(ValueError, match="confidence"):
        writer.write(FactDraft("phase", PHASE, "x", 1, confidence=1.5))
    with pytest.raises(ValueError, match="valid_to"):
        writer.write(
            FactDraft(
                "phase", PHASE, "x", 1, valid_from=date(2026, 10, 2), valid_to=date(2026, 10, 1)
            )
        )


def test_a_fact_is_superseded_only_once(writer: FactsWriter, store: MemoryStore) -> None:
    v1 = writer.write(dates("2027-12", date(2026, 7, 14)))
    v2 = writer.write(dates("2028-06", date(2026, 8, 14)))
    with pytest.raises(SupersedeConflict, match="already superseded"):
        store.supersede_fact(v1.fact.id, v2.fact.id, None)
    with pytest.raises(ImmutableRow, match="itself"):
        store.supersede_fact(v2.fact.id, v2.fact.id, None)


def test_two_current_versions_stop_the_writer(writer: FactsWriter, store: MemoryStore) -> None:
    clock = StepClock()
    for completion in ("2027-12", "2028-06"):  # bypass the writer: a concurrent double insert
        draft = dates(completion, date(2026, 7, 14))
        store.insert_fact(_new(draft, clock))
    with pytest.raises(SupersedeConflict, match="2 current versions"):
        writer.write(dates("2028-09", date(2026, 9, 14)))
    assert len(check_supersede_chains(store.facts(), {"registration.dates": ()})) == 1


def test_a_failed_supersede_rolls_back_the_insert(store: MemoryStore) -> None:
    writer = FactsWriter(store, StepClock())
    writer.write(dates("2027-12", date(2026, 7, 14)))

    def broken(old_id: str, new_id: str, valid_to: date | None) -> None:
        raise SupersedeConflict("superseded concurrently")

    store.supersede_fact = broken  # type: ignore[method-assign]
    with pytest.raises(SupersedeConflict):
        writer.write(dates("2028-06", date(2026, 8, 14)))
    assert len(store.facts()) == 1


def _new(draft: FactDraft, clock: StepClock) -> NewFact:
    return NewFact(
        subject_type=draft.subject_type,
        subject_id=draft.subject_id,
        attribute=draft.attribute,
        value=draft.value,
        as_of=draft.as_of,
        valid_from=draft.as_of,
        valid_to=None,
        learned_at=clock.now(),
        snapshot_id=None,
        page_ref=None,
        extract_text=None,
        method="parser",
        method_version=None,
        read_note=None,
        confidence=None,
        lane=Lane.records_show,
    )


# -- check_supersede_chains finds every kind of break ---------------------------------------


def _fact(id_: str, superseded_by: str | None = None, **kw: object) -> FactRecord:
    base: dict[str, object] = {
        "subject_type": "registration",
        "subject_id": REG,
        "attribute": "registration.dates",
        "value": {"v": id_},
        "as_of": None,
        "valid_from": None,
        "valid_to": None,
        "learned_at": datetime(2026, 10, 14, tzinfo=IST),
        "snapshot_id": None,
        "page_ref": None,
        "extract_text": None,
        "method": "parser",
        "method_version": None,
        "read_note": None,
        "confidence": None,
        "lane": Lane.records_show,
        "id": id_,
        "superseded_by": superseded_by,
    }
    base.update(kw)
    return FactRecord(**base)  # type: ignore[arg-type]


def test_chain_check_finds_breaks() -> None:
    assert check_supersede_chains([_fact("a", "b"), _fact("b")]) == []
    assert any("does not exist" in p for p in check_supersede_chains([_fact("a", "zz")]))
    assert any(
        "fork" in p for p in check_supersede_chains([_fact("a", "c"), _fact("b", "c"), _fact("c")])
    )
    assert any("cycle" in p for p in check_supersede_chains([_fact("a", "b"), _fact("b", "a")]))
    assert any("itself" in p for p in check_supersede_chains([_fact("a", "a")]))
    crossing = [_fact("a", "b"), _fact("b", attribute="qpr.missing")]
    assert any("crosses" in p for p in check_supersede_chains(crossing))
    overlap = [_fact("a", "b", valid_to=date(2026, 9, 1)), _fact("b", valid_from=date(2026, 8, 1))]
    assert any("overlaps" in p for p in check_supersede_chains(overlap))
    backwards = [_fact("a", "b"), _fact("b", learned_at=datetime(2026, 1, 1, tzinfo=IST))]
    assert any("learned before" in p for p in check_supersede_chains(backwards))


# -- property: any sequence of readings leaves intact chains with the last value current -----


readings = st.lists(
    st.tuples(st.sampled_from(["2026-Q1", "2026-Q2", "2026-Q3"]), st.integers(0, 100)),
    min_size=1,
    max_size=40,
)


@settings(max_examples=150, deadline=None)
@given(readings)
def test_property_chains_always_intact(seq: list[tuple[str, int]]) -> None:
    store = MemoryStore()
    writer = FactsWriter(store, StepClock())
    last: dict[str, int] = {}
    for quarter, built in seq:
        writer.write(progress(quarter, built))
        last[quarter] = built
    facts = store.facts()
    assert check_supersede_chains(facts, KEYS) == []
    assert heads(store) == last
    # Writes of an unchanged value never add rows: rows = 1 + number of value changes.
    changes = 0
    seen: dict[str, int] = {}
    for quarter, built in seq:
        if seen.get(quarter) != built:
            changes += 1
        seen[quarter] = built
    assert len(facts) == changes
