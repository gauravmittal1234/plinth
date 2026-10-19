"""The scoring inputs: canonical catalogue and evidence records (DATA_MODEL §1-§4).

T11 runs on `packages/fixtures/canonical/{catalogue,evidence}.json` with no database.
Only the fields scoring reads are modelled; everything else is ignored. In M2+ the
same records come from `core.*` through T10's reader, so nothing here assumes files.
"""

from __future__ import annotations

import json
from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import date, datetime
from functools import cached_property
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, JsonValue

from .dates import end_of_day, start_of_day


class _Record(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True)


class DeveloperGroup(_Record):
    slug: str
    name: str
    finished_projects: int | None
    finished_late12: int | None


class Developer(_Record):
    key: str
    group: str
    legal_name: str
    status: str


class Project(_Record):
    slug: str
    group: str


class Phase(_Record):
    id: str
    slug: str
    project: str
    name: str
    short_name: str
    promoter: str | None
    units_total: int | None
    status: str


class Registration(_Record):
    phase: str
    registered_on: date | None
    registered_precision: str
    original_completion: date
    current_completion: date | None
    status: str


QprStatus = Literal["on_time", "late", "missing"]


class QprFiling(_Record):
    phase: str
    quarter: str
    due_on: date
    filed_on: date | None
    appeared_on: date | None
    fetched_at: datetime | None
    status: QprStatus
    days_late: int | None
    sold_pct: int | None
    built_pct: int | None

    def known_at(self) -> datetime:
        """When Plinth could first have read this filing (fetch, else filing, else due date).

        Rows marked on time without a filing date (older quarters, DESIGN §5b) were filed
        by their due date, so they count from then.
        """
        if self.fetched_at is not None:
            return self.fetched_at
        if self.filed_on is not None:
            return start_of_day(self.filed_on)
        return start_of_day(self.due_on)

    def filed_by(self) -> date:
        """The filing date, or the due date for on-time rows filed on an unknown day."""
        return self.filed_on if self.filed_on is not None else self.due_on


class Extension(_Record):
    phase: str
    seq: int
    kind: str
    granted_on: date
    from_completion: date
    to_completion: date


class BlanketExtension(_Record):
    authority: str
    advisory_on: date
    applies_from_completion: date
    applies_to_completion: date | None
    months: int


class ComplaintCount(_Record):
    subject_type: str
    subject: str
    count_24m: int
    units_base: int
    per_100_units: float
    median_count_similar: int | None
    latest_order_on: date | None
    window_to: date


class CompletionEvent(_Record):
    phase: str
    kind: str
    granted_on: date
    months_late: int
    late12: bool


class InsolvencyEvent(_Record):
    developer: str
    group: str
    kind: str
    event_on: date
    forum: str


class Fact(_Record):
    id: str
    key: str
    subject_type: str
    subject: str
    attribute: str
    value: JsonValue
    as_of: date
    learned_at: datetime
    superseded_by: str | None


class Catalogue(_Record):
    data_as_of: date
    clock: datetime
    developer_groups: list[DeveloperGroup]
    developers: list[Developer]
    projects: list[Project]
    phases: list[Phase]
    rera_registrations: list[Registration]
    qpr_filings: list[QprFiling]
    extensions: list[Extension]
    blanket_extensions: list[BlanketExtension]
    complaint_counts: list[ComplaintCount]
    completion_events: list[CompletionEvent]
    insolvency_events: list[InsolvencyEvent]


class Evidence(_Record):
    facts: list[Fact]


SCORABLE_STATUSES = frozenset({"under_construction", "stalled", "registered"})


@dataclass(frozen=True)
class World:
    """Catalogue + evidence, with the lookups scoring needs."""

    catalogue: Catalogue
    evidence: Evidence

    # ---- construction -------------------------------------------------------------------
    @classmethod
    def from_json(cls, catalogue: Mapping[str, Any], evidence: Mapping[str, Any]) -> World:
        return cls(Catalogue.model_validate(catalogue), Evidence.model_validate(evidence))

    @classmethod
    def from_dir(cls, canonical_dir: Path) -> World:
        cat = json.loads((canonical_dir / "catalogue.json").read_text(encoding="utf-8"))
        ev = json.loads((canonical_dir / "evidence.json").read_text(encoding="utf-8"))
        return cls.from_json(cat, ev)

    def replace(
        self,
        *,
        qpr_filings: Iterable[QprFiling] | None = None,
        extensions: Iterable[Extension] | None = None,
        complaint_counts: Iterable[ComplaintCount] | None = None,
        developer_groups: Iterable[DeveloperGroup] | None = None,
        insolvency_events: Iterable[InsolvencyEvent] | None = None,
        rera_registrations: Iterable[Registration] | None = None,
    ) -> World:
        """A copy with some catalogue tables swapped (scenarios and property tests)."""
        update: dict[str, Any] = {}
        for name, rows in (
            ("qpr_filings", qpr_filings),
            ("extensions", extensions),
            ("complaint_counts", complaint_counts),
            ("developer_groups", developer_groups),
            ("insolvency_events", insolvency_events),
            ("rera_registrations", rera_registrations),
        ):
            if rows is not None:
                update[name] = list(rows)
        return World(self.catalogue.model_copy(update=update), self.evidence)

    # ---- lookups ----------------------------------------------------------------------------
    @property
    def clock(self) -> datetime:
        return self.catalogue.clock

    @cached_property
    def scorable_phases(self) -> list[Phase]:
        """Phases a band can be published for, in catalogue order (the emit order)."""
        return [p for p in self.catalogue.phases if p.status in SCORABLE_STATUSES]

    def phase(self, slug: str) -> Phase:
        for p in self.catalogue.phases:
            if p.slug == slug:
                return p
        raise KeyError(f"no phase {slug}")

    def group_of(self, phase: Phase) -> DeveloperGroup:
        project = next(p for p in self.catalogue.projects if p.slug == phase.project)
        return self.group(project.group)

    def group(self, slug: str) -> DeveloperGroup:
        return next(g for g in self.catalogue.developer_groups if g.slug == slug)

    def group_phases(self, group: str) -> list[Phase]:
        projects = {p.slug for p in self.catalogue.projects if p.group == group}
        return [p for p in self.catalogue.phases if p.project in projects]

    def registration(self, phase: str) -> Registration:
        return next(r for r in self.catalogue.rera_registrations if r.phase == phase)

    def filings(self, phase: str) -> list[QprFiling]:
        rows = [f for f in self.catalogue.qpr_filings if f.phase == phase]
        return sorted(rows, key=lambda f: f.quarter)

    def extensions_of(self, phase: str) -> list[Extension]:
        return sorted(
            (e for e in self.catalogue.extensions if e.phase == phase), key=lambda e: e.seq
        )

    def complaints(self, subject_type: str, subject: str) -> ComplaintCount | None:
        for c in self.catalogue.complaint_counts:
            if c.subject_type == subject_type and c.subject == subject:
                return c
        return None

    def completion_events(self, phases: Iterable[str]) -> list[CompletionEvent]:
        wanted = set(phases)
        return [e for e in self.catalogue.completion_events if e.phase in wanted]

    def insolvency_events(self, group: str) -> list[InsolvencyEvent]:
        return [e for e in self.catalogue.insolvency_events if e.group == group]

    # ---- evidence ---------------------------------------------------------------------------
    @cached_property
    def facts_by_id(self) -> dict[str, Fact]:
        return {f.id: f for f in self.evidence.facts}

    def fact(
        self, subject: str, attribute: str, *, quarter: str | None = None, seq: int | None = None
    ) -> Fact | None:
        """The current (not superseded) fact for a subject and attribute.

        Citations link to the evidence record that documents the value a feature used.
        """
        for f in self.evidence.facts:
            if f.subject != subject or f.attribute != attribute or f.superseded_by is not None:
                continue
            if quarter is not None and not _value_has(f.value, "quarter", quarter):
                continue
            if seq is not None and not _value_has(f.value, "seq", seq):
                continue
            return f
        return None

    def fact_by_key(self, key: str) -> Fact:
        for f in self.evidence.facts:
            if f.key == key:
                return f
        raise KeyError(f"no fact {key}")


def _value_has(value: JsonValue, key: str, expected: object) -> bool:
    return isinstance(value, dict) and value.get(key) == expected


def ref_instant(d: date) -> datetime:
    """A data cutoff date covers the whole day in IST."""
    return end_of_day(d)
