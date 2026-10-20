"""Reasons: at most 4 sourced sentences per band, ranked by contribution (PRD §6.2).

Each candidate comes from a feature the scorecard actually scored, carries the evidence
facts that hold its numbers, and renders a catalogue template (models/reasons.yaml). The
ranking is by |contribution| against the reference phase (Reg B style: the factors that
moved this score most, either way). A red-flag rule's reason always comes first. A
candidate without a citable fact is dropped: every published reason cites a fact.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from .dates import fmt_date, fmt_month, fmt_quarter
from .features import PhaseView, RedFlagHit
from .model import FACTORS, Factor, ReasonCatalogue, RedFlagCatalogue
from .scorecard import Score
from .world import Fact, World

MAX_REASONS = 4
EPS = 1e-9


@dataclass(frozen=True)
class Reason:
    factor: Factor
    code: str
    text: str
    fact_ids: tuple[str, ...]
    features: tuple[str, ...]
    contribution: float | None  # None for a red-flag rule's reason


def _ids(*facts: Fact | None) -> tuple[str, ...]:
    out: list[str] = []
    for f in facts:
        if f is not None and f.id not in out:
            out.append(f.id)
    return tuple(out)


def _render(cat: ReasonCatalogue, code: str, **params: object) -> str:
    return cat.template(code).template_en.format_map({k: str(v) for k, v in params.items()})


def _pct(x: float) -> str:
    return f"{x:.1f}"


def candidates(view: PhaseView, score: Score, world: World, cat: ReasonCatalogue) -> list[Reason]:
    """One candidate per scored feature (merged where one sentence states two features)."""
    slug = view.phase.slug
    c = score.contribution
    out: list[Reason] = []

    def add(code: str, features: tuple[str, ...], facts: tuple[str, ...], **params: object) -> None:
        tpl = cat.template(code)
        out.append(
            Reason(
                factor=tpl.factor,
                code=code,
                text=_render(cat, code, **params),
                fact_ids=facts,
                features=features,
                contribution=sum(c(f) for f in features),
            )
        )

    p = view.progress
    tu = view.time_used_pct
    window = view.window
    progress_fact = (
        world.fact(slug, "qpr.progress", quarter=p.filing.quarter) if p is not None else None
    )
    register_fact = world.fact(slug, "qpr.filing_record")
    merged_late = False

    # Finances: cash vs concrete.
    if p is not None and p.sold_pct is not None:
        add(
            "FIN_SOLD_AHEAD_BUILT",
            ("sold_minus_built_pct",),
            _ids(progress_fact),
            sold=p.sold_pct,
            built=p.built_pct,
        )

    # Timeline: progress against the promised time.
    if p is not None and tu is not None:
        time_fact = world.fact(slug, "progress.time_used_pct")
        gap = ("time_used_minus_built_pct",)
        if view.extensions:
            ext_facts = [
                world.fact(slug, "registration.extension", seq=e.seq) for e in view.extensions
            ]
            add(
                "TIM_BUILT_VS_TIME_EXTENSIONS",
                (*gap, "extensions"),
                _ids(progress_fact, time_fact, *ext_facts),
                built=p.built_pct,
                time_used=tu,
                extensions=len(view.extensions),
            )
        elif tu >= 100:
            add(
                "TIM_PAST_ORIGINAL_DATE",
                gap,
                _ids(world.fact(slug, "registration.dates"), progress_fact),
                month=fmt_month(view.registration.original_completion),
                built=p.built_pct,
            )
        elif view.sold_reported and window.late:
            # Built% is already in the finances reason: state time used with the late count.
            merged_late = True
            add(
                "TIM_TIME_USED_LATE_QPRS",
                (*gap, "late_filings_last_8"),
                _ids(register_fact),
                time_used=tu,
                late=len(window.late),
            )
        else:
            add(
                "TIM_BUILT_VS_TIME",
                gap,
                _ids(progress_fact, time_fact),
                built=p.built_pct,
                time_used=tu,
            )

    # Timeline: filing discipline.
    if not merged_late and window.rows:
        late_feature = ("late_filings_last_8",)
        if not window.late and not window.built_drops and window.full:
            add("TIM_QPR_ON_TIME", late_feature, _ids(register_fact), n=len(window.rows))
        elif len(window.late) == 1:
            f = window.late[0]
            add(
                "TIM_QPR_LATE",
                late_feature,
                _ids(world.fact(slug, "qpr.filing_status", quarter=f.quarter)),
                quarter=fmt_quarter(f.quarter),
                days=f.days_late,
            )
        elif len(window.late) >= 2 and tu is not None:
            add(
                "TIM_TIME_USED_LATE_QPRS",
                late_feature,
                _ids(register_fact),
                time_used=tu,
                late=len(window.late),
            )

    if window.missing:
        m = window.missing[0]
        add(
            "TIM_QPR_MISSING",
            ("missing_qprs",),
            _ids(world.fact(slug, "qpr.missing", quarter=m.quarter)),
            quarter=fmt_quarter(m.quarter),
            due=fmt_date(m.due_on),
        )

    # Legal.
    cc = view.complaints
    if (
        cc is not None
        and view.complaints_per_100 is not None
        and cc.median_count_similar is not None
    ):
        add(
            "LEG_COMPLAINTS",
            ("complaints_per_100_units",),
            _ids(world.fact(slug, "orders.complaints_against_promoter_24m")),
            count=cc.count_24m,
            rate=_pct(view.complaints_per_100),
            median=cc.median_count_similar,
        )

    # Track record.
    tr = view.track
    if tr is not None and tr.finished > 0:
        add(
            "TRK_GROUP_LATE12",
            ("group_late12_pct",),
            _ids(world.fact(tr.group.slug, "track_record.late12")),
            late=tr.late,
            finished=tr.finished,
        )

    # Site.
    st = view.stall
    if st is not None:
        add(
            "SITE_STALL",
            ("stall",),
            _ids(*(world.fact(slug, "qpr.progress", quarter=f.quarter) for f in st.filings)),
            n=len(st.filings),
            built=st.built_pct,
            **{
                "from": fmt_quarter(st.filings[0].quarter),
                "to": fmt_quarter(st.filings[-1].quarter),
            },
        )
    return out


def red_flag_reasons(
    hits: Sequence[RedFlagHit],
    view: PhaseView,
    world: World,
    cat: ReasonCatalogue,
    flags: RedFlagCatalogue,
) -> list[Reason]:
    out: list[Reason] = []
    for hit in hits:
        rule = flags.rule(hit.rule_code)
        if rule.reason_code is None:
            continue
        facts = _ids(*(world.fact(e.developer, "insolvency.admitted") for e in hit.insolvency))
        tpl = cat.template(rule.reason_code)
        out.append(
            Reason(
                factor=tpl.factor,
                code=rule.reason_code,
                text=_render(
                    cat, rule.reason_code, group=view.group.name, date=fmt_date(hit.triggered_on)
                ),
                fact_ids=facts,
                features=(),
                contribution=None,
            )
        )
    return out


def rank(red_flag: Sequence[Reason], scored: Sequence[Reason]) -> list[Reason]:
    """Red-flag reasons first, then the largest |contribution|; ties by factor weight order."""
    usable = [
        r for r in scored if r.fact_ids and r.contribution is not None and abs(r.contribution) > EPS
    ]
    usable.sort(key=lambda r: (-abs(r.contribution or 0.0), FACTORS.index(r.factor), r.code))
    chosen = [r for r in red_flag if r.fact_ids] + usable
    return chosen[:MAX_REASONS]
