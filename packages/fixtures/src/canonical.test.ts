// Canonical files: every record names its source, the §5b numbers live there with a
// "DESIGN §5/§5b" source, and the expected outputs agree with the canonical data.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FIXTURES_DIR, expectedKeys, loadCanonical, loadExpected } from "./node";
import { PHASE_SLUGS } from "./index";

type Rec = Record<string, unknown> & { source?: string; id?: string };
type Canon = Record<string, unknown>;
const NAMES = ["catalogue", "evidence", "scoring", "developer_content"] as const;
const canon = Object.fromEntries(NAMES.map((n) => [n, loadCanonical<Canon>(n)])) as Record<
  (typeof NAMES)[number],
  Canon
>;
const records = (c: Canon): Rec[] => Object.values(c).filter(Array.isArray).flat() as Rec[];
const arr = (c: Canon, k: string) => c[k] as Rec[];
const fromDesign = (r: Rec | undefined) =>
  !!r && typeof r.source === "string" && /DESIGN §5/.test(r.source);

describe("canonical records", () => {
  it("every record carries a source note", () => {
    const allowed =
      /DESIGN §5|BUILD_PLAN|DATA_MODEL|API_CONTRACTS|artboard|derived:|CONFLICTS\.md|WebMethodology|WebAbout/;
    for (const n of NAMES)
      for (const r of records(canon[n])) {
        expect(typeof r.source, `${n}: ${JSON.stringify(r).slice(0, 120)}`).toBe("string");
        expect(r.source, `${n}: ${r.id ?? ""}`).toMatch(allowed);
      }
  });

  it("ids are unique UUIDs", () => {
    const seen = new Set<string>();
    for (const n of NAMES)
      for (const r of records(canon[n]))
        if (typeof r.id === "string") {
          expect(r.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
          );
          expect(seen.has(r.id), r.id).toBe(false);
          seen.add(r.id);
        }
  });

  it("every §5b number used lives in canonical with a DESIGN §5/§5b source", () => {
    const cat = canon.catalogue;
    const ev = canon.evidence;
    const dc = canon.developer_content;
    const q = (phase: string, quarter: string) =>
      arr(cat, "qpr_filings").find((f) => f.phase === phase && f.quarter === quarter);
    const reg = (phase: string) => arr(cat, "rera_registrations").find((r) => r.phase === phase);
    const fact = (key: string) => arr(ev, "facts").find((f) => f.key === key);
    const cc = (s: string) => arr(cat, "complaint_counts").find((c) => c.subject === s);
    const checks: [string, Rec | undefined, (r: Rec) => boolean][] = [
      [
        "Aurelia Apr–Jun 2023 24/6/10",
        q("aurelia-heights-phase-2", "2023-Q2"),
        (r) => r.sold_pct === 24 && r.built_pct === 6 && r.time_used_pct === 10,
      ],
      [
        "Aurelia Oct–Dec 2023 38/12/20",
        q("aurelia-heights-phase-2", "2023-Q4"),
        (r) => r.sold_pct === 38 && r.built_pct === 12 && r.time_used_pct === 20,
      ],
      [
        "Aurelia Apr–Jun 2024 49/19/30",
        q("aurelia-heights-phase-2", "2024-Q2"),
        (r) => r.sold_pct === 49 && r.built_pct === 19 && r.time_used_pct === 30,
      ],
      [
        "Aurelia Oct–Dec 2024 58/26/40",
        q("aurelia-heights-phase-2", "2024-Q4"),
        (r) => r.sold_pct === 58 && r.built_pct === 26 && r.time_used_pct === 40,
      ],
      [
        "Aurelia Apr–Jun 2025 64/31/50",
        q("aurelia-heights-phase-2", "2025-Q2"),
        (r) => r.sold_pct === 64 && r.built_pct === 31 && r.time_used_pct === 50,
      ],
      [
        "Aurelia Oct–Dec 2025 68/36/60, 38 days late",
        q("aurelia-heights-phase-2", "2025-Q4"),
        (r) => r.sold_pct === 68 && r.built_pct === 36 && r.days_late === 38,
      ],
      [
        "Aurelia Jan–Mar 2026 70/38/65",
        q("aurelia-heights-phase-2", "2026-Q1"),
        (r) => r.sold_pct === 70 && r.built_pct === 38 && r.time_used_pct === 65,
      ],
      [
        "Aurelia Apr–Jun 2026 72/41/70, filed 15 Jul",
        q("aurelia-heights-phase-2", "2026-Q2"),
        (r) => r.sold_pct === 72 && r.built_pct === 41 && r.filed_on === "2026-07-15",
      ],
      [
        "Aurelia Jul–Sep 2024 12 days late",
        q("aurelia-heights-phase-2", "2024-Q3"),
        (r) => r.days_late === 12,
      ],
      [
        "Aurelia Jan–Mar 2025 41 days late",
        q("aurelia-heights-phase-2", "2025-Q1"),
        (r) => r.days_late === 41,
      ],
      [
        "Aurelia Jul–Sep 2026 missing, due 15 Oct",
        q("aurelia-heights-phase-2", "2026-Q3"),
        (r) => r.status === "missing" && r.due_on === "2026-10-15",
      ],
      [
        "Aurelia registration Dec 2022 → Dec 2027",
        reg("aurelia-heights-phase-2"),
        (r) =>
          r.registered_on === "2022-12-01" &&
          r.original_completion === "2027-12-01" &&
          r.rera_number === "GGM/673/405/2022/117",
      ],
      [
        "Aurelia collection account",
        reg("aurelia-heights-phase-2"),
        (r) =>
          r.collection_account_number === "50200071824417" && r.collection_ifsc === "PEPL0000418",
      ],
      [
        "Kestrel Nov 2023 → Nov 2028",
        reg("kestrel-park"),
        (r) => r.registered_on === "2023-11-01" && r.original_completion === "2028-11-01",
      ],
      [
        "Laurel Nov 2020 → Jun 2026",
        reg("laurel-residency"),
        (r) => r.registered_on === "2020-11-01" && r.original_completion === "2026-06-01",
      ],
      [
        "Heron Point 28 Apr 2026 → Apr 2031",
        reg("heron-point-phase-2"),
        (r) => r.registered_on === "2026-04-28" && r.original_completion === "2031-04-01",
      ],
      [
        "Juniper May 2025 → Dec 2029",
        reg("juniper-enclave"),
        (r) => r.registered_on === "2025-05-01" && r.original_completion === "2029-12-01",
      ],
      [
        "Coral Aug 2028 → Aug 2029",
        reg("coral-towers"),
        (r) => r.original_completion === "2028-08-01" && r.current_completion === "2029-08-01",
      ],
      [
        "Aurelia complaints 14 · 2.8 per 100 (500 units), median 3",
        cc("aurelia-heights-phase-2"),
        (r) =>
          r.count_24m === 14 &&
          r.per_100_units === 2.8 &&
          r.units_base === 500 &&
          r.median_count_similar === 3,
      ],
      [
        "Kestrel complaints 2 · 0.5",
        cc("kestrel-park"),
        (r) => r.count_24m === 2 && r.per_100_units === 0.5,
      ],
      [
        "Sapphire complaints 5 · 1.4",
        cc("sapphire-grove-phase-1"),
        (r) => r.count_24m === 5 && r.per_100_units === 1.4,
      ],
      [
        "Northfield 24 · 0.7",
        cc("northfield-estates"),
        (r) => r.count_24m === 24 && r.per_100_units === 0.7,
      ],
      [
        "Kestrel 63% built (Jul–Sep 2026, filed 12 Oct)",
        q("kestrel-park", "2026-Q3"),
        (r) => r.built_pct === 63 && r.filed_on === "2026-10-12",
      ],
      [
        "Sapphire 48% built, filed 27 Jul, 12 days late",
        q("sapphire-grove-phase-1", "2026-Q2"),
        (r) => r.built_pct === 48 && r.days_late === 12,
      ],
      [
        "Coral 22% built, filed 14 Apr 2026",
        q("coral-towers", "2026-Q1"),
        (r) => r.built_pct === 22 && r.filed_on === "2026-04-14",
      ],
      ["Laurel 34% built", q("laurel-residency", "2026-Q2"), (r) => r.built_pct === 34],
      ["time used today: Kestrel 58", fact("kestrel-park/time-used"), (r) => r.value === 58],
      [
        "time used today: Sapphire 55",
        fact("sapphire-grove-phase-1/time-used"),
        (r) => r.value === 55,
      ],
      ["time used today: Coral 70", fact("coral-towers/time-used"), (r) => r.value === 70],
      ["time used today: Laurel 106", fact("laurel-residency/time-used"), (r) => r.value === 106],
      ["time used today: Juniper 31", fact("juniper-enclave/time-used"), (r) => r.value === 31],
      [
        "Juniper 9% built, Apr–Jun 2026, filed 10 Jul",
        q("juniper-enclave", "2026-Q2"),
        (r) => r.built_pct === 9 && r.filed_on === "2026-07-10",
      ],
      [
        "Kestrel Apr–Jun 2026 filed 14 Jul, on time",
        q("kestrel-park", "2026-Q2"),
        (r) => r.filed_on === "2026-07-14" && r.status === "on_time",
      ],
      [
        "Laurel Jul–Sep 2025 filed 13 Oct 2025",
        q("laurel-residency", "2025-Q3"),
        (r) => r.filed_on === "2025-10-13" && r.built_pct === 34,
      ],
      [
        "Cedar Walk Ph 2 Jan 2022 → Mar 2027, GGM/566/298/2022/31",
        reg("cedar-walk-phase-2"),
        (r) =>
          r.registered_on === "2022-01-01" &&
          r.original_completion === "2027-03-01" &&
          r.rera_number === "GGM/566/298/2022/31",
      ],
      ["Cedar Walk Ph 2 70% built", q("cedar-walk-phase-2", "2026-Q2"), (r) => r.built_pct === 70],
      [
        "Cedar Walk Ph 2 92% time used",
        fact("cedar-walk-phase-2/time-used"),
        (r) => r.value === 92,
      ],
      ["Kestrel RERA number", reg("kestrel-park"), (r) => r.rera_number === "GGM/781/513/2023/64"],
      [
        "Coral extension 1, 20 Jan 2026, order 014",
        arr(cat, "extensions").find((e) => e.seq === 1),
        (r) => r.granted_on === "2026-01-20" && r.order_ref === "HARERA/GGM/EXT/2026/014",
      ],
      [
        "Aurelia Ph 1 OC Mar 2023, 27 months late",
        arr(cat, "completion_events").find((e) => e.phase === "aurelia-heights-phase-1"),
        (r) => r.granted_on === "2023-03-01" && r.months_late === 27,
      ],
      [
        "Orbis Land claimed 3 Dec 2025",
        arr(cat, "developer_groups").find((g) => g.slug === "orbis-land"),
        (r) => r.claimed_on === "2025-12-03",
      ],
      [
        "Northfield track record 2 of 6",
        fact("northfield-estates/track-record"),
        (r) => JSON.stringify(r.value).includes('"finished":6,"late":2'),
      ],
      [
        "Aurelia all-in ₹2.74 Cr, ₹18,900",
        fact("aurelia-heights-phase-2/price/all-in-3bhk"),
        (r) =>
          (r.value as Rec).all_in_inr === 27400400 &&
          (r.value as Rec).per_sqft_carpet_inr === 18900,
      ],
      [
        "Aurelia cost sheet lines",
        arr(dc, "cost_sheets")[0],
        (r) =>
          JSON.stringify(r.lines).includes('"amount_inr":23500000') &&
          JSON.stringify(r.lines).includes('"amount_inr":290000'),
      ],
      [
        "Aurelia price list 2 Oct 2026",
        arr(dc, "price_lists").find((l) => l.published_on === "2026-10-02"),
        (r) =>
          JSON.stringify(r.items).includes("23500000") && JSON.stringify(r.items).includes("16207"),
      ],
      [
        "Coral extension 2, 14 Oct 2026 → Aug 2029",
        arr(cat, "extensions").find((e) => e.seq === 2),
        (r) => r.granted_on === "2026-10-14" && r.to_completion === "2029-08-01",
      ],
      [
        "Elmstone group company admitted 12 Mar 2023",
        arr(cat, "insolvency_events")[0],
        (r) => r.event_on === "2023-03-12",
      ],
    ];
    for (const [label, rec, ok] of checks) {
      expect(rec, label).toBeTruthy();
      expect(ok(rec!), label).toBe(true);
      expect(
        fromDesign(rec),
        `${label}: source should cite DESIGN §5/§5b, got ${rec?.source}`,
      ).toBe(true);
    }
  });
});

describe("scoring and expected outputs agree", () => {
  const sc = canon.scoring;
  const ev = canon.evidence;
  const factIds = new Set(arr(ev, "facts").map((f) => f.id));
  const runs = arr(sc, "runs");
  const published = (slug: string) =>
    runs.find((r) => r.phase === slug && r.status === "published")!;

  it("one published run per phase; the band history never shows Elevated before 2 Oct 2026", () => {
    for (const s of PHASE_SLUGS)
      expect(runs.filter((r) => r.phase === s && r.status === "published")).toHaveLength(1);
    const hist = arr(sc, "band_history").filter((h) => h.phase === "aurelia-heights-phase-2");
    for (const h of hist)
      if (h.band === "elevated") expect(String(h.from_date) >= "2026-10-02").toBe(true);
    expect(hist.find((h) => h.to_date === "2026-10-02")?.band).toBe("moderate");
  });

  it("the pending High proposal is never published and never reaches a buyer payload", () => {
    const pending = runs.filter((r) => r.status === "pending_notice");
    expect(pending.map((r) => r.band)).toEqual(["high"]);
    for (const fn of [
      "risk_summary",
      "project_page",
      "search_projects",
      "compare",
      "developer_page",
    ])
      for (const key of expectedKeys(fn)) {
        const body = JSON.stringify(loadExpected(fn, key));
        // Coral Towers is High today; no Aurelia payload may carry the proposed band.
        const aurelia =
          fn === "risk_summary" || fn === "project_page"
            ? key.startsWith("aurelia")
              ? body
              : ""
            : "";
        expect(aurelia).not.toMatch(/"(code|band|label)":"high"|"High"/);
      }
  });

  it("every risk summary matches its published run and cites real facts", () => {
    for (const s of PHASE_SLUGS) {
      const rs = loadExpected<Rec>("risk_summary", s);
      const run = published(s);
      expect((rs.meta as Rec).score_run_id).toBe(run.id);
      expect((rs.band as Rec | null)?.code ?? null).toBe(run.state === "scored" ? run.band : null);
      const reasons = arr(sc, "reasons").filter((r) => r.run === run.id);
      expect((rs.reasons as Rec[]).map((r) => r.text)).toEqual(reasons.map((r) => r.text));
      for (const r of rs.reasons as Rec[])
        for (const src of r.sources as Rec[])
          for (const id of src.fact_ids as string[])
            expect(factIds.has(id), `${s}: ${id}`).toBe(true);
    }
  });

  it("Aurelia reads 72 / 41 / 77, Elevated since 2 Oct 2026, late after Apr 2029", () => {
    const rs = loadExpected<Rec>("risk_summary", "aurelia-heights-phase-2");
    expect(rs.progress).toMatchObject({ sold_pct: 72, built_pct: 41, time_used_pct: 77 });
    expect(rs.band).toMatchObject({ code: "elevated", since: "2026-10-02" });
    expect(rs.late12).toMatchObject({ late_after: "2029-04" });
    expect(JSON.stringify(rs)).not.toContain("Dec 2028");
  });

  it("the 4 evidence fixtures are the 4 Aurelia reason facts, each with a slug variant", () => {
    const run = published("aurelia-heights-phase-2");
    const ids = arr(sc, "reasons")
      .filter((r) => r.run === run.id)
      .map((r) => (r.fact_ids as string[])[0])
      .sort();
    // api.evidence(p_fact_id, p_slug) (T13): the project page passes its own
    // slug too, so every fact gets a second, slug-qualified fixture key.
    const withSlugVariants = ids
      .flatMap((id) => [id, `${id}--aurelia-heights-phase-2`])
      .sort();
    expect(expectedKeys("evidence")).toEqual(withSlugVariants);
    const r1 = loadExpected<Rec>(
      "evidence",
      ids.find((id) => arr(ev, "facts").find((f) => f.id === id)?.attribute === "qpr.progress")!,
    );
    expect(r1.dates_line).toContain("Filed 15 Jul 2026");
    // Every fact here is one of Aurelia's own reasons, so
    // core.evidence_in_context(fact_id, aurelia) names the same reasons the
    // slug-less overload already does: same payload, a second request key.
    for (const id of ids) {
      expect(loadExpected("evidence", `${id}--aurelia-heights-phase-2`)).toEqual(
        loadExpected("evidence", id!),
      );
    }
  });
});

describe("API_CONTRACTS §2.1 example", () => {
  // The Aurelia RiskSummary in API_CONTRACTS §2.1 is copied verbatim by T02. Every value there
  // that is not a "…" placeholder must equal the fixture.
  const doc = readFileSync(join(FIXTURES_DIR, "../../docs/engineering/API_CONTRACTS.md"), "utf8");
  const start = doc.indexOf("### 2.1");
  const block = doc.slice(
    doc.indexOf("```json", start) + 7,
    doc.indexOf("```", doc.indexOf("```json", start) + 7),
  );
  const example = JSON.parse(block) as unknown;
  const fixture = loadExpected("risk_summary", "aurelia-heights-phase-2");
  const isPlaceholder = (v: unknown) => typeof v === "string" && (v === "…" || v.includes("…"));
  // Values superseded by a DESIGN §5b decision whose doc update has not landed yet: path → the
  // stale doc value still accepted. Empty since the T07 gate merged PR #8 (round 2).
  const superseded: Record<string, unknown> = {};
  const compare = (a: unknown, b: unknown, path: string, out: string[]) => {
    if (isPlaceholder(a)) return;
    if (path in superseded && a === superseded[path]) return;
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return void out.push(`${path}: length`);
      a.forEach((x, i) => compare(x, b[i], `${path}[${i}]`, out));
    } else if (a && typeof a === "object") {
      if (!b || typeof b !== "object") return void out.push(`${path}: not an object`);
      for (const [k, v] of Object.entries(a)) compare(v, (b as Rec)[k], `${path}.${k}`, out);
    } else if (a !== b) out.push(`${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  };
  it("matches every concrete value of the documented Aurelia example", () => {
    const diffs: string[] = [];
    compare(example, fixture, "$", diffs);
    expect(diffs).toEqual([]);
  });
});
