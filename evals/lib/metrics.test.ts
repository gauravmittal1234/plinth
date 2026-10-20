import type { Fact } from "../../supabase/functions/_shared/ai/agree.ts";
import { assertEquals } from "../../supabase/functions/_shared/testing/mod.ts";
import type { CaseResult } from "./metrics.ts";
import { aggregate, checkGates, correctFacts, score } from "./metrics.ts";

const fact = (key: string, field: string, value: string | number, confidence = 1): Fact => ({
  key,
  field,
  value,
  confidence,
});

function caseOf(over: Partial<CaseResult>): CaseResult {
  return {
    id: "c",
    predicted: [],
    expected: [],
    agreed: null,
    disagreed: null,
    agreed_but_wrong: null,
    unreadable_expected: 0,
    error: null,
    ...over,
  };
}

Deno.test("score: precision, recall, F1, and the empty cases", () => {
  const s = score(4, 5, 3);
  assertEquals([s.precision, s.recall, Math.round(s.f1 * 1e4) / 1e4], [0.75, 0.6, 0.6667]);
  assertEquals(score(0, 0, 0).f1, 1);
  assertEquals([score(0, 3, 0).precision, score(0, 3, 0).recall, score(0, 3, 0).f1], [1, 0, 0]);
});

Deno.test("correctFacts matches each expected fact once, by key, field and value", () => {
  const expected = [fact("price#1", "value", 100), fact("price#2", "value", 100)];
  const predicted = [
    fact("price#1", "value", 100),
    fact("price#1", "value", 100),
    fact("price#2", "value", 99),
  ];
  assertEquals(correctFacts(predicted, expected).length, 1);
});

Deno.test("aggregate and gates: per field, agreement rate, agreed-but-wrong, errors", () => {
  const cases = [
    caseOf({
      predicted: [fact("a#1", "value", 1), fact("b#1", "value", 2)],
      expected: [fact("a#1", "value", 1), fact("b#1", "value", 3), fact("c#1", "value", 4)],
      agreed: 2,
      disagreed: 1,
      agreed_but_wrong: 1,
    }),
    caseOf({ id: "broken", error: "recorded_miss: no recorded response" }),
  ];
  const s = aggregate(cases, ["value"], true);
  assertEquals([s.overall.precision, s.overall.recall], [0.5, 1 / 3]);
  assertEquals([s.agreement_rate, s.agreed_but_wrong, s.errors, s.cases], [2 / 3, 1, 1, 2]);
  assertEquals(
    checkGates(s, {
      precision_min: 0.5,
      recall_min: 0.3,
      agreement_rate_min: 0.6,
      agreed_but_wrong_max: 0,
      errors_max: 1,
      fields: { value: { f1_min: 0.5 } },
    }),
    ["field value f1 40.0% < 50.0%", "agreed_but_wrong 1 > 0"],
  );
});

Deno.test("one reader: agreement gates cannot pass; an empty set fails", () => {
  const single = aggregate([caseOf({ predicted: [], expected: [] })], ["value"], false);
  assertEquals([single.agreement_rate, single.agreed_but_wrong], [null, null]);
  assertEquals(checkGates(single, { agreed_but_wrong_max: 0 }), [
    "agreed_but_wrong has a gate but the set has one reader",
  ]);
  assertEquals(checkGates(aggregate([], ["value"], true), {}), ["the set has no golden cases"]);
});
