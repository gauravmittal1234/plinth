// The golden vectors are internally consistent: every expected number is recomputed here from
// the vector's own inputs with an independent implementation (not the authoring code).
import { describe, expect, it } from "vitest";
import { loadVector } from "./node";

const groupIN = (n: number): string => {
  const s = String(Math.trunc(Math.abs(n)));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${head},${s.slice(-3)}`;
};
const exact = (n: number) => `₹${groupIN(n)}`;
const short = (n: number) =>
  n >= 1e7
    ? `₹${(Math.round(n / 1e5) / 100).toFixed(2)} Cr`
    : n >= 1e5
      ? `₹${(Math.round(n / 1e4) / 10).toFixed(1)} L`
      : exact(n);
const ym = (s: string) => {
  const [y, m] = s.split("-").map(Number) as [number, number];
  return y * 12 + m - 1;
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (t: number) => `${MON[t % 12]} ${Math.floor(t / 12)}`;

type Inr = { inr: number; short: string; exact: string };
type Formatting = {
  inr: Inr[];
  dates: { iso: string; label: string }[];
  months: { iso: string; label: string }[];
  quarters: { quarter: string; label: string }[];
};

describe("formatting vectors", () => {
  const v = loadVector<Formatting>("formatting");
  it("pins the house money formats", () => {
    const by = Object.fromEntries(v.inr.map((x) => [x.inr, x]));
    expect(by[27400400]?.short).toBe("₹2.74 Cr");
    expect(by[27400400]?.exact).toBe("₹2,74,00,400");
    expect(by[118077]?.exact).toBe("₹1,18,077");
    expect(by[2442000]?.short).toBe("₹24.4 L");
    expect(by[2406756]?.short).toBe("₹24.1 L");
    expect(by[16720000]?.exact).toBe("₹1,67,20,000");
  });
  it("every money case follows the rule", () => {
    for (const x of v.inr) {
      expect(x.exact).toBe(exact(x.inr));
      expect(x.short).toBe(short(x.inr));
    }
  });
  it("dates, months and quarters", () => {
    for (const d of v.dates) {
      const [y, m, day] = d.iso.split("-").map(Number) as [number, number, number];
      expect(d.label).toBe(`${day} ${MON[m - 1]} ${y}`);
    }
    for (const m of v.months) expect(m.label).toBe(monthLabel(ym(m.iso)));
    for (const q of v.quarters) {
      const [y, n] = q.quarter.split("-Q").map(Number) as [number, number];
      expect(q.label).toBe(`${MON[(n - 1) * 3]}–${MON[(n - 1) * 3 + 2]} ${y}`);
    }
  });
});

describe("cost vector (Aurelia 3 BHK, rules v2026.10)", () => {
  type Cost = {
    inputs: { lines_inr: Record<string, number> };
    rules: { gst_pct: number; stamp_duty_pct: { male: number }; registration_fee_inr: number };
    cases: { name: string; waive: string[]; expected: Record<string, number | string> }[];
  };
  const v = loadVector<Cost>("cost");
  const run = (waive: string[]) => {
    const l = { ...v.inputs.lines_inr };
    for (const w of waive) l[w] = 0;
    const charges = (l.plc ?? 0) + (l.club ?? 0) + (l.parking ?? 0) + (l.ifms ?? 0);
    const basePlus = (l.base ?? 0) + charges;
    const gst = Math.round((basePlus * v.rules.gst_pct) / 100);
    const stamp =
      Math.round((basePlus * v.rules.stamp_duty_pct.male) / 100) + v.rules.registration_fee_inr;
    return { charges, basePlus, gst, stamp, allIn: basePlus + gst + stamp };
  };
  it("reproduces ₹2,74,00,400 → ₹2.74 Cr and ₹18,900 per sq ft carpet", () => {
    const c = v.cases.find((x) => x.name === "as quoted")!;
    const r = run([]);
    expect(r.allIn).toBe(27400400);
    expect(c.expected.all_in_inr).toBe(r.allIn);
    expect(c.expected.all_in_label).toBe("₹2.74 Cr");
    expect(c.expected.gst_inr).toBe(r.gst);
    expect(c.expected.gst_label).toBe("₹12.2 L");
    expect(c.expected.stamp_registration_label).toBe("₹17.6 L");
    expect(c.expected.charges_total_label).toBe("₹9.2 L");
    expect(c.expected.per_sqft_carpet_inr).toBe(Math.round(r.allIn / 1450 / 100) * 100);
    expect(c.expected.per_sqft_carpet_inr).toBe(18900);
    expect(c.expected.vs_quoted_pct).toBe(17);
    expect(c.expected.negotiable_label).toBe("₹4.4 L");
  });
  it("waiving PLC and club saves ₹4,92,800 (₹4.9 L)", () => {
    const c = v.cases.find((x) => x.name === "waive PLC and club")!;
    expect(c.expected.saving_inr).toBe(run([]).allIn - run(["plc", "club"]).allIn);
    expect(c.expected.saving_inr).toBe(492800);
    expect(c.expected.saving_label).toBe("₹4.9 L");
  });
});

describe("afford-the-wait vector", () => {
  type Afford = {
    inputs: {
      all_in_inr: number;
      take_home_inr: number;
      rent_inr: number;
      down_pct: number;
      rate_pct: number;
      tenure_years: number;
      paid_out_today_pct: number;
      paid_out_by_completion_pct: number;
    };
    expected: Record<string, number | string>;
    cases: { delay_months: number; cost_inr: number; cost_label: string }[];
    series: {
      month: string;
      paid_out_pct: number;
      pre_emi_inr: number;
      rent_inr: number;
      delay: boolean;
    }[];
  };
  const v = loadVector<Afford>("afford_the_wait");
  const i = v.inputs;
  const allIn = Math.round(i.all_in_inr / 1e5) * 1e5;
  const down = (allIn * i.down_pct) / 100;
  const r = i.rate_pct / 100 / 12;
  const preEmi = (pct: number) => Math.round(((allIn * pct) / 100 - down) * r);
  it("reproduces ₹1,18,077 now, ₹2,00,563 by Dec 2027 and the ₹1,90,227 EMI", () => {
    expect(allIn).toBe(27400000);
    const now = preEmi(i.paid_out_today_pct) + i.rent_inr;
    const end = preEmi(i.paid_out_by_completion_pct) + i.rent_inr;
    expect(now).toBe(118077);
    expect(end).toBe(200563);
    expect(v.expected.now_monthly_inr).toBe(now);
    expect(v.expected.by_completion_monthly_inr).toBe(end);
    expect(v.expected.now_share_pct).toBe(Math.round((now / i.take_home_inr) * 100));
    expect(v.expected.by_completion_share_pct).toBe(Math.round((end / i.take_home_inr) * 100));
    const loan = allIn - down;
    const n = i.tenure_years * 12;
    const emi = Math.round((loan * r * (1 + r) ** n) / ((1 + r) ** n - 1));
    expect(emi).toBe(190227);
    expect(v.expected.emi_after_keys_inr).toBe(emi);
  });
  it("delays cost ₹24.1 L (12 months) and ₹48.1 L (24 months)", () => {
    const end = Number(v.expected.by_completion_monthly_inr);
    for (const c of v.cases) {
      expect(c.cost_inr).toBe(c.delay_months * end);
      expect(c.cost_label).toBe(short(c.cost_inr));
    }
    expect(v.cases.map((c) => c.cost_label)).toEqual(["₹24.1 L", "₹48.1 L"]);
  });
  it("the series starts at today's outgo, ends at Dec 2027's and holds it while late", () => {
    const first = v.series[0]!;
    expect(first.month).toBe("2026-11");
    expect(first.pre_emi_inr + first.rent_inr).toBe(118077);
    const last = v.series.filter((m) => !m.delay).at(-1)!;
    expect(last.month).toBe("2027-12");
    expect(last.pre_emi_inr + last.rent_inr).toBe(200563);
    for (const m of v.series.filter((x) => x.delay))
      expect(m.pre_emi_inr + m.rent_inr).toBe(200563);
    for (let k = 1; k < v.series.length; k++)
      expect(v.series[k]!.pre_emi_inr).toBeGreaterThanOrEqual(v.series[k - 1]!.pre_emi_inr);
  });
});

describe("10% cap vector", () => {
  type Cap = {
    inputs: { base_plus_charges_inr: number };
    expected: { limit_inr: number; limit_label: string };
    cases: { amount_inr: number; paid_so_far_inr: number; expected: { within: boolean } }[];
  };
  const v = loadVector<Cap>("cap");
  it("10% of ₹2.44 Cr is ₹24.4 L, and the EOI of ₹11,00,000 is within it", () => {
    expect(v.expected.limit_inr).toBe(Math.round(v.inputs.base_plus_charges_inr / 10));
    expect(v.expected.limit_label).toBe("₹24.4 L");
    for (const c of v.cases)
      expect(c.expected.within).toBe(c.amount_inr + c.paid_so_far_inr <= v.expected.limit_inr);
  });
});

describe("time-used and Late12 vectors", () => {
  type TU = {
    cases: {
      phase: string;
      registered: string;
      original_completion: string;
      reference_month: string;
      expected_pct: number;
    }[];
  };
  type L12 = {
    cases: {
      phase: string;
      original_completion: string;
      blanket_extension_months: number;
      expected_late_after: string;
      expected_label: string;
    }[];
  };
  it("month-based time used: Aurelia 10…70% by quarter and 77% today", () => {
    const v = loadVector<TU>("time_used");
    for (const c of v.cases)
      expect(c.expected_pct).toBe(
        Math.round(
          ((ym(c.reference_month) - ym(c.registered)) /
            (ym(c.original_completion) - ym(c.registered))) *
            100,
        ),
      );
    const a = v.cases
      .filter((c) => c.phase === "aurelia-heights-phase-2")
      .map((c) => c.expected_pct);
    expect(a).toEqual([10, 20, 30, 40, 50, 60, 65, 70, 77]);
  });
  it("Late12: Aurelia is late after Apr 2029, never Dec 2028", () => {
    const v = loadVector<L12>("late12");
    for (const c of v.cases) {
      expect(c.expected_late_after.slice(0, 7)).toBe(
        `${Math.floor((ym(c.original_completion) + c.blanket_extension_months + 12) / 12)}-${String(((ym(c.original_completion) + c.blanket_extension_months + 12) % 12) + 1).padStart(2, "0")}`,
      );
      expect(c.expected_label).toBe(
        monthLabel(ym(c.original_completion) + c.blanket_extension_months + 12),
      );
    }
    expect(v.cases.find((c) => c.phase === "aurelia-heights-phase-2")?.expected_label).toBe(
      "Apr 2029",
    );
  });
});
