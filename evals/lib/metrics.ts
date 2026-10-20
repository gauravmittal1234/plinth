// Eval metrics (T63; BUILD_PLAN §14 hard rule 7).
//
// Facts are (item key, field, normalised value). Per field and overall (micro):
//   precision = correct / predicted   recall = correct / expected   F1 = their harmonic mean
// where "predicted" is what would reach the rules: with two readers, the facts both agreed on at
// or above the confidence bar; with one reader, its facts at or above the bar. Two more numbers:
//   agreement rate     agreed facts / (agreed + disagreements), over every case
//   agreed-but-wrong   agreed facts above the bar that are not in the golden: both readers made the
//                      same mistake, which is how a false "Differs" would reach a buyer. Gate: 0.
// No prediction is a precision of 1 and no expectation a recall of 1 (nothing to get wrong).

import type { Fact } from "../../supabase/functions/_shared/ai/agree.ts";
import { normalisedKey } from "../../supabase/functions/_shared/ai/agree.ts";
import type { FieldGate, GateSpec } from "./sets.ts";

export interface CaseResult {
  id: string;
  predicted: Fact[];
  expected: Fact[];
  /** Two readers only: agreed facts (any confidence) and disagreements. */
  agreed: number | null;
  disagreed: number | null;
  agreed_but_wrong: number | null;
  /** Readable-value failures in the golden's expected output (a broken golden). */
  unreadable_expected: number;
  error: string | null;
}

export interface Score {
  predicted: number;
  expected: number;
  correct: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface SetScore {
  overall: Score;
  fields: Record<string, Score>;
  agreement_rate: number | null;
  agreed_but_wrong: number | null;
  errors: number;
  cases: number;
}

export function factKey(f: Fact): string {
  return `${f.key ?? ""}|${f.field}|${normalisedKey(f.value)}`;
}

export function score(predicted: number, expected: number, correct: number): Score {
  const precision = predicted ? correct / predicted : 1;
  const recall = expected ? correct / expected : 1;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  return { predicted, expected, correct, precision, recall, f1 };
}

/** The predicted facts that match an expected fact (each expected fact matches once). */
export function correctFacts(predicted: readonly Fact[], expected: readonly Fact[]): Fact[] {
  const pool = new Map<string, number>();
  for (const f of expected) pool.set(factKey(f), (pool.get(factKey(f)) ?? 0) + 1);
  const out: Fact[] = [];
  for (const f of predicted) {
    const k = factKey(f);
    const left = pool.get(k) ?? 0;
    if (left > 0) {
      pool.set(k, left - 1);
      out.push(f);
    }
  }
  return out;
}

/**
 * Aggregates case results over the compared fields. With two readers the agreement numbers are
 * always reported (0 agreed of 0 is a rate of null, which misses an agreement gate).
 */
export function aggregate(
  cases: readonly CaseResult[],
  fields: readonly string[],
  twoReaders: boolean,
): SetScore {
  const per: Record<string, { p: number; e: number; c: number }> = {};
  for (const f of fields) per[f] = { p: 0, e: 0, c: 0 };
  let agreed = 0;
  let disagreed = 0;
  let wrong: number | null = twoReaders ? 0 : null;
  for (const c of cases) {
    if (c.error) continue;
    for (const f of c.predicted) if (per[f.field]) per[f.field]!.p++;
    for (const f of c.expected) if (per[f.field]) per[f.field]!.e++;
    for (const f of correctFacts(c.predicted, c.expected)) if (per[f.field]) per[f.field]!.c++;
    agreed += c.agreed ?? 0;
    disagreed += c.disagreed ?? 0;
    if (wrong !== null) wrong += c.agreed_but_wrong ?? 0;
  }
  const fieldScores: Record<string, Score> = {};
  let p = 0;
  let e = 0;
  let c = 0;
  for (const [f, s] of Object.entries(per)) {
    fieldScores[f] = score(s.p, s.e, s.c);
    p += s.p;
    e += s.e;
    c += s.c;
  }
  return {
    overall: score(p, e, c),
    fields: fieldScores,
    agreement_rate: twoReaders && agreed + disagreed > 0 ? agreed / (agreed + disagreed) : null,
    agreed_but_wrong: wrong,
    errors: cases.filter((x) => x.error).length,
    cases: cases.length,
  };
}

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function fieldMisses(name: string, s: Score, g: FieldGate): string[] {
  const out: string[] = [];
  if (g.precision_min != null && s.precision < g.precision_min) {
    out.push(`${name} precision ${pct(s.precision)} < ${pct(g.precision_min)}`);
  }
  if (g.recall_min != null && s.recall < g.recall_min) {
    out.push(`${name} recall ${pct(s.recall)} < ${pct(g.recall_min)}`);
  }
  if (g.f1_min != null && s.f1 < g.f1_min) out.push(`${name} f1 ${pct(s.f1)} < ${pct(g.f1_min)}`);
  return out;
}

/** Every gate the score misses, as readable lines; [] when the set passes. */
export function checkGates(s: SetScore, g: GateSpec): string[] {
  const misses = fieldMisses("overall", s.overall, g);
  for (const [field, fg] of Object.entries(g.fields ?? {})) {
    const fs = s.fields[field];
    if (!fs) misses.push(`field ${field} has a gate but is not compared`);
    else misses.push(...fieldMisses(`field ${field}`, fs, fg));
  }
  if (g.agreement_rate_min != null) {
    if (s.agreement_rate === null) {
      misses.push("agreement_rate has a gate but no two-reader facts were compared");
    } else if (s.agreement_rate < g.agreement_rate_min) {
      misses.push(`agreement_rate ${pct(s.agreement_rate)} < ${pct(g.agreement_rate_min)}`);
    }
  }
  if (g.agreed_but_wrong_max != null) {
    if (s.agreed_but_wrong === null) {
      misses.push("agreed_but_wrong has a gate but the set has one reader");
    } else if (s.agreed_but_wrong > g.agreed_but_wrong_max) {
      misses.push(`agreed_but_wrong ${s.agreed_but_wrong} > ${g.agreed_but_wrong_max}`);
    }
  }
  const errorsMax = g.errors_max ?? 0;
  if (s.errors > errorsMax) misses.push(`errors ${s.errors} > ${errorsMax}`);
  if (s.cases === 0) misses.push("the set has no golden cases");
  return misses;
}
