import { assertEquals } from "../testing/mod.ts";
import {
  agree,
  factsOf,
  normaliseArea,
  normaliseDate,
  normaliseInr,
  normalisePercent,
  normaliseText,
} from "./agree.ts";

Deno.test("₹ amounts normalise to integer rupees", () => {
  const cases: [unknown, number | null][] = [
    ["Rs 11,00,000", 1100000],
    ["₹11,00,000/-", 1100000],
    ["INR 1100000", 1100000],
    ["₹2.74 Cr", 27400000],
    ["₹2.74Cr", 27400000],
    ["Rs. 1.5 crores only", 15000000],
    ["₹24.1 L", 2410000],
    ["24.1 lakh", 2410000],
    ["₹18,900 per sq ft", 18900],
    ["₹18,900/sq ft", 18900],
    [27400000, 27400000],
    [2.4e7 + 0.4, 24000000],
    ["₹2.7 million", null],
    ["about two crore", null],
    [null, null],
  ];
  for (const [v, want] of cases) assertEquals(normaliseInr(v), want, String(v));
});

Deno.test("dates normalise to the month", () => {
  const cases: [unknown, string | null][] = [
    ["18 Oct 2026", "2026-10"],
    ["18th October, 2026", "2026-10"],
    ["2026-10-18", "2026-10"],
    ["2026-10", "2026-10"],
    ["18/10/2026", "2026-10"],
    ["18.10.2026", "2026-10"],
    ["10/2026", "2026-10"],
    ["Sept 2027", "2027-09"],
    ["Dec. 2027", "2027-12"],
    ["31/13/2026", null],
    ["soon", null],
  ];
  for (const [v, want] of cases) assertEquals(normaliseDate(v), want, String(v));
});

Deno.test("areas normalise to whole sq ft with their basis", () => {
  assertEquals(normaliseArea("1,450 sq ft carpet"), { sqft: 1450, basis: "carpet" });
  assertEquals(normaliseArea("134.7 sq m carpet area"), { sqft: 1450, basis: "carpet" });
  assertEquals(normaliseArea({ value: 2100, unit: "sq.ft.", basis: "Super area" }), {
    sqft: 2100,
    basis: "super_area",
  });
  assertEquals(normaliseArea("1,600 sqft built-up"), { sqft: 1600, basis: "built_up" });
  assertEquals(normaliseArea("1450"), { sqft: 1450, basis: null });
  assertEquals(normaliseArea("1,450 hectares"), null);
});

Deno.test("percent and text normalise", () => {
  assertEquals(normalisePercent("38%"), 38);
  assertEquals(normalisePercent("38 per cent"), 38);
  assertEquals(normaliseText("  Ready-to-move, Tower 4. "), "ready to move tower 4");
  assertEquals(normaliseText("RC/REP/HARERA/GGM/2023/45"), "rc/rep/harera/ggm/2023/45");
  assertEquals(normaliseText("cost_sheet", "enum"), "cost sheet");
});

Deno.test("flat outputs: agreed fields, disagreements and the lower confidence", () => {
  const a = {
    total: { value: "₹2.74 Cr", confidence: 0.9 },
    rate: { value: "₹18,900 per sq ft", confidence: 0.95 },
    area: { value: 1450, unit: "sq ft", basis: "carpet", confidence: 0.8 },
    due: { value: "18 Oct 2026", confidence: 0.9 },
    gst: { value: "5%", confidence: 0.9 },
    plc: { value: "₹3 L", confidence: 0.9 },
  };
  const b = {
    total: { value: "Rs 2,74,00,000", confidence: 0.85 },
    rate: { value: 18900, confidence: 0.99 },
    area: { value: "1,450 sq ft carpet", confidence: 0.9 },
    due: { value: "2026-10-31", confidence: 0.7 },
    gst: { value: "12%", confidence: 0.9 },
    loading: { value: "38%", confidence: 0.6 },
  };
  const r = agree(a, b, {
    fields: {
      total: "inr",
      rate: "inr",
      area: "area",
      due: "date",
      gst: "percent",
      plc: "inr",
      loading: "percent",
    },
  });
  assertEquals(r.agreed.map((f) => [f.field, f.value, f.confidence]), [
    ["total", 27400000, 0.85],
    ["rate", 18900, 0.95],
    ["area", { sqft: 1450, basis: "carpet" }, 0.8],
    ["due", "2026-10", 0.7],
  ]);
  assertEquals(r.disagreements.map((d) => [d.field, d.reason]), [
    ["gst", "differs"],
    ["plc", "only_a"],
    ["loading", "only_b"],
  ]);
  assertEquals(r.confidence, 0.7);
  assertEquals(r.rate, 4 / 7);
});

Deno.test("area with a different basis is a disagreement, not a match", () => {
  const r = agree(
    { area: "1,450 sq ft carpet" },
    { area: "1,450 sq ft super area" },
    { fields: { area: "area" } },
  );
  assertEquals(r.disagreements.map((d) => d.reason), ["differs"]);
});

Deno.test("item lists: claims pair by key; unreadable values never agree", () => {
  const a = {
    confidence: 0.9,
    claims: [
      { type: "price", value: "₹2.74 Cr", confidence: 0.92 },
      { type: "rera_number", value: "RC/REP/HARERA/GGM/2023/45", confidence: 0.97 },
      { type: "possession", value: "Dec 2027" },
      { type: "price", value: "₹ call us" },
    ],
  };
  const b = {
    claims: [
      { type: "rera_number", value: "rc/rep/harera/ggm/2023/45", confidence: 0.9 },
      { type: "price", value: "Rs 2,74,00,000", confidence: 0.88 },
      { type: "possession", value: "December 2027", confidence: 0.8 },
      { type: "price", value: "on request" },
      { type: "area", value: "1,450 sq ft" },
    ],
  };
  const r = agree(a, b, {
    items: "claims",
    key: ["type"],
    fields: { value: "text" },
  });
  // values compare as text here; price pairs agree only through the inr kind (next test)
  assertEquals(r.agreed.map((f) => f.key), ["rera_number#1"]);
  assertEquals(
    r.disagreements.map((d) => [d.key, d.reason]),
    [["price#1", "differs"], ["possession#1", "differs"], ["price#2", "differs"], [
      "area#1",
      "only_b",
    ]],
  );
  assertEquals(r.agreed[0]!.confidence, 0.9);
  const money = agree(
    { claims: a.claims.filter((c) => c.type === "price") },
    { claims: b.claims.filter((c) => c.type === "price") },
    { items: "claims", key: ["type"], fields: { value: "inr" } },
  );
  assertEquals(money.agreed.map((f) => [f.key, f.value, f.confidence]), [[
    "price#1",
    27400000,
    0.88,
  ]]);
  assertEquals(money.disagreements.map((d) => [d.key, d.reason]), [["price#2", "unreadable"]]);
});

Deno.test("a field's kind can follow the item's type; factsOf lists one output's facts", () => {
  const spec = {
    items: "claims",
    key: ["type"],
    fields: {
      value: {
        by: "type",
        kinds: { price: "inr", possession: "date" } as const,
        default: "text" as const,
      },
    },
  };
  const r = agree(
    { claims: [{ type: "price", value: "₹98 L" }, { type: "possession", value: "Dec 2028" }] },
    {
      claims: [{ type: "price", value: "Rs 98,00,000" }, {
        type: "possession",
        value: "December 2028",
      }],
    },
    spec,
  );
  assertEquals(r.agreed.map((f) => [f.key, f.value]), [["price#1", 9800000], [
    "possession#1",
    "2028-12",
  ]]);
  const { facts, unreadable } = factsOf(
    {
      claims: [{ type: "price", value: "₹98 L", confidence: 0.9 }, { type: "price", value: "ask" }],
    },
    spec,
  );
  assertEquals(facts, [{ key: "price#1", field: "value", value: 9800000, confidence: 0.9 }]);
  assertEquals(unreadable, 1);
});

Deno.test("no confidence stated reads as 0, and empty outputs agree on nothing", () => {
  const r = agree({ total: "₹5 L" }, { total: "500000" }, { fields: { total: "inr" } });
  assertEquals([r.agreed.length, r.confidence], [1, 0]);
  const none = agree({}, {}, { fields: { total: "inr" } });
  assertEquals([none.agreed.length, none.disagreements.length, none.rate, none.confidence], [
    0,
    0,
    null,
    null,
  ]);
});
