// Canonical fixtures, part 2: scoring (published output of v1.2) and "From the developer" content.
import { R2, R3, S5, S5B, S5B_ENG, S5B_SWEEP, derived } from "./canonical.mjs";
import { uuid5 } from "./lib.mjs";

export const BANDS = {
  low: { label: "Low", step: 1, low: 5, high: 15, point: 10 },
  moderate: { label: "Moderate", step: 2, low: 15, high: 30, point: 20 },
  elevated: { label: "Elevated", step: 3, low: 30, high: 45, point: null },
  high: { label: "High", step: 4, low: 45, high: 65, point: null },
  severe: { label: "Severe", step: 5, low: 65, high: 80, point: null },
};

const AH2 = "aurelia-heights-phase-2";
const CUTOFF = "2026-10-14";

export function buildScoring(cat, ev) {
  const factId = (key) => {
    const f = ev.facts.find((x) => x.key === key);
    if (!f) throw new Error(`no fact ${key}`);
    return f.id;
  };
  const factor_weights = { finances: 30, track_record: 30, timeline: 20, legal: 15, site: 5 };
  const band_ranges = Object.fromEntries(
    Object.entries(BANDS).map(([k, b]) => [k, { low: b.low, high: b.high }]),
  );
  const model = (
    version,
    released_on,
    approved_on,
    stale_days,
    blanket,
    title,
    changelog,
    note,
  ) => ({
    id: uuid5("score_model", version),
    version,
    released_on,
    approved_on,
    status: version === "v1.2" ? "current" : "retired",
    title,
    changelog,
    note,
    config: {
      target: "late12: OC more than 12 months after the original RERA date plus blanket extensions",
      factor_weights,
      band_ranges,
      high_confidence_points: { low: 10, moderate: 20 },
      confidence: { min_finished: 8 },
      limited_history: { min_finished: 3 },
      not_scored: { min_months_registered: 6 },
      stale_days,
      rescore_hours: 72,
      blanket_extensions: blanket,
      late_filings_window_quarters: 8,
      red_flag_rules: [
        "RF1_GROUP_CIRP",
        "RF2_REGISTRATION_REVOKED",
        "RF3_STOP_SALE",
        "RF4_GROUP_DEFAULT",
      ],
    },
    source: `${R2("C-15")}; changelog lines and committee dates: WebMethodology artboard`,
  });
  const score_models = [
    model(
      "v1.0",
      "2026-07-15",
      "2026-07-08",
      180,
      false,
      "First public bands for Gurugram",
      [
        "Five bands with natural frequencies, up to 4 sourced reasons, and a developer reply on every card.",
        "Replaced v0.9, which published facts only, with no bands.",
      ],
      "Approved by the methodology committee on 8 Jul 2026.",
    ),
    model(
      "v1.1",
      "2026-09-02",
      "2026-08-26",
      180,
      false,
      "Tighter QPR checks and group linking",
      [
        "A QPR whose built share falls from the last quarter now counts as a filing problem.",
        "Group companies are linked by common directors and shareholding, using MCA data from a licensed vendor.",
      ],
      "Approved by the methodology committee on 26 Aug 2026.",
    ),
    model(
      "v1.2",
      "2026-10-14",
      "2026-10-09",
      120,
      true,
      "Blanket extensions added to every original date",
      [
        "The 4-month MoHUA extension of Jul 2026 is now added to every original RERA date before we measure Late12.",
        "Extensions granted to a single project are still not added. They are part of what we predict.",
        "The stale flag now shows when a key input is more than 120 days old, down from 180.",
      ],
      "Approved by the methodology committee on 9 Oct 2026. Every band was recalculated on 14 Oct 2026.",
    ),
  ];

  const rfSrc = "WebMethodology/WebProjectStates artboards; codes DATA_MODEL §3";
  const red_flag_rules = [
    [
      "RF1_GROUP_CIRP",
      1,
      "Insolvency (CIRP) admitted against the promoter or a group company",
      "The band is Severe while the case stands.",
    ],
    [
      "RF2_REGISTRATION_REVOKED",
      2,
      "RERA registration revoked, de-registered or lapsed without an extension",
      "Applies from the day HARERA records the revocation, or the day a registration lapses with no extension.",
    ],
    [
      "RF3_STOP_SALE",
      3,
      "A stop-sale or abeyance order from the regulator",
      "Applies while the order stands. When it is lifted, the model's band returns and the change is logged.",
    ],
    [
      "RF4_GROUP_DEFAULT",
      4,
      "The promoter group is rated D or is in default",
      "We quote the rating agency's own symbol and date, exactly as published.",
    ],
  ].map(([code, n, title, text]) => ({
    id: uuid5("red_flag_rule", code),
    code,
    n,
    title,
    text,
    published_on: null,
    source: rfSrc,
  }));
  const red_flags = [
    {
      id: uuid5("red_flag", "elmstone-developers/RF1"),
      rule_code: "RF1_GROUP_CIRP",
      subject_type: "group",
      subject: "elmstone-developers",
      triggered_on: "2023-03-12",
      cleared_on: null,
      fact_ids: [factId("elmstone-developers/insolvency-admitted")],
      source: S5B,
    },
  ];

  const reason_templates = [
    ["FIN_SOLD_AHEAD_BUILT", "finances", "{sold}% of units sold, {built}% built."],
    [
      "TIM_TIME_USED_LATE_QPRS",
      "timeline",
      "{time_used}% of the promised time used. QPRs filed late in {late} of the last 8 quarters.",
    ],
    [
      "TIM_BUILT_VS_TIME",
      "timeline",
      "{built}% built with {time_used}% of the promised time used.",
    ],
    [
      "TIM_BUILT_VS_TIME_EXTENSIONS",
      "timeline",
      "{built}% built with {time_used}% of the promised time used. {extensions} extensions on record.",
    ],
    ["TIM_QPR_LATE", "timeline", "The {quarter} QPR was filed {days} days late."],
    ["TIM_QPR_MISSING", "timeline", "The {quarter} QPR, due {due}, is not on HARERA."],
    [
      "TIM_PAST_ORIGINAL_DATE",
      "timeline",
      "Original completion was {month}. That date has passed with {built}% built.",
    ],
    [
      "LEG_COMPLAINTS",
      "legal",
      "{count} complaints decided against the promoter in 24 months · {rate} per 100 units. Median count for similar projects: {median}.",
    ],
    [
      "LEG_GROUP_CIRP",
      "legal",
      "A group company of {group} was admitted to insolvency by NCLT order on {date}.",
    ],
    [
      "TRK_GROUP_LATE12",
      "track_record",
      "{late} of the group's {finished} finished RERA projects got OC more than 12 months late.",
    ],
    ["TIM_QPR_ON_TIME", "timeline", "QPRs filed on time in each of the last {n} quarters."],
    [
      "SITE_STALL",
      "site",
      "No QPR progress for {n} quarters: {built}% built in each QPR from {from} to {to}.",
    ],
  ].map(([code, factor, template_en]) => ({
    id: uuid5("reason_template", `${code}/v1.2`),
    code,
    factor,
    template_en,
    version: "v1.2",
    source: `Aurelia texts BUILD_PLAN §7.1; others ${R2("C-05, C-16")}`,
  }));

  const runs = [];
  const reasons = [];
  const band_history = [];
  const run = (o) => {
    const b = o.band ? BANDS[o.band] : null;
    const conf = o.confidence ?? null;
    let freq = { freq_kind: null, freq_low: null, freq_high: null, freq_point: null };
    if (b && o.set_by === "model")
      freq =
        conf === "high" && b.point != null
          ? { freq_kind: "point", freq_low: b.point, freq_high: b.point, freq_point: b.point }
          : { freq_kind: "range", freq_low: b.low, freq_high: b.high, freq_point: null };
    const r = {
      id: uuid5("score_run", `${o.phase}/${o.model_version}/${o.computed_on}`),
      phase: o.phase,
      model_version: o.model_version,
      data_cutoff: o.data_cutoff,
      computed_on: o.computed_on,
      published_on: o.published_on ?? null,
      code_commit: null,
      status: o.status,
      state: o.state,
      band: o.band ?? null,
      set_by: o.set_by ?? null,
      rule_code: o.rule_code ?? null,
      confidence: conf,
      ...freq,
      stall: !!o.stall,
      stale: !!o.stale,
      what_would_change: o.what_would_change ?? null,
      supersedes: o.supersedes ?? null,
      notice: o.notice ?? null,
      source: o.source,
    };
    runs.push(r);
    (o.reasons ?? []).forEach((x, i) =>
      reasons.push({
        run: r.id,
        phase: o.phase,
        rank: i + 1,
        factor: x.factor,
        code: x.code,
        text: x.text,
        fact_ids: x.facts.map(factId),
        source: x.source ?? o.source,
      }),
    );
    return r;
  };
  const histSrc = R2("C-17");

  // Aurelia: Moderate (v1.0, 15 Jul) → Elevated (v1.1, 2 Oct; heads-up 30 Sep) → v1.2 recalculation (14 Oct, unchanged).
  const a10 = run({
    phase: AH2,
    model_version: "v1.0",
    data_cutoff: "2026-07-15",
    computed_on: "2026-07-15",
    published_on: "2026-07-15",
    status: "superseded",
    state: "scored",
    band: "moderate",
    set_by: "model",
    confidence: "low",
    source: `${S5B} (Moderate from first scoring until 2 Oct 2026); first scoring 15 Jul 2026 per DATA_MODEL §3 and BUILD_PLAN §7.1`,
  });
  // The v1.1 release (2 Sep 2026) kept Aurelia at Moderate; the old share card (data as of
  // 30 Sep 2026, model v1.1, Moderate) was issued from this run.
  const a11m = run({
    phase: AH2,
    model_version: "v1.1",
    data_cutoff: "2026-09-02",
    computed_on: "2026-09-02",
    published_on: "2026-09-02",
    status: "superseded",
    state: "scored",
    band: "moderate",
    set_by: "model",
    confidence: "low",
    supersedes: a10.id,
    source: `${S5B} (Moderate until 2 Oct 2026; old card of 30 Sep 2026 shows v1.1 Moderate); v1.1 release ${R2("C-15")}`,
  });
  const a11 = run({
    phase: AH2,
    model_version: "v1.1",
    data_cutoff: "2026-09-30",
    computed_on: "2026-09-30",
    published_on: "2026-10-02",
    status: "superseded",
    state: "scored",
    band: "elevated",
    set_by: "model",
    confidence: "low",
    supersedes: a11m.id,
    notice: uuid5("band_notice", `${AH2}/heads_up_48h/2026-09-30`),
    source: `${S5B} (Elevated since 2 Oct 2026; heads-up sent 30 Sep 2026, 48 hours before)`,
  });
  const a12 = run({
    phase: AH2,
    model_version: "v1.2",
    data_cutoff: CUTOFF,
    computed_on: CUTOFF,
    published_on: CUTOFF,
    status: "published",
    state: "scored",
    band: "elevated",
    set_by: "model",
    confidence: "low",
    supersedes: a11.id,
    what_would_change:
      "Two consecutive quarters with construction ahead of sales would move this to Moderate.",
    reasons: [
      {
        factor: "finances",
        code: "FIN_SOLD_AHEAD_BUILT",
        text: "72% of units sold, 41% built.",
        facts: [`${AH2}/qpr/2026-Q2/progress`],
      },
      {
        factor: "timeline",
        code: "TIM_TIME_USED_LATE_QPRS",
        text: "77% of the promised time used. QPRs filed late in 3 of the last 8 quarters.",
        facts: [`${AH2}/qpr-register`],
      },
      {
        factor: "legal",
        code: "LEG_COMPLAINTS",
        text: "14 complaints decided against the promoter in 24 months · 2.8 per 100 units. Median count for similar projects: 3.",
        facts: [`${AH2}/complaints-24m`],
      },
      {
        factor: "track_record",
        code: "TRK_GROUP_LATE12",
        text: "2 of the group's 6 finished RERA projects got OC more than 12 months late.",
        facts: ["northfield-estates/track-record"],
      },
    ].map((x) => ({ ...x, source: "BUILD_PLAN §7.1 (exact text); numbers DESIGN §5/§5b" })),
    source: S5B,
  });
  const pending = run({
    phase: AH2,
    model_version: "v1.2",
    data_cutoff: "2026-10-18",
    computed_on: "2026-10-18",
    status: "pending_notice",
    state: "scored",
    band: "high",
    set_by: "model",
    confidence: "low",
    supersedes: a12.id,
    notice: uuid5("band_notice", `${AH2}/notice_7day/2026-10-18`),
    source: `${S5B} (Elevated → High proposed; effective 25 Oct 2026 only if the Jul–Sep QPR is still missing; never shown to buyers)`,
  });
  band_history.push(
    {
      phase: AH2,
      band: "moderate",
      state: "scored",
      confidence: "low",
      from_date: "2026-07-15",
      to_date: "2026-09-02",
      run: a10.id,
      model_version: "v1.0",
      source: S5B,
    },
    {
      phase: AH2,
      band: "moderate",
      state: "scored",
      confidence: "low",
      from_date: "2026-09-02",
      to_date: "2026-10-02",
      run: a11m.id,
      model_version: "v1.1",
      source: `${S5B} (old card, 30 Sep 2026, v1.1, Moderate)`,
    },
    {
      phase: AH2,
      band: "elevated",
      state: "scored",
      confidence: "low",
      from_date: "2026-10-02",
      to_date: CUTOFF,
      run: a11.id,
      model_version: "v1.1",
      source: S5B,
    },
    {
      phase: AH2,
      band: "elevated",
      state: "scored",
      confidence: "low",
      from_date: CUTOFF,
      to_date: null,
      run: a12.id,
      model_version: "v1.2",
      source: S5B,
    },
  );

  const others = [
    {
      phase: "kestrel-park",
      state: "scored",
      band: "low",
      set_by: "model",
      confidence: "high",
      source: S5,
      what_would_change:
        "Low is the lowest band. Late QPRs, an extension or more complaints decided against the promoter would move it up.",
      reasons: [
        {
          factor: "timeline",
          code: "TIM_BUILT_VS_TIME",
          text: "63% built with 58% of the promised time used.",
          facts: ["kestrel-park/qpr/2026-Q3/progress", "kestrel-park/time-used"],
        },
        {
          factor: "track_record",
          code: "TRK_GROUP_LATE12",
          text: "1 of the group's 9 finished RERA projects got OC more than 12 months late.",
          facts: ["orbis-land/track-record"],
        },
        {
          factor: "legal",
          code: "LEG_COMPLAINTS",
          text: "2 complaints decided against the promoter in 24 months · 0.5 per 100 units. Median count for similar projects: 3.",
          facts: ["kestrel-park/complaints-24m"],
        },
      ],
    },
    {
      phase: "sapphire-grove-phase-1",
      state: "scored",
      band: "moderate",
      set_by: "model",
      confidence: "high",
      source: S5,
      what_would_change:
        "Two consecutive quarters of construction at or ahead of schedule would move this to Low.",
      reasons: [
        {
          factor: "timeline",
          code: "TIM_BUILT_VS_TIME",
          text: "48% built with 55% of the promised time used.",
          facts: [
            "sapphire-grove-phase-1/qpr/2026-Q2/progress",
            "sapphire-grove-phase-1/time-used",
          ],
        },
        {
          factor: "legal",
          code: "LEG_COMPLAINTS",
          text: "5 complaints decided against the promoter in 24 months · 1.4 per 100 units. Median count for similar projects: 3.",
          facts: ["sapphire-grove-phase-1/complaints-24m"],
        },
        {
          factor: "timeline",
          code: "TIM_QPR_LATE",
          text: "The Apr–Jun 2026 QPR was filed 12 days late.",
          facts: ["sapphire-grove-phase-1/qpr/2026-Q2/status"],
        },
        {
          factor: "track_record",
          code: "TRK_GROUP_LATE12",
          text: "2 of the group's 11 finished RERA projects got OC more than 12 months late.",
          facts: ["meridian-habitat/track-record"],
        },
      ],
    },
    {
      phase: "coral-towers",
      state: "scored",
      band: "high",
      set_by: "model",
      confidence: "low",
      stale: true,
      source: S5,
      what_would_change:
        "Two consecutive quarters of construction at or ahead of schedule would move this to Elevated.",
      reasons: [
        {
          factor: "timeline",
          code: "TIM_BUILT_VS_TIME_EXTENSIONS",
          text: "22% built with 70% of the promised time used. 2 extensions on record.",
          facts: [
            "coral-towers/qpr/2026-Q1/progress",
            "coral-towers/time-used",
            "coral-towers/extension-1",
            "coral-towers/extension-2",
          ],
        },
        {
          factor: "timeline",
          code: "TIM_QPR_MISSING",
          text: "The Apr–Jun 2026 QPR, due 15 Jul 2026, is not on HARERA.",
          facts: ["coral-towers/qpr/2026-Q2/missing"],
        },
      ],
    },
    {
      phase: "laurel-residency",
      state: "scored",
      band: "severe",
      set_by: "red_flag_rule",
      rule_code: "RF1_GROUP_CIRP",
      confidence: null,
      stall: true,
      source: S5B,
      what_would_change:
        "The rule applies while the insolvency case stands. If it is closed or set aside, the model sets the band again, and we log the change.",
      reasons: [
        {
          factor: "legal",
          code: "LEG_GROUP_CIRP",
          text: "A group company of Elmstone Developers was admitted to insolvency by NCLT order on 12 Mar 2023.",
          facts: ["elmstone-developers/insolvency-admitted"],
        },
        {
          factor: "timeline",
          code: "TIM_PAST_ORIGINAL_DATE",
          text: "Original completion was Jun 2026. That date has passed with 34% built.",
          facts: ["laurel-residency/registration", "laurel-residency/qpr/2026-Q2/progress"],
        },
        {
          factor: "site",
          code: "SITE_STALL",
          text: "No QPR progress for 4 quarters: 34% built in each QPR from Jul–Sep 2025 to Apr–Jun 2026.",
          facts: [
            "laurel-residency/qpr/2025-Q3/progress",
            "laurel-residency/qpr/2025-Q4/progress",
            "laurel-residency/qpr/2026-Q1/progress",
            "laurel-residency/qpr/2026-Q2/progress",
          ],
        },
      ],
    },
    {
      phase: "juniper-enclave",
      state: "limited_history",
      band: null,
      set_by: null,
      confidence: null,
      source: S5B,
      what_would_change:
        "Halcyon Homes' first finished projects. Each one adds to the record we score from.",
      reasons: [],
    },
    {
      phase: "heron-point-phase-2",
      state: "not_scored",
      band: null,
      set_by: null,
      confidence: null,
      source: `${S5B}; registration day ${S5B_ENG}`,
      what_would_change:
        "Enough quarterly reports to compare building with time. We score as soon as there are.",
      reasons: [],
    },
    {
      phase: "cedar-walk-phase-2",
      state: "scored",
      band: "moderate",
      set_by: "model",
      confidence: "low",
      source: `${S5} (Moderate); ${R2("C-05")}`,
      what_would_change:
        "Two consecutive quarters of construction at or ahead of schedule would move this to Low.",
      reasons: [
        {
          factor: "timeline",
          code: "TIM_BUILT_VS_TIME",
          text: "70% built with 92% of the promised time used.",
          facts: ["cedar-walk-phase-2/qpr/2026-Q2/progress", "cedar-walk-phase-2/time-used"],
        },
        {
          factor: "track_record",
          code: "TRK_GROUP_LATE12",
          text: "2 of the group's 6 finished RERA projects got OC more than 12 months late.",
          facts: ["northfield-estates/track-record"],
        },
        {
          factor: "timeline",
          code: "TIM_QPR_ON_TIME",
          text: "QPRs filed on time in each of the last 8 quarters.",
          facts: ["cedar-walk-phase-2/qpr-register"],
        },
      ],
    },
  ];
  for (const o of others) {
    const r10 = run({
      ...o,
      model_version: "v1.0",
      data_cutoff: "2026-07-15",
      computed_on: "2026-07-15",
      published_on: "2026-07-15",
      status: "superseded",
      what_would_change: null,
      reasons: [],
      // Coral's v1.0 run is not stale (R3 C-30): on 15 Jul 2026 its newest QPR (filed 14 Apr
      // 2026) was 92 days old, under v1.0's 180-day line. T11's ledger flips the same field.
      stale: o.phase === "coral-towers" ? false : o.stale,
      source:
        o.phase === "coral-towers"
          ? `${histSrc}; not stale at 15 Jul 2026 ${R3("C-30")} (newest QPR 92 days old, under v1.0's 180-day line)`
          : histSrc,
    });
    const r12 = run({
      ...o,
      model_version: "v1.2",
      data_cutoff: CUTOFF,
      computed_on: CUTOFF,
      published_on: CUTOFF,
      status: "published",
      supersedes: r10.id,
      reasons: o.reasons.map((x) => ({
        ...x,
        source: `numbers ${S5}/${S5B}; text ${R2("C-16")}`,
      })),
    });
    band_history.push(
      {
        phase: o.phase,
        band: o.band,
        state: o.state,
        confidence: o.confidence,
        from_date: "2026-07-15",
        to_date: CUTOFF,
        run: r10.id,
        model_version: "v1.0",
        source: histSrc,
      },
      {
        phase: o.phase,
        band: o.band,
        state: o.state,
        confidence: o.confidence,
        from_date: CUTOFF,
        to_date: null,
        run: r12.id,
        model_version: "v1.2",
        source: o.source,
      },
    );
  }

  const band_notices = [
    {
      id: uuid5("band_notice", `${AH2}/heads_up_48h/2026-09-30`),
      phase: AH2,
      kind: "heads_up_48h",
      from_band: "moderate",
      to_band: "elevated",
      proposed_run: a11.id,
      reason_text: "The Apr–Jun 2026 QPR together with new complaint orders.",
      trigger_fact_ids: [factId(`${AH2}/qpr/2026-Q2/progress`), factId(`${AH2}/complaints-24m`)],
      sent_on: "2026-09-30",
      effective_on: "2026-10-02",
      public_marker_text: null,
      status: "effective",
      source: S5B,
    },
    {
      id: uuid5("band_notice", `${AH2}/notice_7day/2026-10-18`),
      phase: AH2,
      kind: "notice_7day",
      from_band: "elevated",
      to_band: "high",
      proposed_run: pending.id,
      reason_text: "The Jul–Sep 2026 QPR, due 15 Oct 2026, is not on HARERA.",
      trigger_fact_ids: [factId(`${AH2}/qpr/2026-Q3/missing`)],
      sent_on: "2026-10-18",
      effective_on: "2026-10-25",
      public_marker_text:
        "If it is still missing on 25 Oct 2026, this band may change; followers hear first.",
      status: "pending",
      source: S5B,
    },
  ];

  const calibration = [
    ["low", 46, 4],
    ["moderate", 61, 19],
    ["elevated", 52, 20],
    ["high", 34, 19],
    ["severe", 19, 14],
  ].map(([band, n, late]) => ({
    id: uuid5("calibration", `v1.2/${band}`),
    model_version: "v1.2",
    band,
    range_low: BANDS[band].low,
    range_high: BANDS[band].high,
    n_projects: n,
    n_late: late,
    per_100: Math.round((late / n) * 100),
    illustrative: true,
    source: R2("C-15"),
  }));
  const calibration_summary = {
    model_version: "v1.2",
    n_projects: 212,
    n_late: 76,
    base_rate_per_100: 36,
    brier: 0.19,
    brier_baseline: 0.23,
    illustrative: true,
    reference_class_line: "Gurugram RERA phases registered 2017–2021 (illustrative backtest).",
    source: `${S5B} (76 of 212, about 36 of 100); Brier scores BUILD_PLAN §7.1`,
  };
  const methodology_changelog = score_models.map((m) => ({
    version: m.version,
    published_on: m.released_on,
    summary: m.title,
    minutes_url: null,
    source: m.source,
  }));
  const rescoring = [
    {
      phase: "sapphire-grove-phase-1",
      trigger_fact: factId("sapphire-grove-phase-1/qpr/2026-Q3/filing"),
      quarter: "2026-Q3",
      filed_on: "2026-10-15",
      appeared_on: "2026-10-16",
      fetched_at: "2026-10-16T19:40:00+05:30",
      due_by: "2026-10-19T19:40:00+05:30",
      status: "reading",
      source: S5B,
    },
  ];
  const stale = [
    {
      phase: "coral-towers",
      latest_quarter: "2026-Q1",
      latest_filed_on: "2026-04-14",
      age_days_on_clock: 187,
      stale_after_days: 120,
      source: S5B,
    },
  ];
  const stalls = [
    {
      phase: "laurel-residency",
      quarters: ["2025-Q3", "2025-Q4", "2026-Q1", "2026-Q2"],
      built_pct: 34,
      source: S5B,
    },
  ];

  return {
    schema: "plinth.fixtures.scoring/1",
    note: "Published output of scoring v1.2 for the fixture world (cutoff 14 Oct 2026). T11's `plinth-pipe score --fixtures --as-of 2026-10-14 --emit json` must reproduce this file. Internal values (internal_points, p_late12, reason contributions) are deliberately not part of it. Generated; edit src/author.",
    data_cutoff: CUTOFF,
    model_version: "v1.2",
    score_models,
    red_flag_rules,
    red_flags,
    reason_templates,
    runs,
    reasons,
    band_history,
    band_notices,
    calibration,
    calibration_summary,
    methodology_changelog,
    rescoring,
    stale,
    stalls,
  };
}

export function buildDeveloperContent(cat, ev) {
  const unit = (phase, label) =>
    cat.unit_types.find((u) => u.phase === phase && u.label === label).id;
  const pl = (phase, published_on, precision, items, source, note = null) => ({
    id: uuid5("price_list", `${phase}/${published_on}`),
    phase,
    published_on,
    published_precision: precision,
    status: "published",
    version: 1,
    lane: "from_developer",
    note,
    items: items.map(([label, base, psf]) => ({
      unit_type: unit(phase, label),
      unit_label: label,
      base_price_inr: base,
      per_sqft_carpet_inr: psf,
    })),
    source,
  });
  const price_lists = [
    pl(
      AH2,
      "2023-01-01",
      "month",
      [
        ["3 BHK", 15800000, null],
        ["4 BHK", 22700000, null],
      ],
      S5B,
      "Launch",
    ),
    pl(
      AH2,
      "2025-07-01",
      "day",
      [
        ["3 BHK", 20300000, null],
        ["4 BHK", 29200000, null],
      ],
      S5B,
    ),
    pl(
      AH2,
      "2026-04-01",
      "day",
      [
        ["3 BHK", 22400000, null],
        ["4 BHK", 32200000, null],
      ],
      S5B,
    ),
    pl(
      AH2,
      "2026-10-02",
      "day",
      [
        ["3 BHK", 23500000, 16207],
        ["4 BHK", 33800000, 16095],
      ],
      S5B,
    ),
    pl(
      "kestrel-park",
      "2026-10-01",
      "month",
      [
        ["2 BHK", 15800000, null],
        ["3 BHK", 21000000, null],
      ],
      `${S5B} (price lists of Oct 2026)`,
    ),
    pl(
      "sapphire-grove-phase-1",
      "2026-10-16",
      "day",
      [
        ["3 BHK", 19500000, null],
        ["3 BHK + study", 22600000, null],
      ],
      `${S5B} (3 BHK ₹1.89 Cr → ₹1.95 Cr on 16 Oct 2026; 3 BHK + study from the Oct 2026 lists)`,
    ),
    pl(
      "coral-towers",
      "2026-10-01",
      "month",
      [
        ["2 BHK", 12800000, null],
        ["3 BHK", 16200000, null],
      ],
      `${S5B} (price lists of Oct 2026)`,
    ),
    pl(
      "juniper-enclave",
      "2026-10-01",
      "month",
      [["3 BHK", 22500000, null]],
      `${S5B} (price lists of Oct 2026)`,
    ),
    pl(
      "cedar-walk-phase-2",
      "2026-06-12",
      "day",
      [["3 BHK", 18500000, null]],
      `${S5B} (dated 12 Jun 2026); 3 BHK from ₹1.85 Cr ${R2("C-05")}`,
    ),
  ];
  const previous_prices = [
    {
      phase: "sapphire-grove-phase-1",
      unit_label: "3 BHK",
      base_price_inr: 18900000,
      superseded_on: "2026-10-16",
      source: S5B,
    },
  ];
  const quotes_without_list = [
    {
      phase: "laurel-residency",
      unit_label: "3 BHK",
      base_price_inr: 14800000,
      dated: null,
      source: `${S5B} (3 BHK quoted ₹1.48 Cr; no list date in §5b)`,
    },
  ];

  const stages = [
    ["Booking", "booking", null, 10],
    ["Registered agreement (within 45 days)", "agreement", null, 10],
    ["Foundation", "foundation", null, 10],
    ...[3, 6, 9, 12, 15, 18, 20].map((n) => [
      n === 20 ? "Slab 20 (top)" : `Slab ${n}`,
      "slab",
      n,
      7.5,
    ]),
    ["Brickwork and plaster", "brickwork", null, 7.5],
    ["Flooring and finishing", "finishing", null, 5],
    ["Offer of possession", "possession", null, 5],
  ];
  const payment_plans = [
    {
      id: uuid5("payment_plan", `${AH2}/construction_linked`),
      phase: AH2,
      kind: "construction_linked",
      name: "Construction-linked plan",
      published_on: "2026-10-02",
      status: "published",
      lane: "from_developer",
      stages: stages.map(([label, stage_kind, slab_no, pct], i) => ({
        seq: i + 1,
        label,
        stage_kind,
        slab_no,
        pct,
      })),
      due_by_registration_pct: { A: 52.5, B: 45, C: 37.5 },
      source: `${S5B}; 13 stages ${R2("C-18")}`,
    },
  ];

  const cost_sheets = [
    {
      id: uuid5("cost_sheet", `${AH2}/3bhk/2026-10-02`),
      phase: AH2,
      unit_type: unit(AH2, "3 BHK"),
      unit_label: "3 BHK",
      dated: "2026-10-02",
      option_label: "park-facing",
      carpet_sqft: 1450,
      super_sqft: 2000,
      lane: "from_developer",
      pages: 2,
      edc_idc_line: "Included in the base",
      lines: [
        { seq: 1, code: "base", label: "Base", amount_inr: 23500000, tag: null },
        {
          seq: 2,
          code: "plc",
          label: "PLC (park-facing)",
          amount_inr: 290000,
          tag: "often_negotiable",
        },
        { seq: 3, code: "club", label: "Club", amount_inr: 150000, tag: "often_negotiable" },
        { seq: 4, code: "parking", label: "Parking", amount_inr: 350000, tag: null },
        { seq: 5, code: "ifms", label: "IFMS", amount_inr: 130000, tag: "refundable_deposit" },
        { seq: 6, code: "gst", label: "GST 5%", amount_inr: 1221000, tag: "set_by_law" },
        {
          seq: 7,
          code: "stamp_registration",
          label: "Stamp duty + registration",
          amount_inr: 1759400,
          tag: "set_by_law",
        },
      ],
      charges_total_inr: 920000,
      all_in_inr: 27400400,
      per_sqft_carpet_inr: 18900,
      source: `${S5B} (§5b rounds the lines); exact rupees ${derived("rules v2026.10: GST 5% of base + charges, stamp duty 7% of base + charges + ₹50,000 registration (DATA_MODEL core.cost_rule_sets)")}; 7 lines per ${S5B_SWEEP}`,
    },
  ];
  const cost_rule_sets = [
    {
      version: "2026.10",
      state: "HR",
      effective_from: null,
      gst_uc_pct: 5,
      stamp_duty_pct: { male: 7, female: 5, joint: 6 },
      registration_fee_inr: 50000,
      rounding: {
        all_in_per_sqft_carpet_inr: 100,
        price_list_per_sqft_inr: 1,
        afford_all_in_inr: 100000,
      },
      source: `DATA_MODEL §1 core.cost_rule_sets; afford rounding ${S5B_ENG}`,
    },
  ];

  const developer_documents = [
    {
      id: uuid5("developer_document", `${AH2}/floor_plan`),
      phase: AH2,
      kind: "floor_plan",
      dated: "2026-10-02",
      lane: "from_developer",
      storage_key: "media/floorPlan3bhk.jpg",
      summary: {
        rooms: {
          "3 BHK": [
            "Living + dining 22′ × 13′",
            "Master bedroom 14′ × 14′ with dress and toilet",
            "Bedroom 2 12′ × 14′",
            "Bedroom 3 12′ × 12′",
            "Kitchen 10′ × 11′",
            "Utility 12′ × 8′",
            "3 toilets",
            "Balcony 22′ × 5′",
          ],
          "4 BHK": [
            "Living + dining 27′ × 15′",
            "Master bedroom 14′ × 16′",
            "Bedrooms 13′ × 15′, 13′ × 13′ and 12′ × 14′",
            "Kitchen 9′ × 12′",
            "Utility",
            "Store",
            "4 toilets",
          ],
        },
      },
      source: S5B,
    },
    {
      id: uuid5("developer_document", `${AH2}/brochure`),
      phase: AH2,
      kind: "brochure",
      dated: "2026-10-02",
      lane: "from_developer",
      storage_key: null,
      summary: {
        amenities: [
          "A clubhouse with a pool and a gym",
          "A central park (park-facing homes pay the PLC)",
          "Covered parking on two basement levels",
          "Power back-up for lifts and common areas",
        ],
        lenders_claim: "approved by major banks",
      },
      source: S5B,
    },
    {
      id: uuid5("developer_document", `${AH2}/transfer_policy`),
      phase: AH2,
      kind: "transfer_policy",
      dated: "2026-10-02",
      lane: "from_developer",
      storage_key: null,
      summary: {
        fee_per_sqft_super_inr: 150,
        fee_3bhk_inr: 300000,
        rules: [
          "All dues to date paid first.",
          "No transfer before the agreement for sale is registered.",
        ],
      },
      source: S5B,
    },
    {
      id: uuid5("developer_document", `${AH2}/draft_agreement`),
      phase: AH2,
      kind: "draft_agreement",
      dated: "2026-10-02",
      lane: "from_developer",
      storage_key: null,
      summary: {
        edc_idc_increase:
          "Northfield may bill each buyer a share of any later government EDC/IDC increase, by super area.",
        completion_date: "2027-12",
      },
      source: S5B,
    },
  ];
  const developer_claims = [
    {
      id: uuid5("developer_claim", `${AH2}/qpr-2026-Q3-filed`),
      phase: AH2,
      text: "Filed on 12 Oct 2026.",
      said_on: "2026-10-15",
      check_by: "2026-11-05",
      verified_state: "unverified",
      linked_fact: ev.facts.find((f) => f.key === `${AH2}/qpr/2026-Q3/missing`).id,
      public: true,
      source: `${S5B} ("filed on 12 Oct 2026"); dates API_CONTRACTS §2.1`,
    },
  ];
  const developer_replies = [
    {
      id: uuid5("developer_reply", `${AH2}/2026-10-15`),
      phase: AH2,
      text: "Tower B structure was completed in September 2026. The QPR for Jul–Sep 2026 was filed on 12 October.",
      signatory_title: "Authorised signatory",
      signatory_name: "Ananya Rao",
      signed_line: "Ananya Rao, authorised signatory, Northfield Estates",
      scope: "project",
      published_on: "2026-10-15",
      check_by: "2026-11-05",
      status: "published",
      source: `${S5B} (published 15 Oct 2026; checked by 5 Nov 2026); ${R2("C-19")}`,
    },
    {
      // Group-level reply on the developer page (Heron Point Ph 1 fire NOC), same signatory.
      id: uuid5("developer_reply", "northfield-estates/2026-10-15"),
      phase: "heron-point-phase-1",
      text: "Heron Point, Phase 1 was ready in March 2024. Its OC then waited 15 months for a state fire NOC. On Aurelia Heights, Phase 2, the Tower B structure was completed in September 2026.",
      signatory_title: "Authorised signatory",
      signatory_name: "Ananya Rao",
      signed_line: "Ananya Rao, authorised signatory, Northfield Estates",
      scope: "group",
      published_on: "2026-10-15",
      check_by: "2026-11-05",
      status: "published",
      source: `${R2("C-19")}; text from the WebDeveloper artboard`,
    },
  ];
  const live_record_links = [
    {
      id: uuid5("live_record_link", "AH2"),
      phase: AH2,
      code: "AH2",
      short_url: "https://plinth.in/r/AH2",
      source: S5B,
    },
  ];

  return {
    schema: "plinth.fixtures.developer_content/1",
    note: '"From the developer" content (ws.*): price lists, payment plans, the Aurelia cost sheet, documents, the Developer says claim and the reply. It never feeds a band. Owner: T03. Generated; edit src/author.',
    price_lists,
    previous_prices,
    quotes_without_list,
    payment_plans,
    cost_sheets,
    cost_rule_sets,
    developer_documents,
    developer_claims,
    developer_replies,
    live_record_links,
  };
}
