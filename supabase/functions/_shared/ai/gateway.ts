// The AI gateway (T63; BUILD_PLAN §14, DECISIONS E-8, FOUNDER_QUESTIONS M3-1 to M3-3, M3-13).
//
// runTask(taskKey, input, ctx, { reader }) is the one way edge code reaches a model:
//   1. the task from the catalogue (unknown_task); tool-using tasks are not run here
//   2. its kill switch (flag_off), e.g. ai_doc_check for every doc-check task
//   3. AI_MODE=live under PLINTH_ENV=test refuses (live_refused)
//   4. the input normalised and PII-stripped per the task's pii_policy; the vault stays here
//   5. input_sha256 = sha256(task@version, prompt version, normalised stripped input)
//   6. the response schema (schema_missing) and the prompt file (prompt_missing)
//   7. recorded: replay <recorded_dir>/<sha>.json; a miss is recorded_miss, never a live call
//      live: model_id pinned (model_unpinned); free tier only for manifest documents
//      (tier_refused); GEMINI_API_KEY set (config); api.ai_budget_status before every call
//      (budget_unset, budget_exhausted at 100%, a warn line at 80%); generateContent with the
//      responseSchema, document as fenced data, no tools
//   8. the output must match the schema: one retry, then schema_mismatch
//   9. every call, answered or not, writes ops.ai_generations (api.ai_generation_log), redacted
// runReaders() runs every reader of a two-reader task on the same input; agree.ts compares them.

import type { Clock } from "../core/clock.ts";
import { systemClock } from "../core/clock.ts";
import type { Secret } from "../core/env.ts";
import type { FlagKey } from "../core/flags.ts";
import type { Logger } from "../core/log.ts";
import type { RpcClient } from "../core/supabase.ts";
import { checkBudget } from "./budget.ts";
import type { AiCatalogue, AiReader, AiTask } from "./catalogue.ts";
import {
  DEFAULT_CATALOGUE,
  findTask,
  killSwitchFor,
  modelFor,
  promptVersionFor,
  readerFor,
  recordedDirFor,
} from "./catalogue.ts";
import type { AiEnv, AiTier } from "./config.ts";
import { AiError } from "./errors.ts";
import type { GeminiAnswer } from "./gemini.ts";
import { buildRequest, callGemini } from "./gemini.ts";
import type { NormalisedInput, TaskInput } from "./input.ts";
import { inputSha, normaliseInput } from "./input.ts";
import type { GenerationRecord } from "./log.ts";
import { logGeneration, redactOutput } from "./log.ts";
import type { PiiVault } from "./pii.ts";
import { PiiStripper } from "./pii.ts";
import type { PromptSource } from "./prompts.ts";
import { filePromptSource } from "./prompts.ts";
import type { ManifestLoader, RecordedAttempt, RecordedStore } from "./recorded.ts";
import { fileManifestLoader, fileRecordedStore } from "./recorded.ts";
import type { SchemaSource } from "./schema.ts";
import { schemaSource, toGeminiSchema } from "./schema.ts";
import type { Attempted } from "./validate.ts";
import { withOneRetry } from "./validate.ts";
import { wrapInput } from "./wrap.ts";

/** ₹ per million tokens for a model on the paid tier (the free tier costs nothing). */
export interface ModelPrice {
  inr_per_mtok_in: number;
  inr_per_mtok_out: number;
}

export interface AiContext {
  env: AiEnv;
  /** A service-role client: api.ai_budget_status and api.ai_generation_log are service only. */
  rpc: RpcClient;
  flags: { isOn(key: FlagKey): Promise<boolean> };
  log: Logger;
  catalogue?: AiCatalogue;
  prompts?: PromptSource;
  schemas?: SchemaSource;
  recorded?: RecordedStore;
  manifest?: ManifestLoader;
  /** Live calls only; tests inject a fake. */
  fetch?: typeof fetch;
  clock?: Clock;
  requestId?: string;
  /** Per model call (default 25 s; doc-check answers within 30 s on web). */
  timeoutMs?: number;
  /** Paid-tier prices by model id. */
  pricing?: Readonly<Record<string, ModelPrice>>;
}

export interface RunOptions {
  /** The reader ("a", "b") for a task that lists readers. */
  reader?: string;
}

/** One raw answer, as record.ts writes it. */
export interface RawAttempt extends RecordedAttempt {
  text?: string;
  tokens_in: number;
  tokens_out: number;
}

export interface TaskResult {
  task: string;
  reader: string | null;
  prompt_version: string;
  input_sha256: string;
  source_sha256: string;
  /** The validated output. */
  output: unknown;
  mode: "live" | "recorded";
  tier: AiTier;
  model: string | null;
  tokens_in: number;
  tokens_out: number;
  cost_inr: number | null;
  latency_ms: number;
  model_calls: number;
  attempts: RawAttempt[];
  /** PII tokens → salted hash and last 4. In-process only. */
  vault: PiiVault;
  /** False when the ops.ai_generations write failed (the JSON log has the error). */
  logged: boolean;
}

const DEFAULT_TIMEOUT_MS = 25_000;

interface FileDefaults {
  prompts: PromptSource;
  schemas: SchemaSource;
  recorded: RecordedStore;
  manifest: ManifestLoader;
}
let defaults: FileDefaults | null = null;

/** The file-backed sources, made once per isolate so their caches last across calls. */
function fileDefaults(): FileDefaults {
  defaults ??= {
    prompts: filePromptSource(),
    schemas: schemaSource(),
    recorded: fileRecordedStore(),
    manifest: fileManifestLoader(),
  };
  return defaults;
}

/** Strips PII from the document parts of a normalised input with one stripper (stable tokens). */
function stripInput(input: NormalisedInput, stripper: PiiStripper): NormalisedInput {
  const out: NormalisedInput = { ...input };
  if (input.lines) {
    const stripped = stripper.strip(input.lines.map((l) => l.text).join("\n")).split("\n");
    out.lines = input.lines.map((l, i) => ({ id: l.id, text: stripped[i] ?? "" }));
  }
  if (input.text !== undefined) out.text = stripper.strip(input.text);
  if (input.params) {
    out.params = Object.fromEntries(
      Object.entries(input.params).map((
        [k, v],
      ) => [k, typeof v === "string" ? stripper.strip(v) : v]),
    );
  }
  return out;
}

export interface PreparedInput {
  normalised: NormalisedInput;
  /** What the model sees (and what is hashed): normalised, PII stripped. */
  stripped: NormalisedInput;
  input_sha256: string;
  vault: PiiVault;
}

/**
 * Steps 4–5 of runTask: normalise, strip PII per the task's policy, hash. The salt keys only the
 * vault's hashes, never the tokens, so the input SHA does not depend on it.
 */
export async function prepareInput(
  task: AiTask,
  promptVersion: string,
  input: TaskInput,
  salt: Secret | string,
): Promise<PreparedInput> {
  const normalised = await normaliseInput(input);
  const stripper = new PiiStripper(task.pii_policy, salt);
  const stripped = stripInput(normalised, stripper);
  return {
    normalised,
    stripped,
    input_sha256: await inputSha(task.key, promptVersion, stripped),
    vault: await stripper.vault(),
  };
}

/** The input SHA runTask would compute for this task, reader and input (record.ts, tests). */
export async function inputShaFor(
  taskKey: string,
  input: TaskInput,
  opts: RunOptions & { catalogue?: AiCatalogue } = {},
): Promise<string> {
  const task = findTask(opts.catalogue ?? DEFAULT_CATALOGUE, taskKey);
  const promptVersion = promptVersionFor(task, readerFor(task, opts.reader));
  return (await prepareInput(task, promptVersion, input, "sha-only")).input_sha256;
}

function costInr(
  tier: AiTier,
  model: string | null,
  tokensIn: number,
  tokensOut: number,
  pricing: AiContext["pricing"],
): number | null {
  if (tier === "free") return 0;
  const price = model ? pricing?.[model] : undefined;
  if (!price) return null;
  const inr = (tokensIn * price.inr_per_mtok_in + tokensOut * price.inr_per_mtok_out) / 1e6;
  return Math.round(inr * 10_000) / 10_000;
}

/** Runs one AI task call. Throws AiError on every refusal and failure; always logs. */
export async function runTask(
  taskKey: string,
  input: TaskInput,
  ctx: AiContext,
  opts: RunOptions = {},
): Promise<TaskResult> {
  const clock = ctx.clock ?? systemClock;
  const started = clock.now().getTime();
  const { env } = ctx;
  const log = ctx.log.child({ ai_task: taskKey });

  let task: AiTask | null = null;
  let reader: AiReader | null = null;
  let promptVersion: string | null = null;
  let sha: string | null = null;
  let source: string | null = null;
  let model: string | null = null;
  let tokensIn = 0;
  let tokensOut = 0;
  let modelCalls = 0;
  let written = false;

  const write = (
    status: GenerationRecord["status"],
    errorCode: GenerationRecord["error_code"],
    output: unknown,
    detail?: string,
  ): Promise<boolean> => {
    written = true;
    const cost = env.mode === "live"
      ? costInr(env.tier, model, tokensIn, tokensOut, ctx.pricing)
      : 0;
    return logGeneration(
      ctx.rpc,
      {
        task: task?.key ?? taskKey,
        prompt_version: promptVersion,
        model,
        mode: env.mode,
        tier: env.tier,
        status,
        error_code: errorCode,
        input_sha256: sha,
        source_sha256: source,
        output: output === undefined || !env.hashSalt ? null : redactOutput(output, env.hashSalt),
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_inr: cost,
        latency_ms: Math.max(0, clock.now().getTime() - started),
        model_calls: modelCalls,
        request_id: ctx.requestId ?? null,
      },
      log,
      detail,
    );
  };

  try {
    task = findTask(ctx.catalogue ?? DEFAULT_CATALOGUE, taskKey);
    if (task.tools?.length) {
      throw new AiError("config", `AI task ${task.key} uses tools; this gateway sends none`);
    }
    reader = readerFor(task, opts.reader);
    promptVersion = promptVersionFor(task, reader);

    const flag = killSwitchFor(task);
    if (!(await ctx.flags.isOn(flag))) throw new AiError("flag_off", `${flag} is off`);
    if (env.mode === "live" && env.plinthEnv === "test") {
      throw new AiError("live_refused", "AI_MODE=live is refused under PLINTH_ENV=test");
    }
    if (!env.hashSalt) throw new AiError("config", "PLINTH_HASH_SALT is not set");

    const { normalised, stripped, input_sha256, vault } = await prepareInput(
      task,
      promptVersion,
      input,
      env.hashSalt,
    );
    source = normalised.source_sha256;
    sha = input_sha256;

    const schema = await (ctx.schemas ?? fileDefaults().schemas).forTask(task);
    const prompt = await (ctx.prompts ?? fileDefaults().prompts).get(task.id, promptVersion);

    let outcome: Attempted<RawAttempt>;
    if (env.mode === "recorded") {
      const rec = await (ctx.recorded ?? fileDefaults().recorded).get(recordedDirFor(task), sha);
      if (!rec) {
        throw new AiError(
          "recorded_miss",
          `no recorded response ${recordedDirFor(task)}/${sha}.json`,
        );
      }
      if (
        rec.task !== task.key || rec.prompt_version !== promptVersion || rec.input_sha256 !== sha
      ) {
        throw new AiError("config", `recorded response ${sha} is for another task or prompt`);
      }
      model = rec.model ?? null;
      outcome = await withOneRetry(schema, (n): Promise<RawAttempt> => {
        const a = rec.attempts[n];
        if (!a) {
          return Promise.reject(
            new AiError("schema_mismatch", "the recording has no retry answer"),
          );
        }
        tokensIn += a.tokens_in ?? 0;
        tokensOut += a.tokens_out ?? 0;
        return Promise.resolve({
          ...a,
          tokens_in: a.tokens_in ?? 0,
          tokens_out: a.tokens_out ?? 0,
        });
      }, (n, issue) => log.warn("ai output failed the schema", { attempt: n, issue }));
    } else {
      model = modelFor(task, reader);
      if (!model) throw new AiError("model_unpinned", `AI task ${task.key} has no pinned model_id`);
      if (env.tier === "free") {
        const allowed = await (ctx.manifest ?? fileDefaults().manifest)();
        const media = normalised.media?.sha256;
        if (!allowed.has(normalised.source_sha256) || (media && !allowed.has(media))) {
          throw new AiError(
            "tier_refused",
            "the free tier only reads the fictional sample documents in the manifest",
          );
        }
      }
      const key = env.geminiKey;
      if (!key) throw new AiError("config", "GEMINI_API_KEY is not set");
      if (env.tier === "paid" && task.budget_inr_per_day !== null && !ctx.pricing?.[model]) {
        throw new AiError("config", `no paid price for ${model}, so its ₹ budget cannot be kept`);
      }
      const request = buildRequest({
        prompt,
        parts: wrapInput(stripped),
        media: input.media,
        responseSchema: toGeminiSchema(schema),
        temperature: task.temperature,
        maxOutputTokens: task.max_output_tokens,
      });
      const pinned = model;
      outcome = await withOneRetry(schema, async (n): Promise<RawAttempt> => {
        await checkBudget(ctx.rpc, task!, log, n);
        modelCalls++;
        const answer: GeminiAnswer = await callGemini({
          model: pinned,
          key,
          request,
          fetch: ctx.fetch ?? fetch,
          timeoutMs: ctx.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        });
        tokensIn += answer.tokens_in;
        tokensOut += answer.tokens_out;
        return { text: answer.text, tokens_in: answer.tokens_in, tokens_out: answer.tokens_out };
      }, (n, issue) => log.warn("ai output failed the schema", { attempt: n, issue }));
    }

    if (!outcome.ok) {
      const last = outcome.attempts.at(-1);
      await write(
        statusOf(outcome.error),
        outcome.error.aiCode,
        last ? { rejected: last.output ?? last.text } : undefined,
        outcome.error.detail,
      );
      throw outcome.error;
    }
    const logged = await write("ok", null, outcome.output);
    return {
      task: task.key,
      reader: reader?.id ?? null,
      prompt_version: promptVersion,
      input_sha256: sha,
      source_sha256: source,
      output: outcome.output,
      mode: env.mode,
      tier: env.tier,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_inr: env.mode === "live"
        ? costInr(env.tier, model, tokensIn, tokensOut, ctx.pricing)
        : 0,
      latency_ms: Math.max(0, clock.now().getTime() - started),
      model_calls: modelCalls,
      attempts: outcome.attempts,
      vault,
      logged,
    };
  } catch (err) {
    if (!written) {
      if (err instanceof AiError) await write(statusOf(err), err.aiCode, undefined, err.detail);
      else await write("error", null, undefined, err instanceof Error ? err.name : "unknown");
    }
    throw err;
  }
}

function statusOf(err: AiError): GenerationRecord["status"] {
  return err.refused ? "refused" : "error";
}

/** Runs every reader of a two-reader task on the same input, in parallel. */
export async function runReaders(
  taskKey: string,
  input: TaskInput,
  ctx: AiContext,
): Promise<Record<string, TaskResult>> {
  const task = findTask(ctx.catalogue ?? DEFAULT_CATALOGUE, taskKey);
  const ids = (task.readers ?? []).map((r) => r.id);
  if (ids.length < 2) throw new AiError("config", `AI task ${task.key} has fewer than two readers`);
  const results = await Promise.all(ids.map((reader) => runTask(taskKey, input, ctx, { reader })));
  return Object.fromEntries(ids.map((id, i) => [id, results[i]!]));
}
