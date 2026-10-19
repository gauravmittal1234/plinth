"""Human-readable traces: `--emit explain` and `--replay-audit`.

Interpretability is the product: every band must trace to bins, contributions and sourced
reasons. These traces show the internal values the published document leaves out.
"""

from __future__ import annotations

from .assess import Assessment, assess
from .dates import fmt_date, iso_ist
from .fixture_world import Ledger
from .model import BAND_LABELS, FACTORS, load_model, load_reasons, load_red_flags
from .runs import ScoringResult
from .world import World, ref_instant


def _band(a: Assessment) -> str:
    if a.band is None:
        return a.state.value.replace("_", " ")
    by = "red-flag rule " + (a.rule_code or "") if a.rule_code else "model"
    return f"{BAND_LABELS[a.band]} (set by {by})"


def _freq(a: Assessment) -> str:
    f = a.frequency
    if f is None:
        return "no frequency"
    if f.point is not None:
        return f"About {f.point} of 100"
    return f"Between {f.low} and {f.high} of 100"


def explain_assessment(a: Assessment, *, label: str = "") -> list[str]:
    s = a.score
    lines = [
        f"{a.phase.name} ({a.phase.slug}){label}",
        f"  {_band(a)} · confidence {a.confidence.value if a.confidence else '-'} · {_freq(a)}"
        f" · stall {'yes' if a.stall else 'no'} · stale {'yes' if a.stale else 'no'}",
        f"  p(Late12) {s.p_late12:.3f} · logit {s.logit:+.3f}"
        f" = intercept {a.model.scorecard.intercept:+.2f}"
        f" + contributions {s.logit - a.model.scorecard.intercept:+.2f}",
        f"  {'feature':27} {'value':>15}  {'bin':42} {'contrib':>7}  factor",
    ]
    for c in s.contributions:
        v = (
            "-"
            if c.value is None
            else (f"{c.value:.1f}" if isinstance(c.value, float) else str(c.value))
        )
        lines.append(
            f"  {c.feature:27} {v:>15}  {(c.bin_label or 'not on record'):42}"
            f" {c.contribution:+7.2f}  {c.factor}"
        )
    if a.reasons:
        lines.append("  reasons (ranked by |contribution|; a red-flag reason first)")
        for i, r in enumerate(a.reasons, 1):
            contrib = "rule" if r.contribution is None else f"{r.contribution:+.2f}"
            lines.append(f"   {i}. [{r.factor}, {contrib}] {r.text}")
            lines.append(f"      facts: {', '.join(r.fact_ids)}")
    if a.what_would_change:
        lines.append(f"  what would change: {a.what_would_change}")
    late = a.view.late12
    lines.append(
        f"  Late12: original {late.original_completion:%b %Y} + {late.blanket_extension_months}"
        f" months blanket + 12 -> OC after {late.late_after:%b %Y}"
    )
    return lines


def explain(result: ScoringResult) -> str:
    m = result.model
    spreads = m.factor_spreads()
    total = sum(spreads.values())
    shares = ", ".join(f"{f} {100 * spreads[f] / total:.0f}" for f in FACTORS)
    lines = [
        f"Delivery Risk {m.version} · data as of {fmt_date(result.as_of)}"
        f" · clock {iso_ist(result.clock)}",
        f"Factor weights from the scorecard's spreads: {shares}",
        "",
    ]
    for slug, a in result.assessments.items():
        lines.extend(explain_assessment(a))
        b = result.proposals.get(slug)
        if b is not None:
            run = result.pending_run(slug)
            lines.append(
                f"  watch pass at the clock: proposes {_band(b)}"
                + (f", run {run.id} ({run.status})" if run else "")
            )
            changed = [
                f"{c.feature} {d.contribution:+.2f} -> {c.contribution:+.2f}"
                for c, d in zip(b.score.contributions, a.score.contributions, strict=True)
                if abs(c.contribution - d.contribution) > 1e-9
            ]
            lines.append(f"    p(Late12) {b.score.p_late12:.3f}; changed: {'; '.join(changed)}")
        lines.append("")
    for n in result.notices:
        lines.append(
            f"notice {n.kind} {n.phase}: {n.from_band.value} -> {n.to_band.value},"
            f" sent {fmt_date(n.sent_on)}, effective {fmt_date(n.effective_on)} ({n.status}):"
            f" {n.reason_text}"
        )
    for x in result.rescoring:
        lines.append(
            f"re-score {x.phase} {x.quarter}: fetched {iso_ist(x.fetched_at)},"
            f" due by {iso_ist(x.due_by)} ({x.status})"
        )
    for s in result.stale:
        lines.append(
            f"stale {s.phase}: latest QPR {s.latest_quarter} filed {fmt_date(s.latest_filed_on)},"
            f" {s.age_days_on_clock} days old on the clock (line {s.stale_after_days})"
        )
    return "\n".join(lines) + "\n"


def replay_audit(world: World, ledger: Ledger) -> str:
    """Re-run each ledger run's own model on the facts on record at its cutoff.

    A difference is expected where the canonical facts lack the inputs of the day (for
    example complaint counts before 9 Oct 2026); it is reported, never written back.
    """
    cat, flags = load_reasons(), load_red_flags()
    lines = [
        "Replay audit: each published run re-scored by its own model on the facts on record"
        " at its cutoff.",
        f"{'phase':26} {'model':5} {'cutoff':10}  {'recorded':22} {'replayed':22} result",
    ]
    agree = 0
    for r in ledger.runs:
        m = load_model(r.model_version)
        a = assess(world, world.phase(r.phase), ref_instant(r.data_cutoff), m, cat, flags)
        rec = (
            r.state.value,
            r.band.value if r.band else "-",
            r.confidence.value if r.confidence else "-",
        )
        rep = (
            a.state.value,
            a.band.value if a.band else "-",
            a.confidence.value if a.confidence else "-",
        )
        same = rec == rep
        agree += same
        lines.append(
            f"{r.phase:26} {r.model_version:5} {r.data_cutoff.isoformat():10}"
            f"  {'/'.join(rec):22} {'/'.join(rep):22} {'agrees' if same else 'differs'}"
        )
    lines.append(f"{agree} of {len(ledger.runs)} agree.")
    return "\n".join(lines) + "\n"
