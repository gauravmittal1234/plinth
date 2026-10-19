// Expected (golden) outputs of the M1 reads, built from the canonical fixtures.
// Shapes follow API_CONTRACTS.md §2 and §4. Risk copy is final here: clients never compose it.
import {
  addMonths,
  daysBetween,
  fmtDate,
  fmtMonth,
  fmtQuarter,
  groupIN,
  inrExact,
  inrShort,
} from "./lib.mjs";
import { BANDS } from "./scoring.mjs";

export const NOW = "2026-10-18T12:00:00+05:30";
const TODAY = "2026-10-18";
const BASE = "https://plinth.in";
const HARERA = { code: "harera_ggm", name: "HARERA Gurugram", url: "https://haryanarera.gov.in" };
const DISCLAIMER =
  "Our opinion, based on public records. Not a credit rating. Not issued by any RERA.";
const PROMISE = "No developer pays us. Ever.";
const REF_CLASS = "Gurugram RERA phases registered 2017–2021 (illustrative backtest).";
const OC_NOT_KEYS =
  "The OC is not the keys. Possession comes after it: the developer offers it, you pay the last 5% and register the sale deed.";
const RULE_LINE = "Same corridor, lower band, all-in within 20%. Nobody pays to appear.";
const FACTOR_LABEL = {
  finances: "Finances",
  timeline: "Timeline",
  legal: "Legal",
  track_record: "Track record",
  site: "Site",
};
const AH2 = "aurelia-heights-phase-2";

const NF_LESS_CERTAIN =
  "We're less certain about this one. Northfield has only 6 finished RERA projects to learn from, so we show a range, not one number.";
export const PHASE_COPY = {
  [AH2]: {
    locality_line: "Sector 37D, Dwarka Expressway",
    image: "/media/heroAurelia.jpg",
    confidence_line: NF_LESS_CERTAIN,
    getting_around: [
      "Dwarka Expressway: 0.8 km",
      "Cyber City: 18 km, 35–55 min at 9 am",
      "IGI Airport T3: 22 km, 30–45 min",
      "Schools: 3 within 3 km · metro: none within 5 km",
    ],
    commute: "18 km, 35–55 min",
  },
  "kestrel-park": {
    locality_line: "Sector 113, Dwarka Expressway",
    image: "/media/heroKestrel.jpg",
    confidence_line:
      "We're more certain about this one. Orbis Land has 9 finished RERA projects to learn from.",
    getting_around: ["Cyber City: 19 km, 35–50 min at 9 am", "IGI Airport T3: 13 km, 20–30 min"],
    commute: "19 km, 35–50 min",
  },
  "sapphire-grove-phase-1": {
    locality_line: "Sector 106, Dwarka Expressway",
    image: "/media/heroSapphire.jpg",
    confidence_line:
      "We're more certain about this one. Meridian Habitat has 11 finished RERA projects to learn from.",
    getting_around: ["Cyber City: 20 km, 40–60 min at 9 am", "IGI Airport T3: 16 km, 25–40 min"],
    commute: "20 km, 40–60 min",
  },
  "coral-towers": {
    locality_line: "Sector 89, New Gurugram",
    image: "/media/heroCoral.jpg",
    confidence_line:
      "We're less certain about this one. Vantage Buildcon's record is short, and the old building figures widen the range.",
    getting_around: ["Cyber City: 24 km, 45–70 min at 9 am", "IGI Airport T3: 27 km, 40–60 min"],
    commute: "24 km, 45–70 min",
  },
  "laurel-residency": {
    locality_line: "Sector 92, New Gurugram",
    image: "/media/heroLaurel.jpg",
    confidence_line: null,
    getting_around: null,
    commute: null,
  },
  "juniper-enclave": {
    locality_line: "Sector 102, Dwarka Expressway",
    image: "/media/heroJuniper.jpg",
    confidence_line: null,
    getting_around: ["Cyber City: 19 km, 40–55 min at 9 am", "IGI Airport T3: 15 km, 25–35 min"],
    commute: "19 km, 40–55 min",
  },
  "heron-point-phase-2": {
    locality_line: "Sector 104, Dwarka Expressway",
    image: "/media/heroHeron.jpg",
    confidence_line: null,
    getting_around: null,
    commute: null,
  },
  "cedar-walk-phase-2": {
    locality_line: "Sector 99, Dwarka Expressway",
    image: null,
    confidence_line: NF_LESS_CERTAIN,
    getting_around: null,
    commute: null,
  },
};
export const SLUGS = Object.keys(PHASE_COPY);
export const GROUP_SLUGS = [
  "northfield-estates",
  "orbis-land",
  "meridian-habitat",
  "vantage-buildcon",
  "elmstone-developers",
  "halcyon-homes",
];

const NEXT = {
  low: [
    [
      "Keep to 10% until the agreement is registered.",
      "That is the RERA limit before an agreement for sale (s.13).",
    ],
    [
      "Pay only for stages on record.",
      "Check every demand letter against the latest QPR with Pay-as-built.",
    ],
    ["Follow it.", "We tell you the day a QPR is late or the band moves."],
  ],
  moderate: [
    ["Ask for it in writing.", "The CA certificate on escrow withdrawals, filed with each QPR."],
    [
      "Prefer a plan that pays as it's built.",
      "Construction-linked, and only for stages on record.",
    ],
    ["Keep a rent buffer.", "About 12 months of rent and pre-EMI, in case keys come late."],
    ["Follow it.", "Late filings and new orders reach you first."],
  ],
  elevated: [
    [
      "Ask for it in writing.",
      "The slab schedule for your tower, and the CA certificate on escrow withdrawals with the latest QPR.",
    ],
    [
      "Prefer a plan that pays as it's built.",
      "Construction-linked, and only for stages on record. Tower A is at slab 9, but a demand for slab 12 went out on 10 Oct 2026.",
    ],
    [
      "Keep a rent buffer.",
      "If keys come 12 months after Dec 2027, rent and pre-EMI cost about ₹24.1 L more on our default loan.",
    ],
    [
      "Watch the next QPR.",
      "Jul–Sep 2026 is not on HARERA yet. If it is still missing on 25 Oct 2026, this band may change.",
    ],
  ],
  high: [
    [
      "Ask for it in writing.",
      "The slab schedule, the CA escrow certificate and any extension application.",
    ],
    [
      "Pay no more than the law allows.",
      "10% before a registered agreement; after that, only stages on record.",
    ],
    ["Keep a longer buffer.", "About 24 months of rent and pre-EMI, in case keys come late."],
    [
      "Read the complaint orders.",
      "They show what buyers before you went through, and what HARERA decided.",
    ],
  ],
  severe: [
    ["Read the reason first.", "A published rule or the record sets this band. Open its source."],
    [
      "If you've paid already,",
      "your RERA rights to a refund or delay interest still stand. See “If you've already booked here”.",
    ],
    [
      "Before paying anything more,",
      "ask for the project's status in writing, and keep every receipt.",
    ],
  ],
};
const CHECKS = {
  "juniper-enclave": [
    [
      "Who is behind it",
      "Halcyon Homes' directors, and their other companies in MCA filings.",
      "MCA company records",
    ],
    [
      "The licence",
      "The DTCP licence for the Sector 102 site, and that it is in force.",
      "DTCP licence register",
    ],
    [
      "The escrow account",
      "A CA certificate with each QPR on money taken out of the project account.",
      "HARERA Form 3 · with each QPR",
    ],
    [
      "Progress against time",
      "9% built with 31% of the time used. Watch that the gap doesn't widen.",
      "HARERA QPR · latest",
    ],
  ],
  "heron-point-phase-2": [
    [
      "The group's record",
      "2 of 6 finished projects late. Its ongoing phases: Aurelia Heights, Phase 2 (Elevated) and Cedar Walk, Phase 2 (Moderate).",
      "HARERA + DTCP OC records",
    ],
    [
      "The registration",
      "Approved plans, the DTCP licence and the promised date, all filed with HARERA.",
      "HARERA registration · Apr 2026",
    ],
    [
      "The escrow account",
      "A CA certificate with each QPR on money taken out of the project account.",
      "HARERA Form 3 · with each QPR",
    ],
    [
      "The first QPRs",
      "Due 15 days after each quarter ends. They show whether building starts on time.",
      "HARERA QPR register",
    ],
  ],
};
const HERO_SUMMARY = {
  [AH2]: "Delivery risk: Elevated · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027",
  "kestrel-park": "Delivery risk: Low · All-in ₹2.44 Cr · 63% built · Original completion Nov 2028",
  "sapphire-grove-phase-1":
    "Delivery risk: Moderate, re-scoring now · 48% built · 55% of the time used · Original completion Mar 2028",
  "coral-towers":
    "Delivery risk: High · Stale data, progress 187 days old · 22% built · Original completion Aug 2028, extended to Aug 2029",
  "laurel-residency":
    "Delivery risk: Severe, set by a published rule · Stall flag · 34% built · Original completion Jun 2026, passed",
  "juniper-enclave":
    "Delivery risk: Limited history, not enough history to score · no penalty · 9% built · 31% of the time used · Original completion Dec 2029",
  "heron-point-phase-2":
    "Delivery risk: Not scored yet · Registered Apr 2026 · Original completion Apr 2031",
  "cedar-walk-phase-2":
    "Delivery risk: Moderate · 70% built · 92% of the time used · Original completion Mar 2027",
};
const SEARCH_NOTE = {
  [AH2]: "Since 2 Oct 2026. We're less certain about this one.",
  "kestrel-park": "Delivery risk · as of 14 Oct 2026",
  "sapphire-grove-phase-1": "Delivery risk · as of 14 Oct 2026",
  "coral-towers": "2 extensions. We're less certain about this one.",
  "laurel-residency": "Red-flag rule · NCLT order, 12 Mar 2023",
  "juniper-enclave": "Not enough history to score. No penalty.",
  "heron-point-phase-2": "Registered Apr 2026, less than 6 months ago.",
  "cedar-walk-phase-2": "Delivery risk · as of 14 Oct 2026. We're less certain about this one.",
};

export function makeExpected(cat, ev, sc, dc, vectors) {
  const phase = (slug) => cat.phases.find((p) => p.slug === slug);
  const group = (slug) => cat.developer_groups.find((g) => g.slug === slug);
  const project = (slug) => cat.projects.find((p) => p.slug === slug);
  const reg = (slug) => cat.rera_registrations.find((r) => r.phase === slug) ?? null;
  const factByKey = (key) => ev.facts.find((f) => f.key === key) ?? null;
  const factById = (id) => ev.facts.find((f) => f.id === id);
  const run = (slug) => sc.runs.find((r) => r.phase === slug && r.status === "published");
  const reasonsOf = (r) => sc.reasons.filter((x) => x.run === r.id).sort((a, b) => a.rank - b.rank);
  const filings = (slug) => cat.qpr_filings.filter((f) => f.phase === slug);
  const complaints = (subject) => cat.complaint_counts.find((c) => c.subject === subject) ?? null;
  const groupOf = (slug) => group(project(phase(slug).project).group);
  const allIn = (slug) => factByKey(`${slug}/price/all-in-3bhk`)?.value.all_in_inr ?? null;

  const bandSince = (slug) => {
    const r = run(slug);
    const hist = sc.band_history
      .filter((h) => h.phase === slug)
      .sort((a, b) => a.from_date.localeCompare(b.from_date));
    let since = null;
    for (let i = hist.length - 1; i >= 0; i--) {
      if (hist[i].band === r.band && hist[i].state === r.state) since = hist[i].from_date;
      else break;
    }
    return since;
  };
  const sourceLabel = (f) => {
    switch (f.attribute) {
      case "qpr.progress":
        return `HARERA QPR · ${fmtQuarter(f.value.quarter)}`;
      case "qpr.filing_record":
      case "qpr.filing_status":
      case "qpr.missing":
        return "HARERA QPR register";
      case "orders.complaints_against_promoter_24m":
        return "HARERA orders · 24 months";
      case "track_record.late12":
        return "HARERA · DTCP OC records";
      case "progress.time_used_pct":
      case "registration.dates":
      case "registration.collection_account":
      case "registration.extensions":
      case "tower.floors_planned":
        return "HARERA registration";
      case "registration.extension":
        return `HARERA order · Extension ${f.value.seq} · ${f.value.granted.length === 7 ? fmtMonth(f.value.granted) : fmtDate(f.value.granted)}`;
      case "insolvency.admitted":
        return "IBBI · NCLT order 12 Mar 2023";
      case "insolvency.search":
        return "IBBI · NCLT search";
      case "completion.oc":
        return `DTCP OC order · ${fmtMonth(f.value.oc)}`;
      default:
        return f.attribute;
    }
  };
  const sourceAsOf = (f) => (f.attribute === "progress.time_used_pct" ? "2026-10-14" : f.as_of);
  const sourceRefs = (factIds) => {
    const groups = [];
    for (const fid of factIds) {
      const f = factById(fid);
      const label = sourceLabel(f);
      let g = groups.find((x) => x.label === label);
      if (!g) {
        g = {
          label,
          fact_ids: [],
          evidence_url: `/evidence/${fid}`,
          official_url: HARERA.url,
          as_of: sourceAsOf(f),
        };
        groups.push(g);
      }
      g.fact_ids.push(fid);
      if (sourceAsOf(f) > g.as_of) g.as_of = sourceAsOf(f);
    }
    return groups;
  };
  const sourceRefKeys = (keys) => sourceRefs(keys.map((k) => factByKey(k).id));

  const chipFor = (r, withheld = false) => {
    if (withheld)
      return { kind: "withheld", label: "Band withheld · facts only", step: null, meter_filled: 0 };
    if (r.state === "limited_history")
      return {
        kind: "limited_history",
        label: "Not enough history to score · no penalty",
        step: null,
        meter_filled: 0,
      };
    if (r.state === "not_scored")
      return { kind: "not_scored", label: "Not scored", step: null, meter_filled: 0 };
    const b = BANDS[r.band];
    return { kind: "band", label: b.label, step: b.step, meter_filled: b.step };
  };
  const freqShort = (r) =>
    r.freq_kind === "point"
      ? `About ${r.freq_point} of 100`
      : `Between ${r.freq_low} and ${r.freq_high} of 100`;
  const freqOf = (r) => {
    if (!r.freq_kind) return null;
    const sentence = `${freqShort(r)} similar Gurugram projects got their OC more than 12 months after the original RERA date.`;
    if (r.freq_kind === "point")
      return {
        kind: "point",
        low: r.freq_point,
        high: r.freq_point,
        sentence,
        reference_class_line: REF_CLASS,
        icon_array: { filled: r.freq_point, hatched: 0, empty: 100 - r.freq_point },
        hatch_legend: null,
      };
    const h = r.freq_high - r.freq_low;
    return {
      kind: "range",
      low: r.freq_low,
      high: r.freq_high,
      sentence,
      reference_class_line: REF_CLASS,
      icon_array: { filled: r.freq_low, hatched: h, empty: 100 - r.freq_high },
      hatch_legend: `Hatched: the ${h} of 100 we're less certain about`,
    };
  };
  const late12Of = (slug) => {
    const g = reg(slug);
    if (!g) return null;
    const orig = g.original_completion.slice(0, 7);
    const blanket = cat.blanket_extensions[0];
    const months = g.original_completion >= blanket.applies_from_completion ? blanket.months : 0;
    const lateAfter = addMonths(orig, months + 12);
    return {
      original_completion: orig,
      blanket_extension_months: months,
      late_after: lateAfter,
      line: `Original completion ${fmtMonth(orig)}. More than 12 months late here means an OC after ${fmtMonth(lateAfter)}, with the 4-month blanket extension of Jul 2026.`,
      oc_not_keys_line: OC_NOT_KEYS,
    };
  };
  const timeUsed = (slug) => factByKey(`${slug}/time-used`)?.value ?? null;
  const latestScoredFiling = (slug) => {
    const fs = filings(slug)
      .filter((f) => f.built_pct != null)
      .sort((a, b) => a.quarter.localeCompare(b.quarter));
    return fs[fs.length - 1] ?? null;
  };
  const builtPct = (slug) =>
    latestScoredFiling(slug)?.built_pct ?? factByKey(`${slug}/progress`)?.value ?? null;
  const soldPct = (slug) => latestScoredFiling(slug)?.sold_pct ?? null;
  const priceOf = (slug) => {
    if (slug === "heron-point-phase-2")
      return {
        all_in_inr: null,
        all_in_label: null,
        quoted_label: null,
        per_sqft_carpet_label: null,
        basis_line: null,
        display_line: "No price list with us",
      };
    const q = factByKey(`${slug}/price/quoted-3bhk`);
    if (!q) return null;
    const a = factByKey(`${slug}/price/all-in-3bhk`);
    const quoted = inrShort(q.value.base_price_inr);
    if (!a)
      return {
        all_in_inr: null,
        all_in_label: null,
        quoted_label: quoted,
        per_sqft_carpet_label: null,
        basis_line: "3 BHK quoted price · no cost sheet with us",
        display_line: `Quoted ${quoted} · all-in not known yet`,
      };
    const u = cat.unit_types.find((x) => x.phase === slug && x.label === "3 BHK");
    const basis =
      slug === AH2
        ? "3 BHK, 1,450 sq ft carpet, park-facing · cost sheet of 2 Oct 2026"
        : `3 BHK, ${groupIN(u.carpet_sqft)} sq ft carpet · developer cost sheet`;
    return {
      all_in_inr: a.value.all_in_inr,
      all_in_label: inrShort(a.value.all_in_inr),
      quoted_label: quoted,
      per_sqft_carpet_label: `${inrExact(a.value.per_sqft_carpet_inr)} per sq ft carpet`,
      basis_line: basis,
      display_line: `${inrShort(a.value.all_in_inr)} all-in · quoted ${quoted}`,
    };
  };
  const complaintsOf = (slug) => {
    const c = complaints(slug);
    if (!c) return null;
    return {
      count_24m: c.count_24m,
      per_100_units: c.per_100_units,
      units_base: c.units_base,
      median_count_similar: c.median_count_similar,
      line: `${c.count_24m} complaints · ${c.per_100_units} per 100 units`,
    };
  };
  const claimOf = (g) =>
    g.claim_state === "claimed"
      ? { state: "claimed", line: "claimed developer page, replies here", since: g.claimed_on }
      : {
          state: "invited",
          line: `invited ${fmtDate(g.invited_on)} · not yet claimed`,
          since: g.invited_on,
        };

  const pendingOf = (slug, factsOnly = false) => {
    if (slug === AH2) {
      const claim = dc.developer_claims[0];
      const notice = sc.band_notices.find((n) => n.kind === "notice_7day");
      return [
        {
          code: "qpr_missing",
          line: "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.",
          since: "2026-10-15",
          developer_says: {
            text: claim.text,
            verified: false,
            said_on: claim.said_on,
            check_by: claim.check_by,
            line: "Developer says: filed 12 Oct, not yet verified.",
          },
          marker_line: factsOnly ? null : notice.public_marker_text,
        },
      ];
    }
    if (slug === "sapphire-grove-phase-1")
      return [
        {
          code: "rescore_due",
          line: "The Jul–Sep 2026 QPR was filed 15 Oct and fetched 16 Oct, 7:40 pm. We update this by 19 Oct 2026, 7:40 pm.",
          since: "2026-10-16",
          developer_says: null,
          marker_line:
            "If the new figures move the band, followers hear first, with what changed and why.",
        },
      ];
    if (slug === "coral-towers")
      return ["2026-Q2", "2026-Q3"].map((q) => {
        const f = cat.qpr_filings.find((x) => x.phase === slug && x.quarter === q);
        return {
          code: "qpr_missing",
          line: `The ${fmtQuarter(q)} QPR is not on HARERA yet. It was due ${fmtDate(f.due_on)}.`,
          since: f.due_on,
          developer_says: null,
          marker_line: null,
        };
      });
    if (slug === "heron-point-phase-2")
      return [
        {
          code: "not_enough_reports",
          line: "Registered 28 Apr 2026, less than 6 months ago. We score once there are enough quarterly reports to compare building with time.",
          since: "2026-04-28",
          developer_says: null,
          marker_line: null,
        },
      ];
    return [];
  };
  const progressOf = (slug) => {
    const built = builtPct(slug);
    const sold = soldPct(slug);
    const tu = timeUsed(slug);
    const lf = latestScoredFiling(slug);
    const latest = lf
      ? {
          quarter: lf.quarter,
          label: fmtQuarter(lf.quarter),
          filed_on: lf.filed_on,
          age_days: lf.filed_on ? daysBetween(lf.filed_on, TODAY) : null,
        }
      : null;
    let line = null;
    if (slug === "heron-point-phase-2")
      line = "Registered Apr 2026 · 10% of the promised time used";
    else if (built != null && tu != null) {
      line = `${built}% built · ${tu}% of the promised time used`;
      if (sold != null) line += ` · ${sold}% sold`;
      if (slug === "coral-towers") line += ` · progress ${latest.age_days} days old`;
    }
    return { built_pct: built, sold_pct: sold, time_used_pct: tu, latest_qpr: latest, line };
  };
  const shareOf = (slug, r, withheld = false) => {
    const p = phase(slug);
    const prog = progressOf(slug);
    const progLine =
      prog.built_pct != null && prog.time_used_pct != null
        ? `${prog.built_pct}% built with ${prog.time_used_pct}% of the promised time used.`
        : null;
    let lines;
    let alt;
    if (withheld) {
      lines = [
        "Delivery risk: band withheld · facts only",
        "Band withheld pending review, from 18 Oct 2026.",
        progLine,
      ];
      alt = `${p.name}: delivery risk band withheld pending review. Facts only.`;
    } else if (r.state === "limited_history") {
      lines = [
        "Delivery risk: not enough history to score · no penalty",
        "Halcyon Homes has no finished RERA project yet.",
        progLine,
      ];
      alt = `${p.name}: not enough history to score, no penalty.`;
    } else if (r.state === "not_scored") {
      lines = [
        "Delivery risk: not scored yet, registered Apr 2026",
        "Part of the Northfield Estates group: 2 of its 6 finished RERA projects got OC more than 12 months late.",
        "Original completion Apr 2031.",
      ];
      alt = `${p.name}: not scored yet, registered Apr 2026.`;
    } else if (r.set_by === "red_flag_rule") {
      lines = [
        "Delivery risk: Severe, set by red-flag rule 1",
        "A group company of Elmstone Developers was admitted to insolvency (NCLT order, 12 Mar 2023).",
        "34% built. The original date, Jun 2026, has passed.",
      ];
      alt = `${p.name}: Delivery risk Severe, set by red-flag rule 1, not our model.`;
    } else {
      const label = BANDS[r.band].label;
      lines = [
        `Delivery risk: ${label}`,
        `${freqShort(r)} similar Gurugram projects got their OC more than 12 months late.`,
        progLine,
      ];
      alt = `${p.name}: Delivery risk ${label}. ${freqShort(r)} similar projects were more than 12 months late.`;
    }
    return {
      card_url: `${BASE}/cards/risk/${slug}.png?run=${r.id}`,
      card_alt: alt,
      lines: lines.filter(Boolean),
      source_line: "HARERA records · data as of 14 Oct 2026 · v1.2",
      caption: "Plinth · No developer pays us. Ever.",
    };
  };
  const metaOf = (slug, r) => ({
    data_as_of: "2026-10-14",
    model_version: "v1.2",
    score_run_id: r.id,
    generated_at: NOW,
    methodology_url: "/methodology",
    disclaimer_line: DISCLAIMER,
    promise_line: PROMISE,
    live_url: `${BASE}/gurugram/projects/${slug}`,
    short_url: dc.live_record_links.find((l) => l.phase === slug)?.short_url ?? null,
  });

  // ---------------------------------------------------------------- RiskSummary
  const riskSummary = (slug, { factsOnly = false } = {}) => {
    const p = phase(slug);
    const r = run(slug);
    const g = groupOf(slug);
    const copy = PHASE_COPY[slug];
    const scored = r.state === "scored" && !factsOnly;
    const overlays = [];
    if (!factsOnly) {
      if (r.stale) overlays.push("stale");
      if (sc.rescoring.some((x) => x.phase === slug)) overlays.push("rescoring");
      if (r.stall) overlays.push("stalled");
      if (sc.band_notices.some((n) => n.phase === slug && n.status === "pending"))
        overlays.push("pending_change");
    }
    const band = scored
      ? {
          code: r.band,
          label: BANDS[r.band].label,
          step: BANDS[r.band].step,
          since: bandSince(slug),
          set_by: r.set_by,
          rule:
            r.set_by === "red_flag_rule"
              ? {
                  code: r.rule_code,
                  line: "Set by red-flag rule 1, not our model: a group company was admitted to insolvency (NCLT order, 12 Mar 2023).",
                }
              : null,
        }
      : null;
    const reply = dc.developer_replies.find((x) => x.phase === slug);
    return {
      schema: "plinth.risk_summary/1",
      phase: {
        slug,
        name: p.name,
        short_code: p.short_code,
        rera_number: reg(slug)?.rera_number ?? null,
        authority: HARERA,
        locality_line: copy.locality_line,
        units: p.units_total,
        developer: { slug: g.slug, name: g.name, claim: claimOf(g) },
      },
      display: { state: factsOnly ? "facts_only" : r.state, overlays, bands_public: true },
      band,
      chip: chipFor(r, factsOnly),
      confidence:
        scored && r.confidence
          ? {
              level: r.confidence,
              dots: r.confidence === "high" ? 2 : 1,
              line: copy.confidence_line,
            }
          : null,
      frequency: scored ? freqOf(r) : null,
      late12: late12Of(slug),
      reasons: scored
        ? reasonsOf(r).map((x) => ({
            rank: x.rank,
            factor: x.factor,
            factor_label: FACTOR_LABEL[x.factor],
            text: x.text,
            sources: sourceRefs(x.fact_ids),
          }))
        : [],
      what_would_change: factsOnly ? null : r.what_would_change,
      pending: pendingOf(slug, factsOnly),
      developer_response: reply
        ? {
            text: reply.text,
            signatory_title: reply.signatory_title,
            published_on: reply.published_on,
            check_by: reply.check_by,
            line: `Developer says · not yet verified · ${fmtDate(reply.published_on)} · we check it by ${fmtDate(reply.check_by)}`,
          }
        : null,
      progress: progressOf(slug),
      price: priceOf(slug),
      complaints: complaintsOf(slug),
      withheld: factsOnly
        ? {
            since: "2026-10-18",
            line: "Band withheld pending review, from 18 Oct 2026",
            explainer_line:
              "We're not showing a band for this project while a court considers an application about our bands for the Northfield Estates group.",
            explainer_url: "/gurugram/developers/northfield-estates#facts-only",
          }
        : null,
      meta: metaOf(slug, r),
      share: shareOf(slug, r, factsOnly),
    };
  };

  // ---------------------------------------------------------------- ProjectPage
  const baseRateLine = (r) => {
    const s = "About 36 of 100 Gurugram projects got their OC more than 12 months late.";
    if (r.state !== "scored") return s;
    const where = {
      low: "sits below that",
      moderate: "sits below that",
      elevated: "sits around that",
      high: "sits above that",
      severe: "sits above that",
    }[r.band];
    return `${s} ${BANDS[r.band].label} ${where}.`;
  };
  const lowerBandNearby = (slug) => {
    const r = run(slug);
    const p = phase(slug);
    const mine = allIn(slug);
    if (r.state !== "scored" || !p.corridor || mine == null) return [];
    return SLUGS.filter((s) => s !== slug)
      .map((s) => ({ s, r: run(s), p: phase(s), a: allIn(s) }))
      .filter(
        (x) =>
          x.r.state === "scored" &&
          x.p.corridor === p.corridor &&
          BANDS[x.r.band].step < BANDS[r.band].step &&
          x.a != null &&
          Math.abs(x.a - mine) / mine <= 0.2,
      )
      .sort((a, b) => BANDS[a.r.band].step - BANDS[b.r.band].step)
      .map((x) => ({
        slug: x.s,
        name: x.p.name,
        chip: chipFor(x.r),
        price_line: `${inrShort(x.a)} all-in`,
      }));
  };
  const nextStepsOf = (slug, factsOnly) => {
    if (factsOnly)
      return {
        intro_line:
          "Facts-only mode changes nothing about your rights. These are the records we keep watching.",
        steps: [
          {
            heading: "The Jul–Sep 2026 QPR",
            body: "Due 15 Oct 2026, not on HARERA yet.",
            source_label: "HARERA QPR register",
          },
          { heading: "This page", body: "We note the day the review ends.", source_label: null },
        ],
        base_rate_line: "About 36 of 100 Gurugram projects got their OC more than 12 months late.",
        lower_band_nearby: [],
        rule_line: RULE_LINE,
      };
    const r = run(slug);
    if (r.state === "scored")
      return {
        intro_line: `We never say buy or don't buy. At ${BANDS[r.band].label}, these steps keep less of your money at stake.`,
        steps: NEXT[r.band].map(([heading, body]) => ({ heading, body, source_label: null })),
        base_rate_line: baseRateLine(r),
        lower_band_nearby: lowerBandNearby(slug),
        rule_line: RULE_LINE,
      };
    return {
      intro_line:
        r.state === "limited_history"
          ? "Not enough history to score. These are the records to read."
          : "Not scored yet. These are the records to read.",
      steps: CHECKS[slug].map(([heading, body, source_label]) => ({ heading, body, source_label })),
      base_rate_line: baseRateLine(r),
      lower_band_nearby: [],
      rule_line: RULE_LINE,
    };
  };
  const truthPanel = (slug) => {
    const g = reg(slug);
    const items = [];
    if (g) {
      const ext = cat.extensions.filter((e) => e.phase === slug);
      const orig = fmtMonth(g.original_completion.slice(0, 7));
      const value = ext.length
        ? `${orig} · extended to ${fmtMonth(g.current_completion.slice(0, 7))} (${ext.length} extensions)`
        : `${orig} · no extensions`;
      items.push({
        key: "completion",
        label: "Original vs current completion",
        value_line: value,
        lane: "records_show",
        sources: sourceRefKeys([
          `${slug}/registration`,
          ...ext.map((e) => `coral-towers/extension-${e.seq}`),
        ]),
      });
    }
    const prog = progressOf(slug);
    if (prog.built_pct != null && prog.time_used_pct != null) {
      const lf = latestScoredFiling(slug);
      const keys = [
        lf ? `${slug}/qpr/${lf.quarter}/progress` : `${slug}/progress`,
        `${slug}/time-used`,
      ];
      items.push({
        key: "progress",
        label: "Built vs time used",
        value_line: `${prog.built_pct}% built · ${prog.time_used_pct}% of time used`,
        lane: "records_show",
        sources: sourceRefKeys(keys),
      });
    }
    const c = complaints(slug);
    if (c)
      items.push({
        key: "complaints",
        label: "Complaints decided",
        value_line: `${c.count_24m} complaints · ${c.per_100_units} per 100 units`,
        lane: "records_show",
        sources: sourceRefKeys([`${slug}/complaints-24m`]),
      });
    if (g?.collection_bank)
      items.push({
        key: "collection_account",
        label: "RERA collection account",
        value_line: "Peepal Bank, Golf Course Road · ending 4417",
        lane: "records_show",
        sources: sourceRefKeys([`${slug}/collection-account`]),
      });
    return items;
  };
  const QUARTER_NOTES = {
    [`${AH2}/2025-Q4`]: "Filed 38 days late, on 22 Feb 2026.",
    [`${AH2}/2026-Q1`]: "Tower A slab 9 cast.",
    [`${AH2}/2026-Q2`]: "Filed 15 Jul 2026, on time. A demand for slab 12 went out on 10 Oct 2026.",
    "sapphire-grove-phase-1/2026-Q2": "Filed 27 Jul 2026, 12 days late.",
    "kestrel-park/2026-Q3": "Filed 12 Oct 2026, on time.",
    "coral-towers/2026-Q1":
      "Filed 14 Apr 2026. The Apr–Jun and Jul–Sep 2026 QPRs are not on HARERA.",
  };
  const progressReplay = (slug, factsOnly) => {
    const r = run(slug);
    const towersHere = cat.towers.filter((t) => t.phase === slug);
    const scored = r.state === "scored" && !factsOnly;
    const bandThen = scored ? (slug === AH2 ? "moderate" : r.band) : null;
    const quarters = filings(slug)
      .filter((f) => f.built_pct != null || f.sold_pct != null)
      .map((f) => {
        const slabs = cat.qpr_tower_progress.filter(
          (t) => t.phase === slug && t.quarter === f.quarter,
        );
        const towers = slabs.length
          ? Object.fromEntries(slabs.map((s) => [s.tower, s.slab_reached]))
          : null;
        let note = QUARTER_NOTES[`${slug}/${f.quarter}`] ?? null;
        if (!note && towersHere.length && !towers)
          note = "This QPR reports Phase 2 as a whole, not by tower.";
        return {
          quarter: f.quarter,
          label: fmtQuarter(f.quarter),
          sold_pct: f.sold_pct,
          built_pct: f.built_pct,
          time_used_pct: f.time_used_pct,
          band_then: bandThen,
          towers,
          filed_on: f.filed_on,
          status: f.status,
          note_line: note,
        };
      });
    const since = scored ? bandSince(slug) : null;
    return {
      floors_per_tower: towersHere.length ? towersHere[0].floors_planned : null,
      towers: towersHere.length ? towersHere.map((t) => t.code) : null,
      quarters,
      today: {
        time_used_pct: timeUsed(slug),
        band: scored ? r.band : null,
        band_since_line: since ? `${BANDS[r.band].label} since ${fmtDate(since)}` : null,
      },
      late_filings_line:
        slug === AH2
          ? "Filed late: Jul–Sep 2024 (12 days), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days)."
          : null,
    };
  };
  const homesOf = (slug) => {
    const uts = cat.unit_types.filter((u) => u.phase === slug);
    const plist = dc.price_lists
      .filter((l) => l.phase === slug)
      .sort((a, b) => b.published_on.localeCompare(a.published_on))[0];
    const fp = dc.developer_documents.find((d) => d.phase === slug && d.kind === "floor_plan");
    const configurations = uts.map((u) => {
      const item = plist?.items.find((i) => i.unit_label === u.label);
      const a = u.label === "3 BHK" ? factByKey(`${slug}/price/all-in-3bhk`) : null;
      const quoted = u.label === "3 BHK" ? factByKey(`${slug}/price/quoted-3bhk`) : null;
      const loading =
        u.super_sqft && u.carpet_sqft ? Math.round((u.super_sqft / u.carpet_sqft - 1) * 100) : null;
      return {
        label: u.label,
        carpet_line: u.carpet_sqft
          ? `${groupIN(u.carpet_sqft)} sq ft carpet`
          : "Carpet not in our records yet",
        carpet_lane: u.carpet_lane,
        super_line: u.super_sqft ? `${groupIN(u.super_sqft)} sq ft super` : null,
        super_lane: u.super_lane,
        loading_line: loading != null ? `${loading}% loading` : null,
        price_line: item
          ? `From ${inrShort(item.base_price_inr)}`
          : quoted
            ? `Quoted ${inrShort(quoted.value.base_price_inr)}`
            : null,
        price_lane: "from_developer",
        all_in_line: a ? `${inrShort(a.value.all_in_inr)} all-in` : null,
        all_in_note: a ? null : `No ${u.label} cost sheet, so no all-in yet.`,
        rooms: fp?.summary.rooms[u.label] ?? [],
      };
    });
    const units = phase(slug).units_total;
    const brochure = dc.developer_documents.find((d) => d.phase === slug && d.kind === "brochure");
    const ga = PHASE_COPY[slug].getting_around;
    const reports =
      slug === AH2
        ? cat.reported_incidents
            .filter((r) => r.locality === "sector-37d")
            .sort((a, b) => b.reported_on.localeCompare(a.reported_on))
        : [];
    return {
      units_line:
        slug === AH2
          ? "Towers A, B and C, 20 floors each, with 500 homes in Phase 2. Latest QPR: Tower A at slab 9, Tower B at slab 7, Tower C at slab 5."
          : units
            ? `${groupIN(units)} homes in this phase.`
            : null,
      configurations,
      amenities: brochure
        ? {
            lane: "from_developer",
            source_line: "Developer says · brochure, 2 Oct 2026",
            items: brochure.summary.amenities,
          }
        : null,
      getting_around: ga
        ? {
            lane: "our_estimate",
            source_line: "Our estimate · road distances, Oct 2026",
            items: ga,
          }
        : null,
      waterlogging: reports.length
        ? {
            lane: "reported_unverified",
            reports: reports.map((r) => ({
              reported_on: r.reported_on,
              line: `${r.place_text} · news report, ${fmtDate(r.reported_on)}`,
            })),
            note_line: "Reported, not verified by Plinth. No report names the Aurelia site itself.",
          }
        : null,
    };
  };
  const fromDeveloperOf = (slug) => {
    const lists = dc.price_lists
      .filter((l) => l.phase === slug)
      .sort((a, b) => b.published_on.localeCompare(a.published_on));
    const plan = dc.payment_plans.find((p) => p.phase === slug);
    const tp = dc.developer_documents.find((d) => d.phase === slug && d.kind === "transfer_policy");
    const da = dc.developer_documents.find((d) => d.phase === slug && d.kind === "draft_agreement");
    if (!lists.length && !plan) return null;
    const g = groupOf(slug);
    const who = g.slug === "northfield-estates" ? "Northfield" : g.name;
    return {
      label: "From the developer · not verified by Plinth",
      updated_line: slug === AH2 ? "Northfield Estates · updated 2 Oct 2026" : null,
      note_line: `${who} added this in its free Plinth workspace. We show it as given and date every change. It is not a public record, and it never moves the delivery risk.`,
      price_lists: lists.map((l) => ({
        published_on: l.published_on,
        label:
          l.note === "Launch"
            ? `Launch, ${fmtMonth(l.published_on.slice(0, 7))}`
            : l.published_precision === "month"
              ? fmtMonth(l.published_on.slice(0, 7))
              : fmtDate(l.published_on),
        items: l.items.map((i) => ({
          unit_label: i.unit_label,
          base_price_inr: i.base_price_inr,
          price_line: `from ${inrShort(i.base_price_inr)}`,
          per_sqft_line: i.per_sqft_carpet_inr
            ? `${inrExact(i.per_sqft_carpet_inr)} per sq ft carpet`
            : null,
        })),
      })),
      price_basis_line: "Base prices, before charges, GST and stamp duty.",
      payment_plan: plan
        ? {
            kind: plan.kind,
            name: plan.name,
            published_on: plan.published_on,
            stages: plan.stages.map((s) => ({
              seq: s.seq,
              label: s.label,
              stage_kind: s.stage_kind,
              slab_no: s.slab_no,
              pct: s.pct,
            })),
            line: "You pay as the building rises. A buyer booking today pays 10%, then, once the agreement for sale is registered, every stage already on record: 52.5% in all.",
            by_tower_line:
              "Booking today, by registration you would pay 52.5% in Tower A, 45% in Tower B and 37.5% in Tower C.",
            demand_line:
              "A demand for Tower A slab 12 went out on 10 Oct 2026, while the latest QPR shows slab 9.",
          }
        : null,
      transfer_policy: tp
        ? "₹150 per sq ft of super area, so ₹3.0 L on a 2,000 sq ft 3 BHK. All dues to date first. No transfer before the agreement for sale is registered."
        : null,
      draft_agreement_line: da
        ? "The draft agreement for sale (2 Oct 2026) lets Northfield bill each buyer a share of any later government EDC/IDC increase, by super area."
        : null,
    };
  };
  const costOf = (slug) => {
    const cs = dc.cost_sheets.find((c) => c.phase === slug);
    if (!cs) return null;
    const negotiable = cs.lines
      .filter((l) => l.tag === "often_negotiable")
      .reduce((a, l) => a + l.amount_inr, 0);
    const quoted = cs.lines.find((l) => l.code === "base").amount_inr;
    return {
      schema: "plinth.cost_breakdown/1",
      rules_version: "2026.10",
      basis_line:
        "3 BHK, 1,450 sq ft carpet / 2,000 super · park-facing · cost sheet of 2 Oct 2026",
      lines: cs.lines.map((l) => ({
        code: l.code,
        label: l.label,
        amount_inr: l.amount_inr,
        amount_label: inrShort(l.amount_inr),
        tag: l.tag,
      })),
      charges_total_label: inrShort(cs.charges_total_inr),
      all_in_inr: cs.all_in_inr,
      all_in_label: inrShort(cs.all_in_inr),
      per_sqft_carpet_label: `${inrExact(cs.per_sqft_carpet_inr)} per sq ft carpet`,
      vs_quoted_line: `${Math.round((cs.all_in_inr / quoted - 1) * 100)}% more than quoted`,
      negotiable_line: `Often negotiable: PLC and club (${inrShort(negotiable)}).`,
      edc_idc_line: "EDC and IDC: included in the base.",
      area_line:
        "You pay for 2,000 sq ft of super area. You can use 1,450 sq ft of carpet area. Loading is 38%.",
      move_in_line: "About ₹12–18 L on top, around the offer of possession (Plinth estimate).",
    };
  };
  const affordOf = (slug, factsOnly) => {
    if (slug !== AH2) return null;
    const a = vectors.afford_the_wait;
    const d12 = a.cases.find((c) => c.delay_months === 12);
    const d24 = a.cases.find((c) => c.delay_months === 24);
    return {
      schema: "plinth.afford_the_wait/1",
      inputs: {
        tower: "A",
        take_home_inr: 450000,
        rent_inr: 55000,
        down_pct: 20,
        rate_pct: 8.5,
        tenure_years: 20,
        delay_months: 12,
      },
      loan: {
        all_in_rounded_inr: a.derived.all_in_rounded_inr,
        down_payment_inr: a.derived.down_payment_inr,
        loan_inr: a.derived.loan_inr,
      },
      answer_line: `Rent and pre-EMI come to ${a.expected.now_monthly_label} a month now, rising to ${a.expected.by_completion_monthly_label} by Dec 2027 (${a.expected.now_share_pct}% → ${a.expected.by_completion_share_pct}% of take-home).`,
      now: { monthly_inr: a.expected.now_monthly_inr, share_pct: a.expected.now_share_pct },
      by_completion: {
        label: "By Dec 2027",
        monthly_inr: a.expected.by_completion_monthly_inr,
        share_pct: a.expected.by_completion_share_pct,
      },
      delay: { months: 12, cost_inr: d12.cost_inr, cost_label: d12.cost_label },
      delay_options: [d12, d24].map((d) => ({
        months: d.delay_months,
        cost_inr: d.cost_inr,
        cost_label: d.cost_label,
      })),
      after_keys: { emi_inr: a.expected.emi_after_keys_inr },
      series: a.series,
      frequency_line: factsOnly
        ? null
        : "Between 30 and 45 of 100 similar projects were more than 12 months late.",
      assumptions: [
        "Loan = 80% of the all-in (₹2.74 Cr, rounded to the lakh).",
        "Payout follows the plan for Tower A.",
        "The delay comes after finishing.",
        "RERA s.18 interest is left out.",
      ],
      framing_line: "Arithmetic, not advice.",
    };
  };
  const P = (lead, text, tone = "body") => ({ lead, text, tone });
  const beforeBookingOf = (slug) => {
    const isA = slug === AH2;
    return {
      intro_line:
        "Four things buyers ask about before the first cheque, with the rules behind them.",
      note_line: "General information, not legal, tax or financial advice.",
      payment_plans: {
        title: "Which payment plan?",
        sub: "Construction-linked, down payment or subvention, and what each one risks.",
        paras: [
          ...(isA
            ? [
                P(
                  null,
                  "Northfield's plan for Phase 2 is construction-linked: 13 stages, from 10% on booking to 5% on offer of possession. It is under “From the developer” in Homes.",
                ),
              ]
            : []),
          P(
            "Construction-linked.",
            isA
              ? "You pay each stage once it is built, so your money follows the building. Watch for demands ahead of the filings: Northfield asked for Tower A slab 12 on 10 Oct 2026, and the latest QPR shows slab 9."
              : "You pay each stage once it is built, so your money follows the building. Check each demand against the latest QPR.",
          ),
          P(
            "Down payment.",
            "You pay most of the price early, often for a discount. If the project is late, more of your money waits with it. Before a registered agreement, the law still caps you at 10%.",
          ),
          P(
            "Subvention, or “no EMI till possession”.",
            "The bank pays the developer early, and the developer promises to pay your pre-EMI. You are still the borrower: if the developer stops paying, the bank collects from you.",
          ),
          P(
            "Before a subvention booking,",
            "get the lender's confirmation in writing: what it pays out, when, and who pays the pre-EMI if the developer stops.",
            "key",
          ),
          ...(isA
            ? [
                P(
                  "Slab stages follow your tower.",
                  "Booking today, by registration you would pay 52.5% in Tower A, 45% in Tower B and 37.5% in Tower C.",
                ),
              ]
            : []),
        ],
      },
      loans: {
        line: "Loan checks arrive in 2027",
        title: "Home loans",
        sub: "Loan checks arrive in 2027. What to check with your bank now.",
        paras: [
          P(
            "Loan checks arrive in 2027.",
            "Plinth doesn't arrange loans or pass your number to any lender today.",
          ),
          P(
            "Check now:",
            "is this project approved by your bank? Ask the bank, in writing, not the developer.",
            "key",
          ),
          ...(isA
            ? [
                P(
                  "Developer says · brochure, 2 Oct 2026 · not verified:",
                  "“Approved by major banks.”",
                  "developer_says",
                ),
              ]
            : []),
          P(
            "Banks usually don't lend for stamp duty or registration.",
            "Plan for those from your own money.",
          ),
        ],
      },
      nri: {
        title: "Buying from abroad (NRI)",
        sub: "Paying from NRE or NRO, a power of attorney, and FEMA basics.",
        paras: [
          P(
            "Paying.",
            "From an NRE, FCNR(B) or NRO account, or money sent to India through a bank. FEMA doesn't allow paying in foreign currency notes or traveller's cheques.",
          ),
          P("Loans.", "Indian banks lend to NRIs. EMIs come from an NRE or NRO account."),
          P(
            "TDS.",
            "Like any buyer, you deduct 1% from each instalment when the price is ₹50 L or more (s.194-IA). You need a PAN.",
          ),
          P(
            "Power of attorney.",
            "Make it specific to this flat, and list what your relative may sign: booking form, agreement, payments, registration. One signed abroad is attested at an Indian mission or apostilled, then stamped in India within 3 months.",
          ),
        ],
      },
      selling_before_possession: {
        title: "Selling before possession",
        sub: "Transfer charges, the builder's NOC and what RERA says.",
        paras: [
          P(
            null,
            "Selling before possession means transferring your allotment. The developer endorses the new buyer on your agreement and issues a no-objection certificate (NOC).",
          ),
          ...(isA
            ? [
                P(
                  "From the developer · not verified by Plinth · transfer policy, 2 Oct 2026:",
                  "₹150 per sq ft of super area, so ₹3.0 L on a 2,000 sq ft 3 BHK. All dues to date first. No transfer before the agreement for sale is registered.",
                  "from_developer",
                ),
              ]
            : []),
          P(
            "Under RERA,",
            "whoever takes your allotment becomes the allottee, with your rights, including delay interest (s.2(d)).",
          ),
          P("Ask a CA", "about capital-gains tax, and a lawyer about stamp duty on the transfer."),
          P(null, "Our resale and transfer checks are planned for Apr–Jun 2027."),
        ],
      },
    };
  };
  const preRera = () => ({
    line: "None of this counts in the band.",
    intro_line:
      "The track record counts RERA-era projects only, registered 2017 or later. Northfield built before that too.",
    coverage_line:
      "Before May 2017 there was no public register of promised dates, so this list may be incomplete.",
    items: cat.pre_rera_records.map((r) => ({
      name: `${r.project_name}, ${r.sector}${r.year_line ? ` (${r.year_line})` : ""}`,
      fact_line: r.fact_line,
      source_line: r.sources.length ? r.sources.join(" · ") : null,
    })),
  });
  const recordsOf = (slug) => {
    const out = [];
    const add = (key, chip, line) => {
      const f = factByKey(key);
      if (f)
        out.push({
          fact_id: f.id,
          chip,
          line,
          lane: f.lane,
          as_of: f.as_of,
          evidence_url: `/evidence/${f.id}`,
        });
    };
    const g = reg(slug);
    if (g) {
      const regLine =
        slug === AH2
          ? "Registered Dec 2022. Original completion date: Dec 2027. Towers A–C, 500 homes: 3 BHK 1,450 sq ft and 4 BHK 2,100 sq ft carpet."
          : `Registered ${g.registered_precision === "day" ? fmtDate(g.registered_on) : fmtMonth(g.registered_on.slice(0, 7))}. Original completion date: ${fmtMonth(g.original_completion.slice(0, 7))}.`;
      add(`${slug}/registration`, `HARERA registration · ${g.registered_on.slice(0, 4)}`, regLine);
    }
    if (slug === AH2)
      add(
        `${slug}/extensions`,
        "HARERA extension orders",
        "No Section 6 extension found for Phase 2.",
      );
    for (const e of cat.extensions.filter((x) => x.phase === slug)) {
      const k = `coral-towers/extension-${e.seq}`;
      add(
        k,
        sourceLabel(factByKey(k)),
        `Extension ${e.seq} moved the date from ${fmtMonth(e.from_completion.slice(0, 7))} to ${fmtMonth(e.to_completion.slice(0, 7))}.`,
      );
    }
    for (const f of filings(slug).filter((x) => x.built_pct != null))
      add(
        `${slug}/qpr/${f.quarter}/progress`,
        `HARERA QPR · ${fmtQuarter(f.quarter)}`,
        f.sold_pct != null
          ? `${f.sold_pct}% of units sold, ${f.built_pct}% built.`
          : `${f.built_pct}% built.`,
      );
    if (slug === AH2) {
      add(
        `${slug}/qpr-register`,
        "HARERA QPR register",
        "QPRs filed late in 3 of the last 8 quarters. Longest delay: 41 days.",
      );
      add(
        `${slug}/qpr/2026-Q3/missing`,
        "HARERA QPR register · 18 Oct 2026",
        "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.",
      );
    }
    if (slug === "cedar-walk-phase-2")
      add(
        `${slug}/qpr-register`,
        "HARERA QPR register",
        "QPRs filed on time in each of the last 8 quarters.",
      );
    if (slug === "coral-towers")
      for (const q of ["2026-Q2", "2026-Q3"])
        add(
          `${slug}/qpr/${q}/missing`,
          "HARERA QPR register · 18 Oct 2026",
          `The ${fmtQuarter(q)} QPR is not on HARERA yet.`,
        );
    if (slug === "sapphire-grove-phase-1")
      add(
        `${slug}/qpr/2026-Q3/filing`,
        "HARERA QPR · Jul–Sep 2026 · filed 15 Oct 2026",
        "Filed 15 Oct 2026, on time. We fetched it 16 Oct 2026, 7:40 pm, and are reading it now.",
      );
    const c = complaints(slug);
    if (c)
      add(
        `${slug}/complaints-24m`,
        "HARERA orders · 24 months",
        `${c.count_24m} complaints decided against the promoter in 24 months · ${c.per_100_units} per 100 units (${groupIN(c.units_base)} units). Median count for similar projects: ${c.median_count_similar}.`,
      );
    const gs = groupOf(slug).slug;
    const tr = factByKey(`${gs}/track-record`);
    if (tr && tr.value.finished > 0)
      add(
        `${gs}/track-record`,
        "HARERA · DTCP OC records",
        `${tr.value.late} of the group's ${tr.value.finished} finished RERA projects got OC more than 12 months late.`,
      );
    if (gs === "northfield-estates")
      add(
        "northfield-estates/insolvency-search",
        "IBBI · NCLT search",
        "No insolvency found for the Northfield Estates group.",
      );
    if (gs === "elmstone-developers")
      add(
        "elmstone-developers/insolvency-admitted",
        "IBBI · NCLT order 12 Mar 2023",
        "A group company of Elmstone Developers was admitted to insolvency by NCLT order on 12 Mar 2023.",
      );
    if (slug === AH2)
      add(
        `${slug}/collection-account`,
        "HARERA registration · collection account",
        "RERA collection account: Peepal Bank, Golf Course Road, Gurugram, account ending 4417, IFSC PEPL0000418.",
      );
    return out;
  };
  const projectPage = (slug, { factsOnly = false } = {}) => {
    const risk = riskSummary(slug, { factsOnly });
    const g = reg(slug);
    return {
      schema: "plinth.project_page/1",
      risk,
      hero: {
        image_url: PHASE_COPY[slug].image,
        image_caption: "Images on this page are illustrative",
        summary_line: factsOnly
          ? "Band withheld pending review, from 18 Oct 2026 · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027"
          : HERO_SUMMARY[slug],
        rera_badge: g?.rera_number
          ? { number: g.rera_number, authority_url: HARERA.url, qr_url: null }
          : null,
      },
      truth_panel: truthPanel(slug),
      progress: progressReplay(slug, factsOnly),
      homes: homesOf(slug),
      from_developer: fromDeveloperOf(slug),
      cost: costOf(slug),
      wait_defaults: {
        take_home_inr: 450000,
        rent_inr: 55000,
        down_pct: 20,
        rate_pct: 8.5,
        tenure_years: 20,
      },
      afford_default: affordOf(slug, factsOnly),
      next_steps: nextStepsOf(slug, factsOnly),
      before_booking: beforeBookingOf(slug),
      pre_rera: groupOf(slug).slug === "northfield-estates" ? preRera() : null,
      records: recordsOf(slug),
      meta: risk.meta,
    };
  };

  // ---------------------------------------------------------------- Evidence (the 4 Aurelia reason facts)
  const evidence = () =>
    reasonsOf(run(AH2)).map((reason) => {
      const f = factById(reason.fact_ids[0]);
      const s = ev.snapshots.find((x) => x.key === f.snapshot);
      const open = f.corrections.filter((c) => c.outcome === "under_review");
      const done = f.corrections.filter((c) => c.outcome !== "under_review");
      const corrections_line = [
        done.length ? done.map((c) => c.line).join(" ") : "No corrections.",
        ...open.map((c) => c.line),
      ].join(" ");
      return {
        key: f.id,
        body: {
          schema: "plinth.evidence/1",
          fact_id: f.id,
          chip: f.evidence_copy.chip,
          lane: f.lane,
          document: f.evidence_copy.document,
          dates_line: f.evidence_copy.dates_line,
          page: f.page_ref,
          extract: f.extract_text,
          read_line: f.read_note,
          used_in: f.evidence_copy.used_in,
          developer_says: null,
          corrections_line,
          snapshot: {
            sha256_short: `${s.sha256.slice(0, 8)}…${s.sha256.slice(-8)}`,
            fetched_at: s.fetched_at,
          },
          official_url: HARERA.url,
          view_label: "View on HARERA",
          report_error: { ref_prefix: "E", sla_line: "We answer within 15 working days." },
        },
      };
    });

  // ---------------------------------------------------------------- DeveloperPage
  const developerPage = (gslug, { factsOnly = false } = {}) => {
    const g = group(gslug);
    const ongoing = SLUGS.filter((s) => groupOf(s).slug === gslug).map((s) => {
      const r = run(s);
      return {
        slug: s,
        name: phase(s).name,
        state: factsOnly ? "facts_only" : r.state,
        chip: chipFor(r, factsOnly),
        price_line: priceOf(s)?.display_line ?? null,
        progress_line: progressOf(s).line,
      };
    });
    const tr = factByKey(`${gslug}/track-record`);
    const finished = cat.phases.filter(
      (p) => p.status === "completed" && project(p.project).group === gslug,
    );
    const c = complaints(gslug);
    const reply =
      gslug === "northfield-estates" ? dc.developer_replies.find((x) => x.scope === "group") : null;
    const ocOf = (slug) => cat.completion_events.find((e) => e.phase === slug);
    const regOf = (slug) => cat.rera_registrations.find((r) => r.phase === slug);
    const units = c?.units_history
      ? "Per 100 units uses the units in the group's RERA registrations: 2,980 until Dec 2025, and 3,400 since Heron Point, Phase 2 was registered in Apr 2026."
      : null;
    const claim =
      g.claim_state === "claimed"
        ? {
            state: "claimed",
            line:
              gslug === "northfield-estates"
                ? "Claimed by Northfield · verified signatory"
                : "Claimed developer page · replies here",
            since: g.claimed_on,
          }
        : {
            state: "invited",
            line: `invited ${fmtDate(g.invited_on)} · not yet claimed`,
            since: g.invited_on,
          };
    let trLine = null;
    if (tr)
      trLine =
        tr.value.finished === 0
          ? `${g.name} is a new developer with no finished RERA project yet. We don't guess, and it never counts against them.`
          : `${tr.value.late} of the group's ${tr.value.finished} finished RERA projects got OC more than 12 months late.`;
    const insolvency =
      {
        "northfield-estates": "No insolvency found (checked 14 Oct 2026).",
        "elmstone-developers":
          "A group company of Elmstone Developers was admitted to insolvency by NCLT order on 12 Mar 2023.",
      }[gslug] ?? null;
    return {
      schema: "plinth.developer_page/1",
      group: {
        slug: g.slug,
        name: g.name,
        linked_companies: g.linked_companies,
        claim,
        mode: factsOnly ? "facts_only" : "scored",
      },
      summary_line:
        gslug === "northfield-estates"
          ? "A developer group of 9 linked companies. 2 of its 6 finished projects got OC more than 12 months late. 3 projects are ongoing."
          : null,
      facts_only: factsOnly
        ? {
            since: "2026-10-18",
            line: "Bands withheld pending review, from 18 Oct 2026",
            anchor: "facts-only",
            explainer_lines: [
              "Since 18 Oct 2026 we show facts only for Northfield's projects, while a court considers an application about our bands for this group. Every record below is unchanged and carries its source.",
              "Still here: dates, progress reports, complaints, OC orders and company links, each with its source.",
              "Withheld everywhere: the band, its reasons and the “of 100 similar projects” figure, on this page, in search, Compare, alerts and the Live Record.",
              "Not a finding: this says nothing about Northfield, and no record has changed.",
            ],
          }
        : null,
      track_record: {
        finished: tr ? tr.value.finished : null,
        late: tr ? tr.value.late : null,
        line: trLine,
        projects: finished.map((p) => {
          const oc = ocOf(p.slug);
          const r = regOf(p.slug);
          return {
            slug: p.slug,
            name: p.name,
            rera_number: r?.rera_number ?? null,
            promoter_name: p.promoter
              ? cat.developers.find((d) => d.key === p.promoter).legal_name
              : null,
            promised: r ? r.original_completion.slice(0, 7) : null,
            oc_on: oc ? oc.granted_on.slice(0, 7) : null,
            months_late: oc ? oc.months_late : null,
            late: p.finished_late12,
            line: oc ? oc.line : null,
            sources: factByKey(`${p.slug}/oc`) ? sourceRefs([factByKey(`${p.slug}/oc`).id]) : [],
          };
        }),
        sources: tr ? sourceRefs([tr.id]) : [],
      },
      ongoing,
      complaints: c
        ? {
            count_24m: c.count_24m,
            per_100_units: c.per_100_units,
            units_base: c.units_base,
            line_24m: `${c.count_24m} decided against the group, or ${c.per_100_units} per 100 units.`,
            half_years: [],
            units_line: units,
            fairness_line: "A bigger group isn't penalised for its size.",
          }
        : null,
      insolvency_line: insolvency,
      pre_rera: gslug === "northfield-estates" ? preRera() : null,
      reply: reply
        ? {
            text: reply.text,
            signatory_title: reply.signatory_title,
            signed_line: reply.signed_line,
            records_line:
              "Heron Point, Phase 1 got OC in Jun 2025, 27 months after its original RERA date.",
            published_on: reply.published_on,
            check_by: reply.check_by,
            line: `Developer says · not yet verified · ${fmtDate(reply.published_on)} · we check it by ${fmtDate(reply.check_by)}`,
          }
        : null,
      claim_explainer_line:
        "Claiming lets a developer correct facts, reply next to the records and hear from buyers who ask. It never changes a band. A developer that hasn't claimed is shown as “Invited” with the date, and we never call anyone uncooperative.",
      how_buyers_find_you: {
        lines: [
          "Order never follows money. The default sort is lowest delivery risk first. No developer pays us, and no fee we earn ever touches ranking. Nobody can buy a place, above or below anyone.",
          "Only verified facts count. Bands, dates and costs come from records we have matched to HARERA, DTCP or MCA. A price list or photo a developer adds is shown and labelled as theirs, but never used to rank. Claiming a page doesn't move it either.",
          "Bands show in Compare. Buyers see each band side by side with the all-in cost and progress. A buyer who asks for low delivery risk gets two tiles, Low and Moderate, and can remove either. Buyers always see how many projects their filters hid.",
        ],
      },
      meta: {
        data_as_of: "2026-10-14",
        model_version: "v1.2",
        generated_at: NOW,
        methodology_url: "/methodology",
        disclaimer_line: DISCLAIMER,
        promise_line: PROMISE,
        live_url: `${BASE}/gurugram/developers/${gslug}`,
      },
    };
  };

  // ---------------------------------------------------------------- Search
  const searchItem = (slug) => {
    const p = phase(slug);
    const r = run(slug);
    const prog = progressOf(slug);
    const pr = priceOf(slug);
    const u3 = cat.unit_types.find((u) => u.phase === slug && u.label === "3 BHK");
    const g = reg(slug);
    return {
      slug,
      name: p.name,
      locality_line: PHASE_COPY[slug].locality_line,
      developer_name:
        slug === "heron-point-phase-2"
          ? "Heronstone Projects, a Northfield Estates company"
          : groupOf(slug).name,
      chip: chipFor(r),
      state: r.state,
      chip_note: SEARCH_NOTE[slug],
      price_line: pr?.display_line ?? null,
      pin_label: pr?.all_in_label ?? null,
      built_line: prog.built_pct != null ? `${prog.built_pct}% built` : null,
      progress_line:
        prog.built_pct != null && prog.time_used_pct != null
          ? `${prog.built_pct}% built · ${prog.time_used_pct > 100 ? "past original date" : `${prog.time_used_pct}% of time used`}`
          : null,
      built_pct: prog.built_pct,
      time_used_pct: prog.time_used_pct,
      config_line: u3
        ? `3 BHK, ${u3.carpet_sqft ? `${groupIN(u3.carpet_sqft)} sq ft carpet` : "carpet not in our records yet"}`
        : null,
      completion_line: g
        ? `Original completion ${fmtMonth(g.original_completion.slice(0, 7))}`
        : null,
      image_url: PHASE_COPY[slug].image,
      // GeoJSON order [lng, lat], as in API_CONTRACTS §4.3; the sector pin (§5b round 2, C-20).
      centroid: (({ centroid: c }) => (c ? [c.lng, c.lat] : null))(project(p.project)),
    };
  };
  const rank = (slug) => {
    const r = run(slug);
    if (r.state === "scored") return BANDS[r.band].step;
    return r.state === "limited_history" ? 6 : 7;
  };
  const order = (a, b) => rank(a) - rank(b) || phase(a).name.localeCompare(phase(b).name);
  const bhkOf = (slug) =>
    cat.unit_types.filter((u) => u.phase === slug).map((u) => Number(u.label[0]));
  const budgetPrice = (slug) =>
    allIn(slug) ?? factByKey(`${slug}/price/quoted-3bhk`)?.value.base_price_inr ?? null;
  const runSearch = ({ bhk = null, corridor = null, budget = null, bands = null }) => {
    const inArea = SLUGS.filter((s) => (corridor ? phase(s).corridor === corridor : true));
    const passBhk = (s) => bhk == null || bhkOf(s).includes(bhk);
    const passBudget = (s) =>
      budget == null || (budgetPrice(s) != null && budgetPrice(s) <= budget);
    const passRisk = (s) => !bands || run(s).state !== "scored" || bands.includes(run(s).band);
    const pass = (s) => passBhk(s) && passBudget(s) && passRisk(s);
    const hidden = inArea
      .filter((s) => !pass(s))
      .sort(order)
      .map((s) => {
        const why = [];
        const pr = priceOf(s);
        if (!passBhk(s)) why.push(bhkOf(s).length ? `no ${bhk} BHK` : "no price list with us");
        else if (!passBudget(s))
          why.push(
            allIn(s)
              ? `quoted ${pr.quoted_label}, but ${pr.all_in_label} all-in`
              : `quoted ${pr.quoted_label}`,
          );
        if (!passRisk(s)) why.push(`delivery risk ${BANDS[run(s).band].label}`);
        return { slug: s, name: phase(s).name, why_line: why.join(" · ") };
      });
    return { results: inArea.filter(pass).sort(order), hidden };
  };
  const searchPayload = (key, request, parsed, opts) => {
    const base = {
      schema: "plinth.search_results/1",
      query: request.p_q,
      parsed,
      notes: [],
      sort_line: "Sorted by lowest delivery risk. Order never follows money.",
      legend_line: "Pins show all-in prices",
      items: [],
      hidden_count: 0,
      hidden: [],
      next_cursor: null,
      zero_results: null,
      meta: { data_as_of: "2026-10-14", model_version: "v1.2", generated_at: NOW },
    };
    if (opts.special) return { key, request, body: { ...base, zero_results: opts.special } };
    const { results, hidden } = runSearch(opts);
    const notes = [];
    if (opts.bands?.includes("low") && opts.bands.includes("moderate"))
      notes.push("“Low delivery risk” shows Low and Moderate.");
    if (hidden.length)
      notes.push(
        hidden.length === 1
          ? "1 project hidden by your filter."
          : `${hidden.length} projects hidden by your filters.`,
      );
    const zero = results.length
      ? null
      : {
          kind: "no_match",
          line: "Nothing on Dwarka Expressway fits every word above. The list below says what each project misses.",
          action: {
            kind: "drop_filter",
            label: "Risk: add Elevated",
            drop: "bands",
            brings_back: [AH2],
          },
          detail_line:
            "It's the only Dwarka Expressway project here with a 4 BHK: 2,100 sq ft carpet, quoted from ₹3.38 Cr, all-in not known yet. Its delivery risk is Elevated.",
        };
    return {
      key,
      request,
      body: {
        ...base,
        notes,
        items: results.map(searchItem),
        hidden_count: hidden.length,
        hidden,
        zero_results: zero,
      },
    };
  };
  const req = (p_q) => ({
    p_q,
    p_filters: null,
    p_sort: "lowest_risk",
    p_bbox: null,
    p_cursor: null,
    p_limit: 20,
  });
  const searches = () => [
    searchPayload(
      "canonical",
      req("3 bhk dwarka expresway under 2.5 cr low risk"),
      {
        bhk: [3],
        all_in_max_inr: 25000000,
        corridors: ["dwarka-expressway"],
        bands: ["low", "moderate"],
      },
      { bhk: 3, corridor: "dwarka-expressway", budget: 25000000, bands: ["low", "moderate"] },
    ),
    searchPayload(
      "zero-results",
      req("4 bhk dwarka expressway low risk"),
      {
        bhk: [4],
        all_in_max_inr: null,
        corridors: ["dwarka-expressway"],
        bands: ["low", "moderate"],
      },
      { bhk: 4, corridor: "dwarka-expressway", bands: ["low", "moderate"] },
    ),
    searchPayload(
      "unknown-project",
      req("Indigo Terraces"),
      { name: "Indigo Terraces" },
      {
        special: {
          kind: "unknown_project",
          line: "We can't find Indigo Terraces in our records. If it has a Gurugram RERA number, we'll add it by 1 Nov 2026 or tell you why not.",
          action: { kind: "request_project", label: "Request it" },
          detail_line:
            "We add any Gurugram project with a RERA number within 14 days, or say why not in writing: no RERA registration, outside Gurugram, or registration lapsed.",
        },
      },
    ),
    searchPayload(
      "outside-coverage",
      req("3 bhk noida"),
      { bhk: [3], place: "noida" },
      {
        special: {
          kind: "outside_coverage",
          line: "We don't cover Noida yet, so we won't guess. Plinth covers Gurugram today. Noida and Greater Noida West are planned for Jul–Sep 2027.",
          action: { kind: "waitlist", label: "Join the Noida waitlist" },
          detail_line:
            "One WhatsApp message when Noida opens, planned for Jul–Sep 2027. Nothing else.",
        },
      },
    ),
    searchPayload("all-gurugram", req(""), {}, {}),
  ];

  // ---------------------------------------------------------------- Compare
  const PENDING_CELL = {
    [AH2]: "Jul–Sep 2026 QPR not on HARERA yet (due 15 Oct)",
    "kestrel-park": "Jul–Sep 2026 QPR filed on time, 12 Oct 2026",
    "sapphire-grove-phase-1":
      "Jul–Sep 2026 QPR filed 15 Oct 2026 · re-score due by 19 Oct 2026, 7:40 pm",
    "coral-towers": "Apr–Jun and Jul–Sep 2026 QPRs not on HARERA yet · progress 187 days old",
  };
  const compare = (slugs) => {
    const cell = (v) => v ?? "Not in our records yet";
    const u3 = (s) => cat.unit_types.find((u) => u.phase === s && u.label === "3 BHK");
    const row = (key, label, source_line, f) => ({
      key,
      label,
      source_line,
      cells: slugs.map((s) => cell(f(s))),
    });
    return {
      schema: "plinth.compare/1",
      columns: slugs.map((s) => ({
        slug: s,
        name: phase(s).name,
        chip: chipFor(run(s)),
        state: run(s).state,
        locality_line: PHASE_COPY[s].locality_line,
        developer_name: groupOf(s).name,
        price_line: priceOf(s)?.display_line ?? null,
        image_url: PHASE_COPY[s].image,
      })),
      rows: [
        row("frequency", "Out of 100 similar projects", "Methodology v1.2 · 14 Oct 2026", (s) => {
          const r = run(s);
          return r.freq_kind
            ? `${r.freq_kind === "point" ? `About ${r.freq_point}` : `Between ${r.freq_low} and ${r.freq_high}`} were more than 12 months late`
            : null;
        }),
        row("all_in", "All-in, 3 BHK", "Cost sheets + rules v2026.10", (s) => {
          const p = priceOf(s);
          return p?.all_in_label ? `${p.all_in_label} · ${p.per_sqft_carpet_label}` : null;
        }),
        row("built", "Built vs time used", "Latest HARERA QPR for each project", (s) => {
          const p = progressOf(s);
          return p.built_pct != null
            ? `${p.built_pct}% built · ${p.time_used_pct}% of time used`
            : null;
        }),
        row(
          "carpet",
          "Carpet area, 3 BHK",
          "HARERA registration (Aurelia) · developer price lists, Oct 2026",
          (s) => (u3(s)?.carpet_sqft ? `${groupIN(u3(s).carpet_sqft)} sq ft` : null),
        ),
        row("loading", "Loading, 3 BHK (super vs carpet)", "Developer cost sheets", (s) => {
          const u = u3(s);
          return u?.super_sqft
            ? `${Math.round((u.super_sqft / u.carpet_sqft - 1) * 100)}% · ${groupIN(u.super_sqft)} sq ft super`
            : null;
        }),
        row("completion", "Original completion (RERA)", "HARERA registration certificates", (s) => {
          const g = reg(s);
          if (!g) return null;
          const ext = cat.extensions.filter((e) => e.phase === s);
          const o = fmtMonth(g.original_completion.slice(0, 7));
          if (s === AH2) return `${o} · no extensions so far`;
          return ext.length
            ? `${o} · extended twice: ${ext.map((e) => fmtMonth(e.to_completion.slice(0, 7))).join(", then ")}`
            : o;
        }),
        row("complaints", "Complaints, 24 months", "HARERA orders · to 14 Oct 2026", (s) => {
          const c = complaints(s);
          return c ? `${c.count_24m} · ${c.per_100_units} per 100 units` : null;
        }),
        row(
          "commute",
          "Commute to Cyber City, 9 am",
          "Plinth estimate · road distance, Oct 2026",
          (s) => PHASE_COPY[s].commute,
        ),
        row(
          "top_reason",
          "Top reason for the band",
          "Methodology v1.2",
          (s) => reasonsOf(run(s))[0]?.text ?? null,
        ),
        row("track_record", "Developer track record", "HARERA + DTCP OC records", (s) => {
          const t = factByKey(`${groupOf(s).slug}/track-record`);
          return t
            ? `${t.value.late} of ${t.value.finished} finished projects got OC more than 12 months late`
            : null;
        }),
        {
          ...row(
            "pending",
            "On record now",
            "HARERA QPR register · 18 Oct 2026",
            (s) => PENDING_CELL[s] ?? null,
          ),
          developer_says: slugs.map((s) =>
            s === AH2 ? "Developer says: filed 12 Oct, not yet verified." : null,
          ),
        },
      ],
      notes: [
        "3 BHK on each. Every row names its source.",
        "Facts-only projects show “Band withheld · facts only”.",
        "Blank cells say “Not in our records yet” rather than guess.",
      ],
      meta: {
        data_as_of: "2026-10-14",
        model_version: "v1.2",
        generated_at: NOW,
        disclaimer_line: DISCLAIMER,
        promise_line: PROMISE,
      },
    };
  };

  // ---------------------------------------------------------------- Methodology, About, Flags
  const EXAMPLES = {
    low: "kestrel-park",
    moderate: "sapphire-grove-phase-1",
    elevated: AH2,
    high: "coral-towers",
    severe: "laurel-residency",
  };
  const methodology = () => ({
    schema: "plinth.methodology/1",
    current_version: "v1.2",
    published_on: "2026-10-14",
    question_line:
      "One question for every RERA phase in Gurugram: will the OC arrive more than 12 months late?",
    bands: Object.entries(BANDS).map(([code, b]) => ({
      code,
      label: b.label,
      step: b.step,
      low: b.low,
      high: b.high,
      sentence: `Between ${b.low} and ${b.high} of 100 similar Gurugram projects got their OC more than 12 months after the original RERA date.`,
      example_slug: EXAMPLES[code],
    })),
    bands_note_line: "Ranges are provisional until our first calibration backtest is published.",
    similar_line:
      "Gurugram RERA phases registered 2017–2021, of comparable size, by developers with a comparable number of finished projects.",
    late12: {
      line: "Whether a phase gets its OC more than 12 months after its original RERA date. We call this Late12.",
      extensions_line:
        "We add extensions given to every project, such as COVID and the 4-month MoHUA extension of Jul 2026. We don't add extensions granted to one project. Those are part of the delay we predict.",
      example: { slug: AH2, ...late12Of(AH2) },
    },
    factors: [
      { code: "finances", label: "Finances", weight_pct: 30 },
      { code: "track_record", label: "Track record", weight_pct: 30 },
      { code: "timeline", label: "Timeline", weight_pct: 20 },
      { code: "legal", label: "Legal", weight_pct: 15 },
      { code: "site", label: "Site", weight_pct: 5 },
    ],
    factors_note_line:
      "These are starting weights. We refit them after each backtest and publish the change.",
    how_line:
      "Red-flag rules come first. Then an interpretable scorecard adds up the five groups. Each score lists up to 4 reasons, ranked by how much they moved it. No AI ever sets a score.",
    red_flag_rules: sc.red_flag_rules.map((r) => ({
      code: r.code,
      n: r.n,
      title: r.title,
      line: r.text,
    })),
    red_flag_example_line:
      "Example: Laurel Residency, Sector 92. A group company of Elmstone Developers was admitted to insolvency by NCLT order of 12 Mar 2023.",
    confidence: [
      {
        level: "high",
        dots: 2,
        line: "We're more certain about this one. Many comparable finished projects, in Gurugram and in this group, so the range we show is narrow.",
      },
      {
        level: "low",
        dots: 1,
        line: "We're less certain about this one. Fewer comparable projects, so we show a wider range. The uncertain part is hatched.",
      },
      {
        level: "limited_history",
        dots: 0,
        line: "Not enough history to score · no penalty. We score a group once it has 3 finished RERA projects.",
      },
      {
        level: "not_scored",
        dots: 0,
        line: "Not scored: we always say why on the card, for example registered less than 6 months ago.",
      },
    ],
    data_rules: {
      rescore_hours: 72,
      stale_days: 120,
      line: "We recompute within 72 hours of a new filing or order. Data more than 120 days old gets a stale flag.",
    },
    calibration: {
      illustrative: true,
      rows: sc.calibration.map((c) => ({
        band: c.band,
        label: BANDS[c.band].label,
        range_low: c.range_low,
        range_high: c.range_high,
        n_projects: c.n_projects,
        n_late: c.n_late,
        per_100: c.per_100,
      })),
      base_rate: { n_projects: 212, n_late: 76, per_100: 36 },
      brier: 0.19,
      brier_baseline: 0.23,
    },
    versions: sc.score_models
      .slice()
      .reverse()
      .map((m) => ({
        version: m.version,
        released_on: m.released_on,
        title: m.title,
        items: m.changelog,
        note: m.note,
        current: m.status === "current",
      })),
    // §5b round 2, C-22 (published here) and BUILD_PLAN D-6.
    how_we_worked_this_out: {
      afford_the_wait: [
        "We round the all-in to the nearest ₹1 lakh before any loan arithmetic: ₹2,74,00,400 becomes ₹2,74,00,000.",
        "The bank pays out in step with the payment plan, after your down payment. The paid-out share rises in equal monthly steps from 52.5% in Nov 2026 to 95% in Dec 2027.",
        "Pre-EMI is interest only on what the bank has paid out. Each month's outgo is pre-EMI plus your rent.",
        "If keys come late, the Dec 2027 outgo carries on. A delay costs the number of months times that outgo.",
        "RERA s.18 interest for delay is left out: HARERA orders take months.",
      ],
    },
    never_line:
      "No developer pays us. Ever. And no one can pay to change, hide, delay or preview a score.",
    meta: { generated_at: NOW, disclaimer_line: DISCLAIMER, promise_line: PROMISE },
  });
  const about = () => ({
    schema: "plinth.about/1",
    identity: {
      placeholder_note: "Founder details are placeholders until the founder supplies them.",
      photo_line: "A real photo, supplied by the founder. Never AI-generated.",
      register: [
        { label: "Company", value: "[COMPANY NAME] Private Limited" },
        { label: "Company number", value: "CIN [CIN]" },
        { label: "Registered office", value: "[REGISTERED ADDRESS], Gurugram, Haryana [PIN]" },
        { label: "GST", value: "GSTIN [GSTIN]" },
        { label: "Founder and director", value: "[FOUNDER NAME]" },
        {
          label: "Who funds us",
          value:
            "[FUNDING: the founder, or investor names]. No developer owns any part of Plinth, and none ever will.",
        },
        { label: "HARERA agent number", value: "None yet. We don't broker any sale." },
      ],
    },
    calibration: {
      pill: "Illustrative numbers",
      rows: sc.calibration.map((c) => ({
        band: c.band,
        label: BANDS[c.band].label,
        said_low: c.range_low,
        said_high: c.range_high,
        n_projects: c.n_projects,
        n_late: c.n_late,
        per_100: c.per_100,
        inside_range: c.per_100 >= c.range_low && c.per_100 <= c.range_high,
      })),
      base_rate: {
        n_projects: 212,
        n_late: 76,
        per_100: 36,
        line: "About 36 of 100 past Gurugram projects got their OC more than 12 months late (76 of 212).",
      },
      brier_line:
        "With a Brier score: 0.19 on these 212 projects. Lower is better. Saying “36 of 100” for every project would score 0.23.",
      first_public_bands_on: "2026-07-15",
    },
    money: {
      never_line: "No developer pays us. Ever.",
      lines: [
        "Pro: ₹999 per project · 12 months of written updates. Alerts are always free.",
        "Loans: Loan checks arrive in 2027. No lender pays us in R1.",
        "Agents: a published fee split, only when you choose them.",
      ],
    },
    response_times: [
      {
        what: "Report an error, from any page",
        promise_line: "We answer within 15 working days.",
        ref_prefix: "E",
      },
      {
        what: "Clerical fix, for developers",
        promise_line: "Fix in 2 working days.",
        ref_prefix: "CL",
      },
      {
        what: "Grievance",
        promise_line: "Acknowledge in 24 hours. Resolve in 7 days.",
        ref_prefix: "G",
      },
      {
        what: "Download my data",
        promise_line: "Ready within 24 hours; the link works for 7 days.",
        ref_prefix: null,
      },
    ],
    grievance: {
      officer: "[NAME]",
      contact: "[GRIEVANCE EMAIL]",
      line: "We acknowledge within 24 hours and resolve within 7 days.",
    },
    coverage: {
      today: {
        line: "Gurugram today.",
        items: [
          "Gurugram, under-construction RERA projects on Dwarka Expressway and in New Gurugram.",
        ],
      },
      next: [
        { name: "Golf Course Extension Road", when_line: "Planned for Dec 2026", notify: true },
        { name: "Loans", when_line: "Loan checks arrive in 2027", notify: true },
        {
          name: "Resale and transfer checks",
          when_line: "R2 · planned for Apr–Jun 2027",
          notify: true,
        },
        {
          name: "Help at possession: OC, final demand, delay interest",
          when_line: "R3 · planned for Jul–Sep 2027",
          notify: true,
        },
        {
          name: "Noida and Greater Noida West",
          when_line: "R3 · planned for Jul–Sep 2027",
          notify: true,
        },
      ],
    },
    meta: { generated_at: NOW, promise_line: PROMISE, disclaimer_line: DISCLAIMER },
  });
  // api.flags() for an anonymous caller in the fixture world: T04's seeded defaults
  // (20261020000700), with bands_public turned on and the AI kill switches turned off
  // until M5 by 30_scoring.sql (§5b round 2, C-29). Internal- and user-audience flags read
  // false for anon.
  const flags = () => ({
    bands_public: true,
    harera_live_fetch: false,
    ai_ask: false,
    ai_doc_check: false,
    ai_staging: false,
    wa_outbound: false,
    wa_inbound: false,
    push_outbound: false,
    email_outbound: false,
    since_replay_slider: false,
    family_circle: false,
    dev_workspace: false,
    visit_booking: false,
    broker_layer: false,
    buyer_signals: false,
    pro_paywall: false,
    map_tiles: false,
    facts_only_global: false,
    maintenance_mode: false,
  });

  return {
    riskSummary,
    projectPage,
    evidence,
    developerPage,
    searches,
    compare,
    methodology,
    about,
    flags,
  };
}
