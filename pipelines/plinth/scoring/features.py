"""Point-in-time features for one phase (WORK_BREAKDOWN T11 "Features").

Everything is read as of a reference instant: a filing counts only once Plinth could have
read it (its fetch time, else its filing day, else its due day), a QPR is missing only after
its due date has passed, an extension only once granted. Nothing after the reference leaks
into a score.

Features (models/v1.2.yaml):
  sold_minus_built_pct       finances      latest QPR with both figures
  group_late12_pct           track_record  the group's finished RERA projects that were Late12
  time_used_minus_built_pct  timeline      month-based time used today minus latest built
  late_filings_last_8        timeline      late QPRs in the last 8 on record (v1.1+: and drops)
  missing_qprs               timeline      QPRs past due and not on HARERA
  extensions                 timeline      RERA s.6 extensions granted to this project
  complaints_per_100_units   legal         complaints decided against the promoter, 24 months
  stall                      site          no built progress over the last 4 consecutive QPRs
Stale age, red flags, Late12 and the scoring states are read here too.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from itertools import pairwise

from .dates import (
    add_months,
    add_months_same_day,
    consecutive,
    ist_date,
    months_between,
    round_half_up,
    time_used_pct,
)
from .model import ScoreModel
from .world import (
    ComplaintCount,
    DeveloperGroup,
    Extension,
    InsolvencyEvent,
    Phase,
    QprFiling,
    Registration,
    World,
)

CLOSING_INSOLVENCY_KINDS = frozenset({"closed", "set_aside", "withdrawn", "dismissed"})
REVOKED_REGISTRATION_STATUSES = frozenset({"revoked", "deregistered", "lapsed"})

FeatureValue = float | str | None


@dataclass(frozen=True)
class Progress:
    """The latest QPR with a built share, as known at the reference."""

    filing: QprFiling
    sold_pct: int | None
    built_pct: int


@dataclass(frozen=True)
class FilingWindow:
    """The last N QPR quarters on record at the reference (filed or past due)."""

    size: int
    rows: tuple[QprFiling, ...]
    late: tuple[QprFiling, ...]
    built_drops: tuple[QprFiling, ...]
    missing: tuple[QprFiling, ...]

    @property
    def full(self) -> bool:
        return len(self.rows) >= self.size

    @property
    def problems(self) -> int:
        return len(self.late) + len(self.built_drops)

    def level(self) -> str | None:
        if not self.rows:
            return None
        n = self.problems
        if n == 0:
            return "0, full window" if self.full else "0, short record"
        return "3 or more" if n >= 3 else str(n)


@dataclass(frozen=True)
class TrackRecord:
    group: DeveloperGroup
    finished: int
    late: int
    from_completion_events: bool

    @property
    def late_pct(self) -> float | None:
        return None if self.finished == 0 else 100.0 * self.late / self.finished


@dataclass(frozen=True)
class Stall:
    filings: tuple[QprFiling, ...]
    built_pct: int


@dataclass(frozen=True)
class RedFlagHit:
    rule_code: str
    subject_type: str
    subject: str
    triggered_on: date
    insolvency: tuple[InsolvencyEvent, ...] = ()


@dataclass(frozen=True)
class Late12:
    original_completion: date
    blanket_extension_months: int
    late_after: date


@dataclass(frozen=True)
class PhaseView:
    """What scoring knows about one phase at one reference instant."""

    phase: Phase
    group: DeveloperGroup
    ref: datetime
    registration: Registration
    time_used_pct: int | None
    progress: Progress | None
    window: FilingWindow
    extensions: tuple[Extension, ...]
    complaints: ComplaintCount | None
    complaints_per_100: float | None
    track: TrackRecord | None
    stall: Stall | None
    latest_filing: QprFiling | None
    red_flags: tuple[RedFlagHit, ...]
    late12: Late12

    @property
    def ref_date(self) -> date:
        return ist_date(self.ref)

    @property
    def sold_reported(self) -> bool:
        return self.progress is not None and self.progress.sold_pct is not None

    def values(self) -> dict[str, FeatureValue]:
        p = self.progress
        sold_minus_built = (
            p.sold_pct - p.built_pct if p is not None and p.sold_pct is not None else None
        )
        time_minus_built = (
            self.time_used_pct - p.built_pct
            if p is not None and self.time_used_pct is not None
            else None
        )
        return {
            "sold_minus_built_pct": sold_minus_built,
            "group_late12_pct": self.track.late_pct if self.track is not None else None,
            "time_used_minus_built_pct": time_minus_built,
            "late_filings_last_8": self.window.level(),
            "missing_qprs": len(self.window.missing),
            "extensions": len(self.extensions),
            "complaints_per_100_units": self.complaints_per_100,
            "stall": "yes" if self.stall is not None else "no",
        }

    def stale_age_days(self, on: date) -> int | None:
        if self.latest_filing is None:
            return None
        return (on - self.latest_filing.filed_by()).days


def build_view(world: World, phase: Phase, ref: datetime, model: ScoreModel) -> PhaseView:
    ref_date = ist_date(ref)
    reg = world.registration(phase.slug)
    group = world.group_of(phase)

    tu = (
        time_used_pct(reg.registered_on, reg.original_completion, ref_date)
        if reg.registered_on is not None
        else None
    )
    filed, missing = _filings_at(world.filings(phase.slug), ref)
    progress_rows = [f for f in filed if f.built_pct is not None]
    progress = None
    if progress_rows:
        last = progress_rows[-1]
        assert last.built_pct is not None
        progress = Progress(last, last.sold_pct, last.built_pct)

    window = _window(filed, missing, progress_rows, model)
    exts = tuple(e for e in world.extensions_of(phase.slug) if e.granted_on <= ref_date)

    complaints = world.complaints("phase", phase.slug)
    if complaints is not None and complaints.window_to > ref_date:
        complaints = None
    per_100 = complaints_rate(complaints) if complaints is not None else None

    return PhaseView(
        phase=phase,
        group=group,
        ref=ref,
        registration=reg,
        time_used_pct=tu,
        progress=progress,
        window=window,
        extensions=exts,
        complaints=complaints,
        complaints_per_100=per_100,
        track=track_record(world, group, ref_date, model),
        stall=_stall(progress_rows, model.rules.stall_quarters),
        latest_filing=filed[-1] if filed else None,
        red_flags=red_flags_for(world, phase, reg, group, ref_date),
        late12=late12(world, reg.original_completion, model, ref_date),
    )


def complaints_rate(c: ComplaintCount) -> float:
    """Complaints per 100 units, one decimal, half up (14 of 500 -> 2.8; 24 of 3,400 -> 0.7)."""
    return float(round_half_up(Decimal(100 * c.count_24m) / Decimal(c.units_base), 1))


def _filings_at(rows: list[QprFiling], ref: datetime) -> tuple[list[QprFiling], list[QprFiling]]:
    """(filed and readable at ref, past due and not readable at ref), in quarter order."""
    ref_date = ist_date(ref)
    filed: list[QprFiling] = []
    missing: list[QprFiling] = []
    for f in rows:
        if f.status != "missing" and f.known_at() <= ref:
            filed.append(f)
        elif f.due_on < ref_date:
            missing.append(f)
    return filed, missing


def _window(
    filed: list[QprFiling],
    missing: list[QprFiling],
    progress_rows: list[QprFiling],
    model: ScoreModel,
) -> FilingWindow:
    size = model.config.late_filings_window_quarters
    rows = tuple(sorted([*filed, *missing], key=lambda f: f.quarter)[-size:])
    in_window = {f.quarter for f in rows}
    late = tuple(f for f in rows if f in filed and f.status == "late")
    drops: list[QprFiling] = []
    if model.rules.built_share_drop_is_filing_problem:
        for prev, cur in pairwise(progress_rows):
            assert prev.built_pct is not None and cur.built_pct is not None
            if cur.built_pct < prev.built_pct and cur.quarter in in_window and cur not in late:
                drops.append(cur)
    return FilingWindow(
        size=size,
        rows=rows,
        late=late,
        built_drops=tuple(drops),
        missing=tuple(f for f in rows if f in missing),
    )


def _stall(progress_rows: list[QprFiling], n: int) -> Stall | None:
    if len(progress_rows) < n:
        return None
    last = progress_rows[-n:]
    if not consecutive([f.quarter for f in last]):
        return None
    built = [f.built_pct for f in last]
    assert all(b is not None for b in built)
    pcts = [b for b in built if b is not None]
    if all(b <= a for a, b in pairwise(pcts)):
        return Stall(tuple(last), pcts[-1])
    return None


def track_record(
    world: World, group: DeveloperGroup, ref_date: date, model: ScoreModel
) -> TrackRecord | None:
    """The group's finished RERA projects and how many were Late12.

    Recomputed from OC events (with the model's blanket-extension rule) when the catalogue
    has them; otherwise the group's published counts. None when the record is unknown.
    """
    finished = [p for p in world.group_phases(group.slug) if p.status == "completed"]
    events = [
        e
        for e in world.completion_events(p.slug for p in finished)
        if e.kind == "oc" and e.granted_on <= ref_date
    ]
    if events:
        late = 0
        for e in events:
            original = world.registration(e.phase).original_completion
            months_late = months_between(original, e.granted_on)
            blanket = blanket_months(world, original, model, ref_date)
            if months_late - blanket > 12:
                late += 1
        return TrackRecord(group, len(events), late, from_completion_events=True)
    if group.finished_projects is None or group.finished_late12 is None:
        return None
    return TrackRecord(
        group, group.finished_projects, group.finished_late12, from_completion_events=False
    )


def blanket_months(world: World, original: date, model: ScoreModel, ref_date: date) -> int:
    """Regulator-wide extensions that apply to an original completion date (PRD §6.2)."""
    if not model.config.blanket_extensions:
        return 0
    months = 0
    for b in world.catalogue.blanket_extensions:
        if b.advisory_on > ref_date or original < b.applies_from_completion:
            continue
        if b.applies_to_completion is not None and original > b.applies_to_completion:
            continue
        months += b.months
    return months


def late12(world: World, original: date, model: ScoreModel, ref_date: date) -> Late12:
    """Late12 line: original completion + blanket extensions + 12 months (never s.6 ones)."""
    months = blanket_months(world, original, model, ref_date)
    return Late12(original, months, add_months(original, months + 12))


def red_flags_for(
    world: World, phase: Phase, reg: Registration, group: DeveloperGroup, ref_date: date
) -> tuple[RedFlagHit, ...]:
    hits: list[RedFlagHit] = []
    events = sorted(world.insolvency_events(group.slug), key=lambda e: e.event_on)
    admitted = [e for e in events if e.kind == "admitted" and e.event_on <= ref_date]
    open_cases = [
        a
        for a in admitted
        if not any(
            c.developer == a.developer
            and c.kind in CLOSING_INSOLVENCY_KINDS
            and a.event_on <= c.event_on <= ref_date
            for c in events
        )
    ]
    if open_cases:
        hits.append(
            RedFlagHit(
                "RF1_GROUP_CIRP", "group", group.slug, open_cases[0].event_on, tuple(open_cases)
            )
        )
    if reg.status in REVOKED_REGISTRATION_STATUSES:
        hits.append(RedFlagHit("RF2_REGISTRATION_REVOKED", "phase", phase.slug, ref_date))
    return tuple(hits)


def registered_long_enough(view: PhaseView, model: ScoreModel) -> bool:
    reg = view.registration.registered_on
    if reg is None:
        return False
    months = model.config.not_scored.min_months_registered
    return add_months_same_day(reg, months) <= view.ref_date
