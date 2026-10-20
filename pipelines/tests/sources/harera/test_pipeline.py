"""`run_harera` end to end, on the synthetic fixtures: fetch -> snapshot -> parse -> facts.

Also the heartbeat behaviour platform_architecture §4.1 describes ("Content hash changed? no
-> Record heartbeat only"), and the reserved `fixtures/harera/real/` directory (brief T18
Build), which tests skip while it holds nothing.
"""

from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from plinth.core.clock import FrozenClock
from plinth.core.facts import WriteKind, check_supersede_chains
from plinth.core.fetchers import FetchRequest, FixtureFetcher
from plinth.core.pipeline import capture
from plinth.core.snapshots import SnapshotStore
from plinth.core.store import MemoryStore
from plinth.sources.harera.parsers import sniff_doc_type
from plinth.sources.harera.pipeline import HareraRunResult, _MemoryBlobStore, run_harera
from plinth.sources.harera.records import MissingQpr

FIXTURES = Path(__file__).resolve().parent.parent.parent / "fixtures" / "harera"
AURELIA = "GGM/673/405/2022/117"
CLOCK = FrozenClock()


def _run(as_of: date, store: MemoryStore | None = None) -> HareraRunResult:
    return run_harera(FIXTURES, as_of=as_of, store=store or MemoryStore(), clock=CLOCK)


def test_run_harera_writes_the_canonical_aurelia_qpr_series() -> None:
    result = _run(date(2026, 10, 14))
    progress = {
        w.fact.value["quarter"]: w.fact.value
        for w in result.facts
        if w.fact.subject_id == AURELIA and w.fact.attribute == "qpr.progress"
    }
    assert progress["2026-Q2"] == {
        "quarter": "2026-Q2",
        "sold_pct": 72.0,
        "built_pct": 41.0,
        "time_used_pct": 70.0,
        "collections_lakh": 205.0,
    }
    assert len(progress) == 8  # DESIGN §5b's progress table has 8 rows

    filing = {
        w.fact.value["quarter"]: w.fact.value
        for w in result.facts
        if w.fact.subject_id == AURELIA and w.fact.attribute == "qpr.filing"
    }
    assert len(filing) == 11
    late = {q: v["days_late"] for q, v in filing.items() if not v["on_time"]}
    assert late == {"2024-Q3": 12, "2025-Q1": 41, "2025-Q4": 38}  # DESIGN §5b "Late QPRs"
    assert filing["2026-Q2"]["on_time"] is True


def test_missing_qpr_depends_on_the_as_of_cutoff() -> None:
    # DESIGN §5b's data cutoff (14 Oct 2026): the Jul-Sep 2026 QPR is due 15 Oct 2026, so it is
    # not yet overdue -- not reported missing.
    assert _run(date(2026, 10, 14)).missing_qprs == []
    # Past the due date (DESIGN §5b: "not on HARERA as of 18 Oct 2026"): now it is missing.
    assert _run(date(2026, 10, 18)).missing_qprs == [
        MissingQpr(AURELIA, "2026-Q3", date(2026, 10, 15))
    ]


def test_every_fact_series_has_an_intact_supersede_chain() -> None:
    result = _run(date(2026, 10, 14))
    facts = [w.fact for w in result.facts]
    key_fields = {
        "qpr.progress": ("quarter",),
        "qpr.filing": ("quarter",),
        "harera.corrigendum": ("doc_type", "entry_date"),
        "harera.judgment": ("complaint_no",),
    }
    assert check_supersede_chains(facts, key_fields) == []


def test_heartbeat_when_the_hash_is_unchanged() -> None:
    # A single request, fetched twice through the same snapshot store: the second fetch is a
    # heartbeat (platform_architecture §4.1), not a re-parse.
    fetcher = FixtureFetcher(FIXTURES, clock=CLOCK)
    snapshots = SnapshotStore(_MemoryBlobStore(), MemoryStore())
    request = FetchRequest(
        "harera_registration", "https://harera.example.test/admincontrol/registered_projects/2"
    )
    first = capture(request, fetcher=fetcher, snapshots=snapshots)
    second = capture(request, fetcher=fetcher, snapshots=snapshots)
    assert first.changed is True
    assert second.changed is False


def test_a_second_run_over_the_same_store_only_sends_heartbeats() -> None:
    store = MemoryStore()
    first = _run(date(2026, 10, 14), store=store)
    second = _run(date(2026, 10, 14), store=store)
    assert first.changed == first.fetched  # every fixture is new on an empty store
    assert second.changed == 0
    assert second.facts == []
    assert all(w.kind is WriteKind.INSERTED for w in first.facts)


def test_real_fixtures_parse_without_crashing_or_are_skipped() -> None:
    real_dir = FIXTURES / "real"
    pages = [p for p in real_dir.iterdir() if p.is_file() and p.name != ".gitkeep"]
    if not pages:
        pytest.skip("fixtures/harera/real is empty (reserved for the founder's hand-saved pages)")
    for page in pages:
        sniff_doc_type(page.read_bytes(), None)
