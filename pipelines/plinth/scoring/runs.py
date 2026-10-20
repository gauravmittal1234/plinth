"""Score runs over time (WORK_BREAKDOWN T11 "Runs").

`run_scoring(world, as_of)` does what the pipeline does on a scoring day:

1. **Recalculate** every scorable phase with the model current on `as_of`, data cut off
   at the end of that day (IST).
2. **Publish or give notice** against the phase's last published run (PRD §6.2 due process):
   a downgrade into High or Severe waits 7 days behind a notice to the developer; any other
   worsening goes out after a 48-hour heads-up; everything else publishes the same day.
3. **Watch** from the cutoff to the clock: re-score on what has become known since. A worse
   band becomes a proposal behind its notice (Aurelia: the Jul-Sep QPR missing -> High,
   effective 25 Oct unless it lands). New filings still being read open a 72-hour re-score
   window and show no figures until then (Sapphire).
4. **History**: chain every run (ledger + new) with `supersedes`, and turn published runs
   into band-history intervals. A pending band never reaches history.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field, replace
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Literal

from plinth_contracts import BandCode, BandSetBy, ConfidenceLevel, ScoreState

from .assess import Assessment, Frequency, assess, frequency
from .dates import fmt_date, fmt_quarter, ist_date
from .features import PhaseView
from .fixture_world import EMPTY_LEDGER, Ledger, LedgerNotice, LedgerRun, Provenance
from .model import (
    MODELS_DIR,
    ReasonCatalogue,
    RedFlagCatalogue,
    ScoreModel,
    band_step,
    current_model,
    load_model,
    load_models,
    load_reasons,
    load_red_flags,
)
from .reasons import Reason
from .world import QprFiling, World, ref_instant

FIXTURE_NS = "https://plinth.in/fixtures"
COMPUTED_SOURCE = "computed by plinth.scoring"

RunStatus = Literal["published", "superseded", "pending_notice"]
NoticeKind = Literal["immediate", "heads_up_48h", "notice_7day"]


def fixture_id(kind: str, key: str) -> str:
    """UUID v5 of https://plinth.in/fixtures/<kind>/<key> (the fixtures' id convention)."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{FIXTURE_NS}/{kind}/{key}"))


def run_id(phase: str, model_version: str, computed_on: date) -> str:
    return fixture_id("score_run", f"{phase}/{model_version}/{computed_on.isoformat()}")


def notice_id(phase: str, kind: str, sent_on: date) -> str:
    return fixture_id("band_notice", f"{phase}/{kind}/{sent_on.isoformat()}")


@dataclass(frozen=True)
class Run:
    id: str
    phase: str
    model_version: str
    data_cutoff: date
    computed_on: date
    published_on: date | None
    status: RunStatus
    state: ScoreState
    band: BandCode | None
    set_by: BandSetBy | None
    rule_code: str | None
    confidence: ConfidenceLevel | None
    frequency: Frequency | None
    stall: bool
    stale: bool
    what_would_change: str | None
    supersedes: str | None
    notice: str | None
    source: str
    history_source: str
    reasons: tuple[Reason, ...] = ()
    reasons_source: str = COMPUTED_SOURCE
    assessment: Assessment | None = None


@dataclass(frozen=True)
class Notice:
    id: str
    phase: str
    kind: str
    from_band: BandCode
    to_band: BandCode
    proposed_run: str
    reason_text: str
    trigger_fact_ids: tuple[str, ...]
    sent_on: date
    effective_on: date
    public_marker_text: str | None
    status: str
    source: str


@dataclass(frozen=True)
class RedFlagRecord:
    id: str
    rule_code: str
    subject_type: str
    subject: str
    triggered_on: date
    cleared_on: date | None
    fact_ids: tuple[str, ...]
    source: str


@dataclass(frozen=True)
class Rescore:
    phase: str
    trigger_fact: str | None
    quarter: str
    filed_on: date | None
    appeared_on: date | None
    fetched_at: datetime
    due_by: datetime
    status: Literal["reading", "overdue"]
    source: str


@dataclass(frozen=True)
class StaleInput:
    phase: str
    latest_quarter: str
    latest_filed_on: date
    age_days_on_clock: int
    stale_after_days: int
    source: str


@dataclass(frozen=True)
class StallRecord:
    phase: str
    quarters: tuple[str, ...]
    built_pct: int
    source: str


@dataclass(frozen=True)
class HistoryRow:
    phase: str
    band: BandCode | None
    state: ScoreState
    confidence: ConfidenceLevel | None
    from_date: date
    to_date: date | None
    run: str
    model_version: str
    source: str


@dataclass(frozen=True)
class Publication:
    kind: NoticeKind
    published_on: date | None
    effective_on: date


@dataclass
class ScoringResult:
    as_of: date
    clock: datetime
    model: ScoreModel
    models: tuple[ScoreModel, ...]
    provenance: Provenance | None
    runs: list[Run] = field(default_factory=list)
    notices: list[Notice] = field(default_factory=list)
    history: list[HistoryRow] = field(default_factory=list)
    red_flags: list[RedFlagRecord] = field(default_factory=list)
    rescoring: list[Rescore] = field(default_factory=list)
    stale: list[StaleInput] = field(default_factory=list)
    stalls: list[StallRecord] = field(default_factory=list)
    assessments: dict[str, Assessment] = field(default_factory=dict)
    proposals: dict[str, Assessment] = field(default_factory=dict)

    def current_run(self, phase: str) -> Run:
        """The phase's published run on the as-of date (what buyers see)."""
        rows = [
            r
            for r in self.runs
            if r.phase == phase and r.published_on is not None and r.published_on <= self.as_of
        ]
        return max(rows, key=lambda r: (r.published_on or date.min, r.computed_on))

    def pending_run(self, phase: str) -> Run | None:
        rows = [r for r in self.runs if r.phase == phase and r.status == "pending_notice"]
        return rows[-1] if rows else None


def publication(
    prev_band: BandCode | None, new_band: BandCode | None, computed_on: date, model: ScoreModel
) -> Publication:
    """PRD §6.2: 7 days' notice before a downgrade into High/Severe; 48 h for other worsening."""
    rules = model.rules.notice
    worse = (
        prev_band is not None
        and new_band is not None
        and band_step(new_band) > band_step(prev_band)
    )
    if worse and new_band in rules.downgrade_into:
        return Publication("notice_7day", None, computed_on + timedelta(days=rules.notice_days))
    if worse:
        eff = computed_on + timedelta(hours=rules.heads_up_hours)
        return Publication("heads_up_48h", eff, eff)
    return Publication("immediate", computed_on, computed_on)


def run_scoring(
    world: World,
    as_of: date,
    *,
    ledger: Ledger = EMPTY_LEDGER,
    provenance: Provenance | None = None,
    clock: datetime | None = None,
    model_version: str | None = None,
    models_dir: Path = MODELS_DIR,
) -> ScoringResult:
    model = (
        load_model(model_version, models_dir) if model_version else current_model(as_of, models_dir)
    )
    cat = load_reasons(models_dir)
    flags = load_red_flags(models_dir)
    now = clock if clock is not None else world.clock
    released = tuple(m for m in load_models(models_dir) if m.released_on <= as_of)
    out = ScoringResult(as_of=as_of, clock=now, model=model, models=released, provenance=provenance)
    cutoff = ref_instant(as_of)
    prov = provenance

    for phase in world.scorable_phases:
        slug = phase.slug
        prior = [_ledger_run(r, models_dir) for r in ledger.runs_for(slug, as_of)]
        a = assess(world, phase, cutoff, model, cat, flags)
        out.assessments[slug] = a
        prev_pub = next((r for r in reversed(prior) if r.published_on is not None), None)
        pub = publication(prev_pub.band if prev_pub else None, a.band, as_of, model)

        rid = run_id(slug, model.version, as_of)
        notice_ref: str | None = None
        if pub.kind != "immediate":
            notice_ref = notice_id(slug, pub.kind, as_of)
        src = (prov.runs.get(slug) if prov else None) or COMPUTED_SOURCE
        current = _new_run(
            a,
            rid=rid,
            data_cutoff=as_of,
            computed_on=as_of,
            pub=pub,
            clock_date=ist_date(now),
            supersedes=prior[-1].id if prior else None,
            notice=notice_ref,
            source=src,
            reasons_source=(prov.reason_source(slug) if prov else None) or COMPUTED_SOURCE,
        )
        if notice_ref is not None and prev_pub is not None and prev_pub.band and a.band:
            out.notices.append(
                _notice(world, prev_pub.band, a, None, pub, notice_ref, rid, as_of, cat, prov)
            )
        chain = [*prior, current]

        # Watch pass: what has become known between the cutoff and the clock.
        b = assess(world, phase, now, model, cat, flags) if ist_date(now) > as_of else a
        if (b.band, b.state) != (a.band, a.state):
            out.proposals[slug] = b
            today = ist_date(now)
            pub2 = publication(a.band, b.band, today, model)
            rid2 = run_id(slug, model.version, today)
            nref = notice_id(slug, pub2.kind, today) if pub2.kind != "immediate" else None
            src2 = (prov.proposals.get(slug) if prov else None) or COMPUTED_SOURCE
            chain.append(
                _new_run(
                    b,
                    rid=rid2,
                    data_cutoff=today,
                    computed_on=today,
                    pub=pub2,
                    clock_date=today,
                    supersedes=current.id,
                    notice=nref,
                    source=src2,
                    reasons_source=src2,
                )
            )
            if nref is not None and a.band is not None and b.band is not None:
                out.notices.append(
                    _notice(world, a.band, b, a.view, pub2, nref, rid2, today, cat, prov)
                )

        chain = _settle_statuses(chain)
        out.runs.extend(chain)
        out.history.extend(_history(chain, ist_date(now)))
        out.rescoring.extend(_rescoring(world, slug, cutoff, now, model, prov))
        stale = _stale(a, b.view, prov)
        if stale is not None:
            out.stale.append(stale)
        if a.view.stall is not None:
            out.stalls.append(
                StallRecord(
                    slug,
                    tuple(f.quarter for f in a.view.stall.filings),
                    a.view.stall.built_pct,
                    (prov.stalls if prov else None) or COMPUTED_SOURCE,
                )
            )

    out.notices = sorted(
        [*(_ledger_notice(world, n) for n in ledger.notices if n.sent_on <= as_of), *out.notices],
        key=lambda n: (n.sent_on, n.phase),
    )
    _link_ledger_notices(out)
    out.red_flags = _red_flags(world, out, flags, prov)
    return out


# ---- runs ---------------------------------------------------------------------------------


def _ledger_run(r: LedgerRun, models_dir: Path) -> Run:
    m = load_model(r.model_version, models_dir)
    return Run(
        id=run_id(r.phase, r.model_version, r.computed_on),
        phase=r.phase,
        model_version=r.model_version,
        data_cutoff=r.data_cutoff,
        computed_on=r.computed_on,
        published_on=r.published_on,
        status="published",
        state=r.state,
        band=r.band,
        set_by=r.set_by,
        rule_code=r.rule_code,
        confidence=r.confidence,
        frequency=frequency(r.band, r.set_by, r.confidence, m),
        stall=r.stall,
        stale=r.stale,
        what_would_change=None,
        supersedes=None,
        notice=None,
        source=r.source,
        history_source=r.history_source,
    )


def _new_run(
    a: Assessment,
    *,
    rid: str,
    data_cutoff: date,
    computed_on: date,
    pub: Publication,
    clock_date: date,
    supersedes: str | None,
    notice: str | None,
    source: str,
    reasons_source: str,
) -> Run:
    published = pub.published_on is not None and pub.published_on <= clock_date
    return Run(
        id=rid,
        phase=a.phase.slug,
        model_version=a.model.version,
        data_cutoff=data_cutoff,
        computed_on=computed_on,
        published_on=pub.published_on if published else None,
        status="published" if published else "pending_notice",
        state=a.state,
        band=a.band,
        set_by=a.set_by,
        rule_code=a.rule_code,
        confidence=a.confidence,
        frequency=a.frequency,
        stall=a.stall,
        stale=a.stale,
        what_would_change=a.what_would_change if published else None,
        supersedes=supersedes,
        notice=notice,
        source=source,
        history_source=source,
        reasons=a.reasons if published else (),
        reasons_source=reasons_source,
        assessment=a,
    )


def _settle_statuses(chain: list[Run]) -> list[Run]:
    """Chain `supersedes` and mark every published run but the latest as superseded."""
    out: list[Run] = []
    published = [r for r in chain if r.published_on is not None]
    latest = max(published, key=lambda r: r.published_on or date.min) if published else None
    prev: Run | None = None
    for r in chain:
        status: RunStatus = r.status
        if r.published_on is not None and r is not latest:
            status = "superseded"
        out.append(replace(r, status=status, supersedes=prev.id if prev else None))
        prev = r
    return out


def _history(chain: list[Run], clock_date: date) -> list[HistoryRow]:
    pubs = [r for r in chain if r.published_on is not None and r.published_on <= clock_date]
    pubs.sort(key=lambda r: (r.published_on or date.min, r.computed_on))
    rows: list[HistoryRow] = []
    for i, r in enumerate(pubs):
        assert r.published_on is not None
        nxt = pubs[i + 1].published_on if i + 1 < len(pubs) else None
        rows.append(
            HistoryRow(
                phase=r.phase,
                band=r.band,
                state=r.state,
                confidence=r.confidence,
                from_date=r.published_on,
                to_date=nxt,
                run=r.id,
                model_version=r.model_version,
                source=r.history_source,
            )
        )
    return rows


# ---- notices ------------------------------------------------------------------------------


def _notice(
    world: World,
    from_band: BandCode,
    proposal: Assessment,
    before: PhaseView | None,
    pub: Publication,
    nid: str,
    rid: str,
    sent_on: date,
    cat: ReasonCatalogue,
    prov: Provenance | None,
) -> Notice:
    assert proposal.band is not None
    text, facts, marker = _trigger(world, proposal, before, pub, cat)
    return Notice(
        id=nid,
        phase=proposal.phase.slug,
        kind=pub.kind,
        from_band=from_band,
        to_band=proposal.band,
        proposed_run=rid,
        reason_text=text,
        trigger_fact_ids=facts,
        sent_on=sent_on,
        effective_on=pub.effective_on,
        public_marker_text=marker,
        status="pending",
        source=(prov.notices if prov else None) or COMPUTED_SOURCE,
    )


def _trigger(
    world: World,
    proposal: Assessment,
    before: PhaseView | None,
    pub: Publication,
    cat: ReasonCatalogue,
) -> tuple[str, tuple[str, ...], str | None]:
    """The change that moved the band: the feature whose contribution rose most."""
    slug = proposal.phase.slug
    if before is not None:
        newly_missing = [f for f in proposal.view.window.missing if f not in before.window.missing]
        if newly_missing:
            f = newly_missing[-1]
            fact = world.fact(slug, "qpr.missing", quarter=f.quarter)
            text = cat.template("TIM_QPR_MISSING").template_en.format(
                quarter=fmt_quarter(f.quarter), due=fmt_date(f.due_on)
            )
            marker = cat.notices.qpr_missing_marker.format(date=fmt_date(pub.effective_on))
            return text, (fact.id,) if fact else (), marker
    top = max(
        (r for r in proposal.candidates if r.contribution is not None),
        key=lambda r: r.contribution or 0.0,
        default=None,
    )
    if top is None:
        return "", (), None
    return top.text, top.fact_ids, None


def _ledger_notice(world: World, n: LedgerNotice) -> Notice:
    return Notice(
        id=notice_id(n.phase, n.kind, n.sent_on),
        phase=n.phase,
        kind=n.kind,
        from_band=n.from_band,
        to_band=n.to_band,
        proposed_run=run_id(n.phase, n.proposed_run.model_version, n.proposed_run.computed_on),
        reason_text=n.reason_text,
        trigger_fact_ids=tuple(world.fact_by_key(k).id for k in n.trigger_facts),
        sent_on=n.sent_on,
        effective_on=n.effective_on,
        public_marker_text=n.public_marker_text,
        status=n.status,
        source=n.source,
    )


def _link_ledger_notices(out: ScoringResult) -> None:
    by_run = {n.proposed_run: n.id for n in out.notices}
    out.runs = [
        r if r.notice is not None or r.id not in by_run else replace(r, notice=by_run[r.id])
        for r in out.runs
    ]


# ---- watch-pass records -------------------------------------------------------------------


def _rescoring(
    world: World,
    slug: str,
    cutoff: datetime,
    now: datetime,
    model: ScoreModel,
    prov: Provenance | None,
) -> list[Rescore]:
    """Filings fetched after the cutoff whose figures are still being read (72-hour window)."""
    out: list[Rescore] = []
    for f in world.filings(slug):
        if f.fetched_at is None or f.status == "missing":
            continue
        if not (cutoff < f.fetched_at <= now) or _figures_read(f):
            continue
        due_by = f.fetched_at + timedelta(hours=model.config.rescore_hours)
        fact = world.fact(slug, "qpr.filing_status", quarter=f.quarter)
        out.append(
            Rescore(
                phase=slug,
                trigger_fact=fact.id if fact else None,
                quarter=f.quarter,
                filed_on=f.filed_on,
                appeared_on=f.appeared_on,
                fetched_at=f.fetched_at,
                due_by=due_by,
                status="reading" if now < due_by else "overdue",
                source=(prov.rescoring if prov else None) or COMPUTED_SOURCE,
            )
        )
    return out


def _figures_read(f: QprFiling) -> bool:
    return f.sold_pct is not None or f.built_pct is not None


def _stale(a: Assessment, b_view: PhaseView, prov: Provenance | None) -> StaleInput | None:
    """A key input older than the model's stale line on the clock (DESIGN §5b: Coral, 187 days)."""
    latest = b_view.latest_filing
    if latest is None or a.state == ScoreState.not_scored:
        return None
    on = b_view.ref_date
    age = (on - latest.filed_by()).days
    limit = a.model.config.stale_days
    if age <= limit:
        return None
    return StaleInput(
        phase=a.phase.slug,
        latest_quarter=latest.quarter,
        latest_filed_on=latest.filed_by(),
        age_days_on_clock=age,
        stale_after_days=limit,
        source=(prov.stale if prov else None) or COMPUTED_SOURCE,
    )


def _red_flags(
    world: World, out: ScoringResult, flags: RedFlagCatalogue, prov: Provenance | None
) -> list[RedFlagRecord]:
    seen: dict[tuple[str, str], RedFlagRecord] = {}
    for a in out.assessments.values():
        for hit in a.view.red_flags:
            key = (hit.rule_code, hit.subject)
            if key in seen:
                continue
            n = flags.rule(hit.rule_code).n
            facts = tuple(
                f.id
                for e in hit.insolvency
                if (f := world.fact(e.developer, "insolvency.admitted")) is not None
            )
            seen[key] = RedFlagRecord(
                id=fixture_id("red_flag", f"{hit.subject}/RF{n}"),
                rule_code=hit.rule_code,
                subject_type=hit.subject_type,
                subject=hit.subject,
                triggered_on=hit.triggered_on,
                cleared_on=None,
                fact_ids=facts,
                source=(prov.red_flags if prov else None) or COMPUTED_SOURCE,
            )
    return list(seen.values())


def settle_notice(
    world: World,
    result: ScoringResult,
    phase: str,
    on: datetime,
    *,
    models_dir: Path = MODELS_DIR,
) -> Literal["effective", "withdrawn"]:
    """On a notice's effective date, re-score: the proposal goes ahead only if it still holds.

    DESIGN §5b: if the Jul-Sep QPR lands before 25 Oct, the proposal is withdrawn and
    Elevated stays; if it is still missing, High is published that day.
    """
    notice = next(n for n in result.notices if n.phase == phase and n.status == "pending")
    a = assess(
        world,
        world.phase(phase),
        on,
        result.model,
        load_reasons(models_dir),
        load_red_flags(models_dir),
    )
    holds = a.band is not None and band_step(a.band) >= band_step(notice.to_band)
    return "effective" if holds else "withdrawn"
