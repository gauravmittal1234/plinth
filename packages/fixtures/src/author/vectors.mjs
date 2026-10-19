// Golden vectors shared by SQL (canonical), TS and Dart. Numbers from DESIGN §5b; the arithmetic is shown.
import {
  addMonths,
  fmtDate,
  fmtMonth,
  fmtQuarter,
  inrExact,
  inrShort,
  quarterEndMonth,
  timeUsedPct,
} from "./lib.mjs";

const S5B = "DESIGN §5b";

export function buildVectors(cat) {
  // ---- cost: Aurelia 3 BHK (cost sheet of 2 Oct 2026), Haryana rules v2026.10
  const lines = { base: 23500000, plc: 290000, club: 150000, parking: 350000, ifms: 130000 };
  const costCase = (waive) => {
    const l = { ...lines };
    for (const w of waive) l[w] = 0;
    const charges = l.plc + l.club + l.parking + l.ifms;
    const basePlus = l.base + charges;
    const gst = Math.round(basePlus * 0.05);
    const stamp = Math.round(basePlus * 0.07) + 50000;
    const allIn = basePlus + gst + stamp;
    return {
      charges_total_inr: charges,
      base_plus_charges_inr: basePlus,
      gst_inr: gst,
      stamp_registration_inr: stamp,
      all_in_inr: allIn,
      all_in_label: inrShort(allIn),
      all_in_exact_label: inrExact(allIn),
      per_sqft_carpet_inr: Math.round(allIn / 1450 / 100) * 100,
      vs_quoted_pct: Math.round((allIn / l.base - 1) * 100),
    };
  };
  const full = costCase([]);
  const waived = costCase(["plc", "club"]);
  const saving = full.all_in_inr - waived.all_in_inr;
  if (full.all_in_inr !== 27400400 || saving !== 492800) throw new Error("cost vector drift");
  const cost = {
    schema: "plinth.vectors.cost/1",
    source: `${S5B} (Aurelia cost sheet of 2 Oct 2026); rules v2026.10 from DATA_MODEL core.cost_rule_sets`,
    phase: "aurelia-heights-phase-2",
    unit: "3 BHK",
    carpet_sqft: 1450,
    super_sqft: 2000,
    rules_version: "2026.10",
    rules: {
      gst_pct: 5,
      gst_base: "base + charges",
      stamp_duty_pct: { male: 7, female: 5, joint: 6 },
      stamp_base: "base + charges",
      registration_fee_inr: 50000,
      per_sqft_round_to_inr: 100,
    },
    inputs: { lines_inr: lines, buyer: "male" },
    cases: [
      {
        name: "as quoted",
        waive: [],
        expected: {
          ...full,
          charges_total_label: inrShort(full.charges_total_inr),
          gst_label: inrShort(full.gst_inr),
          stamp_registration_label: inrShort(full.stamp_registration_inr),
          base_plus_charges_label: inrShort(full.base_plus_charges_inr),
          negotiable_inr: lines.plc + lines.club,
          negotiable_label: inrShort(lines.plc + lines.club),
          loading_pct: Math.round((2000 / 1450 - 1) * 100),
          price_list_per_sqft_carpet_inr: Math.round(lines.base / 1450),
        },
      },
      {
        name: "waive PLC and club",
        waive: ["plc", "club"],
        expected: {
          ...waived,
          saving_inr: saving,
          saving_label: inrShort(saving),
          saving_exact_label: inrExact(saving),
        },
      },
    ],
  };

  // ---- Afford the wait (BUILD_PLAN D-6 and §5b: round the all-in to the nearest lakh first)
  const allInRounded = Math.round(27400400 / 100000) * 100000;
  const down = Math.round(allInRounded * 0.2);
  const loan = allInRounded - down;
  const r = 0.085 / 12;
  const n = 240;
  const emi = Math.round((loan * r * (1 + r) ** n) / ((1 + r) ** n - 1));
  const preEmi = (paidPct) => Math.round((allInRounded * paidPct - down) * r);
  const rent = 55000;
  const nowMonthly = preEmi(0.525) + rent;
  const endMonthly = preEmi(0.95) + rent;
  const series = [];
  for (let i = 0; i < 14; i++) {
    const paid = 0.525 + ((0.95 - 0.525) * i) / 13;
    series.push({
      month: addMonths("2026-11", i),
      paid_out_pct: Math.round(paid * 1000) / 10,
      pre_emi_inr: preEmi(paid),
      rent_inr: rent,
      delay: false,
    });
  }
  for (let i = 1; i <= 12; i++)
    series.push({
      month: addMonths("2027-12", i),
      paid_out_pct: 95,
      pre_emi_inr: preEmi(0.95),
      rent_inr: rent,
      delay: true,
    });
  const afford = {
    schema: "plinth.vectors.afford_the_wait/1",
    source: `${S5B} (defaults and results); rounding: BUILD_PLAN D-6 and §5b Engineering fixture decisions; payout steps and series: CONFLICTS.md C-22 (proposed)`,
    phase: "aurelia-heights-phase-2",
    tower: "A",
    inputs: {
      all_in_inr: 27400400,
      take_home_inr: 450000,
      rent_inr: 55000,
      down_pct: 20,
      rate_pct: 8.5,
      tenure_years: 20,
      paid_out_today_pct: 52.5,
      paid_out_by_completion_pct: 95,
      completion: "2027-12",
      first_month: "2026-11",
    },
    method: [
      "Round the all-in to the nearest ₹1 lakh: ₹2,74,00,400 becomes ₹2,74,00,000.",
      "Down payment = 20% of the rounded all-in; the loan is the rest.",
      "The buyer's own money goes first, so the bank has paid out (share of the rounded all-in due) minus the down payment.",
      "Pre-EMI = paid out × 8.50% ÷ 12, rounded to the rupee (half up). Monthly outgo = pre-EMI + rent.",
      "Due today: 52.5% (Tower A, booking to slab 9). By Dec 2027: 95% (all but the last 5% at possession).",
      "Series: the paid-out share rises in equal monthly steps from Nov 2026 to Dec 2027; a delay holds the Dec 2027 level.",
      "Delay cost = months of delay × the rounded Dec 2027 monthly outgo.",
      "EMI after keys = standard amortisation of the loan over 240 months, rounded to the rupee.",
    ],
    derived: {
      all_in_rounded_inr: allInRounded,
      down_payment_inr: down,
      loan_inr: loan,
      paid_out_now_inr: Math.round(allInRounded * 0.525) - down,
      paid_out_by_completion_inr: Math.round(allInRounded * 0.95) - down,
    },
    expected: {
      now_pre_emi_inr: preEmi(0.525),
      now_monthly_inr: nowMonthly,
      now_monthly_label: inrExact(nowMonthly),
      now_share_pct: Math.round((nowMonthly / 450000) * 100),
      by_completion_pre_emi_inr: preEmi(0.95),
      by_completion_monthly_inr: endMonthly,
      by_completion_monthly_label: inrExact(endMonthly),
      by_completion_share_pct: Math.round((endMonthly / 450000) * 100),
      emi_after_keys_inr: emi,
      emi_after_keys_label: inrExact(emi),
    },
    cases: [12, 24].map((m) => ({
      delay_months: m,
      cost_inr: m * endMonthly,
      cost_label: inrShort(m * endMonthly),
    })),
    series,
  };
  const ex = afford.expected;
  if (
    ex.now_monthly_inr !== 118077 ||
    ex.by_completion_monthly_inr !== 200563 ||
    ex.emi_after_keys_inr !== 190227 ||
    afford.cases[0].cost_label !== "₹24.1 L" ||
    afford.cases[1].cost_label !== "₹48.1 L"
  )
    throw new Error("afford vector drift");

  // ---- 10% cap (RERA s.13)
  const cap = {
    schema: "plinth.vectors.cap/1",
    source: `${S5B} (10% of ₹2.44 Cr base + charges = ₹24.4 L; EOI ₹11,00,000)`,
    rule: "Before a registered agreement for sale, at most 10% of the price (base + charges) may be taken (RERA s.13).",
    phase: "aurelia-heights-phase-2",
    inputs: { base_plus_charges_inr: 24420000 },
    expected: {
      limit_inr: 2442000,
      limit_label: inrShort(2442000),
      price_label: inrShort(24420000),
    },
    cases: [
      {
        name: "EOI on WhatsApp",
        amount_inr: 1100000,
        paid_so_far_inr: 0,
        stage: "before_agreement",
        expected: {
          within: true,
          amount_label: inrExact(1100000),
          line: "₹11,00,000 is within the ₹24.4 L limit before a registered agreement.",
        },
      },
      {
        name: "exactly the limit",
        amount_inr: 2442000,
        paid_so_far_inr: 0,
        stage: "before_agreement",
        expected: { within: true },
      },
      {
        name: "one rupee over",
        amount_inr: 2442001,
        paid_so_far_inr: 0,
        stage: "before_agreement",
        expected: { within: false },
      },
    ],
  };

  // ---- time used (month-based)
  const aFilings = cat.qpr_filings.filter(
    (f) => f.phase === "aurelia-heights-phase-2" && f.time_used_pct != null,
  );
  const time_used = {
    schema: "plinth.vectors.time_used/1",
    source: `${S5B} (Aurelia quarters 10…70%, 77% today; other phases' figures today); formula BUILD_PLAN §7.1`,
    formula:
      "round_half_up(100 × months(registration → reference month) ÷ months(registration → original completion)). A QPR's reference month is its quarter's last month; today uses the clock's month (Oct 2026).",
    cases: [
      ...aFilings.map((f) => {
        const ref = quarterEndMonth(f.quarter);
        if (timeUsedPct("2022-12", "2027-12", ref) !== f.time_used_pct)
          throw new Error(`time used drift ${f.quarter}`);
        return {
          phase: "aurelia-heights-phase-2",
          registered: "2022-12",
          original_completion: "2027-12",
          reference_month: ref,
          label: fmtQuarter(f.quarter),
          expected_pct: f.time_used_pct,
        };
      }),
      ...[
        ["aurelia-heights-phase-2", 77],
        ["kestrel-park", 58],
        ["sapphire-grove-phase-1", 55],
        ["coral-towers", 70],
        ["laurel-residency", 106],
        ["juniper-enclave", 31],
        ["heron-point-phase-2", 10],
      ].map(([ph, pct]) => {
        const g = cat.rera_registrations.find((x) => x.phase === ph);
        const reg = g.registered_on.slice(0, 7);
        const orig = g.original_completion.slice(0, 7);
        if (timeUsedPct(reg, orig, "2026-10") !== pct) throw new Error(`time used drift ${ph}`);
        return {
          phase: ph,
          registered: reg,
          original_completion: orig,
          reference_month: "2026-10",
          label: "Today, 18 Oct 2026",
          expected_pct: pct,
        };
      }),
    ],
  };

  // ---- Late12
  const late12 = {
    schema: "plinth.vectors.late12/1",
    source: `${S5B} (Dec 2027 + 4 months + 12 months = Apr 2029; MoHUA advisory of 31 Jul 2026, completions on or after 28 Feb 2026)`,
    rule: "late_after = original completion + the blanket extension (4 months, when the original completion is on or after 28 Feb 2026) + 12 months. Extensions granted to one project are not added.",
    cases: cat.rera_registrations.map((g) => {
      const orig = g.original_completion.slice(0, 7);
      const months = g.original_completion >= "2026-02-28" ? 4 : 0;
      return {
        phase: g.phase,
        original_completion: orig,
        blanket_extension_months: months,
        expected_late_after: addMonths(orig, months + 12),
        expected_label: fmtMonth(addMonths(orig, months + 12)),
      };
    }),
  };
  if (late12.cases.find((c) => c.phase === "aurelia-heights-phase-2").expected_label !== "Apr 2029")
    throw new Error("late12 drift");

  // ---- formatting
  const money = [
    27400400, 27400000, 23500000, 33800000, 21000000, 19000000, 24420000, 2406756, 4813512, 2442000,
    1221000, 1759400, 920000, 440000, 492800, 290000, 300000, 16720000, 8778000, 1254000, 62700,
    1316700, 118077, 200563, 190227, 1100000, 55000, 11999, 100000, 99999, 0,
  ];
  const formatting = {
    schema: "plinth.vectors.formatting/1",
    source: `${S5B} and AGENTS.md §5 (money as ₹2.74 Cr / ₹24.1 L / ₹1,67,20,000; dates as 18 Oct 2026 / Apr–Jun 2026)`,
    rules: {
      inr_short:
        "From ₹1 crore: 2 decimals + ' Cr' (half up). From ₹1 lakh: 1 decimal + ' L' (half up). Below: exact, with Indian grouping.",
      inr_exact: "₹ + Indian digit grouping (the last 3 digits, then pairs).",
      date: "D Mon YYYY, no leading zero.",
      month: "Mon YYYY.",
      quarter: "Mon–Mon YYYY, an en dash, calendar quarters.",
    },
    inr: money.map((v) => ({ inr: v, short: inrShort(v), exact: inrExact(v) })),
    dates: ["2026-10-18", "2026-10-02", "2026-07-15", "2023-03-12", "2026-11-01", "2027-01-05"].map(
      (d) => ({ iso: d, label: fmtDate(d) }),
    ),
    months: ["2027-12", "2029-04", "2026-06", "2031-04"].map((m) => ({
      iso: m,
      label: fmtMonth(m),
    })),
    quarters: ["2023-Q2", "2024-Q3", "2025-Q4", "2026-Q1", "2026-Q2", "2026-Q3"].map((q) => ({
      quarter: q,
      label: fmtQuarter(q),
    })),
  };
  const must = { 27400400: "₹2.74 Cr", 2406756: "₹24.1 L", 2442000: "₹24.4 L" };
  for (const [k, v] of Object.entries(must))
    if (inrShort(Number(k)) !== v) throw new Error("format drift");
  if (
    inrExact(16720000) !== "₹1,67,20,000" ||
    inrExact(118077) !== "₹1,18,077" ||
    inrExact(27400400) !== "₹2,74,00,400"
  )
    throw new Error("format drift");

  return { cost, afford_the_wait: afford, cap, time_used, late12, formatting };
}
