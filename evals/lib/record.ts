// Re-records a set's responses from a live run (T63). Nightly or dev only; free tier; manifest
// inputs only. Never in CI's PR jobs (ci-evals runs recorded; the guard keeps AI_MODE live out of
// every workflow but nightly.yml).
//
//   AI_MODE=live AI_PROVIDER_TIER=free PLINTH_ENV=dev deno task record -- <set folder> [--write]
// Needs GEMINI_API_KEY, PLINTH_HASH_SALT, SUPABASE_URL and the secret key (the budget and the log
// are the dev database's api.ai_budget_status and api.ai_generation_log, T60), and the task's
// kill switch on. Without --write it prints what it would write. Every call goes through runTask,
// so the free tier refuses any golden whose source document is not in the sample manifest, and
// the daily budget applies.

import type { AiCatalogue } from "../../supabase/functions/_shared/ai/catalogue.ts";
import {
  DEFAULT_CATALOGUE,
  findTask,
  recordedDirFor,
} from "../../supabase/functions/_shared/ai/catalogue.ts";
import type { AiEnv } from "../../supabase/functions/_shared/ai/config.ts";
import { readAiEnv } from "../../supabase/functions/_shared/ai/config.ts";
import { isAiError } from "../../supabase/functions/_shared/ai/errors.ts";
import type { AiContext } from "../../supabase/functions/_shared/ai/gateway.ts";
import { runTask } from "../../supabase/functions/_shared/ai/gateway.ts";
import type {
  RecordedAttempt,
  RecordedResponse,
} from "../../supabase/functions/_shared/ai/recorded.ts";
import type { EvalSet } from "./sets.ts";
import { loadSet, REPO_ROOT, toTaskInput } from "./sets.ts";

export interface RecordedFileOut {
  path: string;
  file: RecordedResponse;
}

export interface RecordResult {
  files: RecordedFileOut[];
  failures: string[];
}

/** Why recording must not run in this environment, or null when it may. */
export function recordRefusal(env: AiEnv, vars: { ci?: string; workflow?: string }): string | null {
  if (env.mode !== "live") return "set AI_MODE=live to record";
  if (env.tier !== "free") {
    return "recordings are made on the free tier from fictional samples only (AI_PROVIDER_TIER=free)";
  }
  if (env.plinthEnv !== "dev" && env.plinthEnv !== "local") {
    return "record from PLINTH_ENV=dev or local only";
  }
  if (vars.ci === "true" && vars.workflow !== "nightly") {
    return "in CI, only the nightly workflow records";
  }
  return null;
}

function attemptOf(a: { text?: string; output?: unknown; tokens_in: number; tokens_out: number }) {
  let output = a.output;
  if (output === undefined && typeof a.text === "string") {
    try {
      output = JSON.parse(a.text);
    } catch {
      output = undefined;
    }
  }
  const out: RecordedAttempt = output !== undefined ? { output } : { text: a.text ?? "" };
  out.tokens_in = a.tokens_in;
  out.tokens_out = a.tokens_out;
  return out;
}

/** Runs every golden of a set live through the gateway and returns the files to write. */
export async function recordSet(
  set: EvalSet,
  ctx: AiContext,
  now: Date,
  root: URL = REPO_ROOT,
): Promise<RecordResult> {
  const catalogue: AiCatalogue = set.catalogue ?? ctx.catalogue ?? DEFAULT_CATALOGUE;
  const task = findTask(catalogue, set.gates.task);
  const readers = set.gates.readers ??
    ((task.readers ?? []).length >= 2 ? task.readers!.map((r) => r.id) : [undefined]);
  const files: RecordedFileOut[] = [];
  const failures: string[] = [];
  for (const golden of set.goldens) {
    const input = await toTaskInput(golden, root);
    for (const reader of readers) {
      try {
        const r = await runTask(task.key, input, { ...ctx, catalogue }, { reader });
        files.push({
          path: `${recordedDirFor(task)}/${r.input_sha256}.json`,
          file: {
            format: "plinth.ai_recorded/1",
            task: r.task,
            prompt_version: r.prompt_version,
            input_sha256: r.input_sha256,
            source_sha256: r.source_sha256,
            model: r.model,
            recorded_at: now.toISOString(),
            attempts: r.attempts.map(attemptOf),
          },
        });
      } catch (err) {
        const why = isAiError(err) ? `${err.aiCode}: ${err.detail}` : String(err);
        failures.push(`${golden.id}${reader ? ` (reader ${reader})` : ""}: ${why}`);
      }
    }
  }
  return { files, failures };
}

async function main(args: string[]): Promise<number> {
  const rest = args.filter((a) => a !== "--");
  const write = rest.includes("--write");
  const dirs = rest.filter((a) => !a.startsWith("--"));
  if (dirs.length !== 1) {
    console.error("usage: deno task record -- <set folder> [--write]");
    return 2;
  }
  const env = readAiEnv();
  const refusal = recordRefusal(env, {
    ci: Deno.env.get("CI"),
    workflow: Deno.env.get("GITHUB_WORKFLOW"),
  });
  if (refusal) {
    console.error(`record refused: ${refusal}`);
    return 2;
  }
  // Loaded here so the recorded-mode runner and its tests never load supabase-js.
  const core = await import("../../supabase/functions/_shared/core/mod.ts");
  const rpc = core.secretClient(core.readSupabaseConfig(), { fn: "evals-record" });
  const log = core.createLogger({ fn: "evals-record" });
  const ctx: AiContext = {
    env,
    rpc,
    flags: core.flagsReader(core.rpcFlagsLoader(rpc), { log }),
    log,
  };
  const set = await loadSet(new URL(`${dirs[0]!.replace(/\/+$/, "")}/`, REPO_ROOT));
  const { files, failures } = await recordSet(set, ctx, new Date());
  for (const { path, file } of files) {
    if (write) {
      const url = new URL(path, REPO_ROOT);
      await Deno.mkdir(new URL("./", url), { recursive: true });
      await Deno.writeTextFile(url, `${JSON.stringify(file, null, 2)}\n`);
    }
    console.log(`${write ? "wrote" : "would write"} ${path}`);
  }
  for (const f of failures) console.error(`not recorded: ${f}`);
  return failures.length ? 1 : 0;
}

if (import.meta.main) Deno.exit(await main(Deno.args));
