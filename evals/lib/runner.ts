// Runs an eval set through the gateway in recorded mode (T63).
//
// For each golden case: every reader the set names runs through runTask with AI_MODE=recorded
// (a recorded miss is a case error, never a live call), the two readers are compared with agree(),
// and the facts that would reach the rules are scored against the golden (metrics.ts). The flags
// are on and the RPCs are stubs: an eval measures the readers, not the switches or the database.

import type { Fact } from "../../supabase/functions/_shared/ai/agree.ts";
import { agree, factsOf } from "../../supabase/functions/_shared/ai/agree.ts";
import type { AiCatalogue } from "../../supabase/functions/_shared/ai/catalogue.ts";
import { DEFAULT_CATALOGUE, findTask } from "../../supabase/functions/_shared/ai/catalogue.ts";
import type { AiEnv } from "../../supabase/functions/_shared/ai/config.ts";
import { isAiError } from "../../supabase/functions/_shared/ai/errors.ts";
import type { AiContext } from "../../supabase/functions/_shared/ai/gateway.ts";
import { runTask } from "../../supabase/functions/_shared/ai/gateway.ts";
import type { PromptSource } from "../../supabase/functions/_shared/ai/prompts.ts";
import { filePromptSource } from "../../supabase/functions/_shared/ai/prompts.ts";
import type { RecordedStore } from "../../supabase/functions/_shared/ai/recorded.ts";
import { fileRecordedStore } from "../../supabase/functions/_shared/ai/recorded.ts";
import { Secret } from "../../supabase/functions/_shared/core/env.ts";
import type { Logger } from "../../supabase/functions/_shared/core/log.ts";
import { createLogger } from "../../supabase/functions/_shared/core/log.ts";
import type { RpcClient } from "../../supabase/functions/_shared/core/supabase.ts";
import type { CaseResult, SetScore } from "./metrics.ts";
import { aggregate, checkGates, correctFacts } from "./metrics.ts";
import type { EvalSet } from "./sets.ts";
import { REPO_ROOT, toTaskInput } from "./sets.ts";

export interface SetReport {
  set: string;
  task: string;
  readers: string[];
  cases: CaseResult[];
  score: SetScore;
  misses: string[];
  passed: boolean;
}

export interface RunSetOptions {
  root?: URL;
  recorded?: RecordedStore;
  prompts?: PromptSource;
  log?: Logger;
}

/** The recorded-mode environment every eval runs in. The salt only keys vault hashes. */
export const EVAL_ENV: AiEnv = {
  plinthEnv: "test",
  mode: "recorded",
  tier: "free",
  geminiKey: null,
  hashSalt: new Secret("plinth-evals"),
};

/** RPC stubs: generation logs are accepted and dropped; nothing else is called in recorded mode. */
export const stubRpc: RpcClient = {
  rpc(fn) {
    const result = Promise.resolve(
      fn === "ai_generation_log"
        ? { data: "eval", error: null }
        : { data: null, error: { code: "PGRST202", message: `api.${fn} is not stubbed in evals` } },
    );
    return { then: result.then.bind(result) };
  },
};

const quietLog = createLogger({ fn: "evals", sink: () => {}, minLevel: "error" });

function readersFor(set: EvalSet, catalogue: AiCatalogue): string[] {
  if (set.gates.readers) return set.gates.readers;
  const task = findTask(catalogue, set.gates.task);
  return (task.readers ?? []).length >= 2 ? task.readers!.map((r) => r.id) : [];
}

/** Runs one set and scores it against its gates. */
export async function runSet(set: EvalSet, opts: RunSetOptions = {}): Promise<SetReport> {
  const root = opts.root ?? REPO_ROOT;
  const catalogue = set.catalogue ?? DEFAULT_CATALOGUE;
  const ctx: AiContext = {
    env: EVAL_ENV,
    rpc: stubRpc,
    flags: { isOn: () => Promise.resolve(true) },
    log: opts.log ?? quietLog,
    catalogue,
    prompts: opts.prompts ??
      (set.gates.prompts ? filePromptSource(new URL(`${set.gates.prompts}/`, set.dir)) : undefined),
    recorded: opts.recorded ?? fileRecordedStore(root),
    fetch: () => Promise.reject(new Error("evals never fetch")),
  };
  const readers = readersFor(set, catalogue);
  const bar = set.gates.confidence_bar ?? 0;
  const spec = set.gates.compare;
  const cases: CaseResult[] = [];

  for (const golden of set.goldens) {
    const expected = factsOf(golden.expected, spec);
    const base: CaseResult = {
      id: golden.id,
      predicted: [],
      expected: expected.facts,
      agreed: null,
      disagreed: null,
      agreed_but_wrong: null,
      unreadable_expected: expected.unreadable,
      error: expected.unreadable ? `the golden has ${expected.unreadable} unreadable values` : null,
    };
    if (base.error) {
      cases.push(base);
      continue;
    }
    try {
      const input = await toTaskInput(golden, root);
      if (readers.length >= 2) {
        const [ra, rb] = readers;
        const a = await runTask(set.gates.task, input, ctx, { reader: ra });
        const b = await runTask(set.gates.task, input, ctx, { reader: rb });
        const r = agree(a.output, b.output, spec);
        const predicted: Fact[] = r.agreed
          .filter((f) => f.confidence >= bar)
          .map(({ key, field, value, confidence }) => ({ key, field, value, confidence }));
        cases.push({
          ...base,
          predicted,
          agreed: r.agreed.length,
          disagreed: r.disagreements.length,
          agreed_but_wrong: predicted.length - correctFacts(predicted, expected.facts).length,
        });
      } else {
        const one = await runTask(set.gates.task, input, ctx, { reader: readers[0] });
        const predicted = factsOf(one.output, spec).facts.filter((f) => f.confidence >= bar);
        cases.push({ ...base, predicted });
      }
    } catch (err) {
      const why = isAiError(err) ? `${err.aiCode}: ${err.detail}` : String(err);
      cases.push({ ...base, error: why });
    }
  }

  const score = aggregate(cases, Object.keys(spec.fields), readers.length >= 2);
  const misses = checkGates(score, set.gates.gates);
  return {
    set: set.rel,
    task: set.gates.task,
    readers,
    cases,
    score,
    misses,
    passed: misses.length === 0,
  };
}

const pct = (x: number | null) => (x === null ? "n/a" : `${(x * 100).toFixed(1)}%`);

/** A short plain-text report: one line per field, then the gate verdict. */
export function formatReport(r: SetReport): string {
  const lines = [
    `${r.passed ? "PASS" : "FAIL"} ${r.set} (${r.task}; readers ${
      r.readers.join(", ") || "one"
    }; ${r.score.cases} cases)`,
  ];
  const row = (name: string, s: SetScore["overall"]) =>
    `  ${name.padEnd(24)} P ${pct(s.precision).padStart(6)}  R ${pct(s.recall).padStart(6)}  F1 ${
      pct(s.f1).padStart(6)
    }  (${s.correct}/${s.predicted} predicted, ${s.expected} expected)`;
  lines.push(row("overall", r.score.overall));
  for (const [f, s] of Object.entries(r.score.fields)) lines.push(row(`field ${f}`, s));
  lines.push(
    `  agreement rate ${pct(r.score.agreement_rate)} · agreed-but-wrong ${
      r.score.agreed_but_wrong ?? "n/a"
    } · errors ${r.score.errors}`,
  );
  for (const c of r.cases) if (c.error) lines.push(`  case ${c.id}: ${c.error}`);
  for (const m of r.misses) lines.push(`  gate missed: ${m}`);
  return lines.join("\n");
}
