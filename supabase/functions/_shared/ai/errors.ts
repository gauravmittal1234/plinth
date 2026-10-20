// AI gateway errors (T63). Every refusal and failure of runTask is an AiError with a stable code.
//
// AiError extends the edge HttpError, so a handler that lets it escape answers a contract error:
// a kill switch, an exhausted budget or a provider outage is `flag_off` (503, "not switched on
// right now"); everything else is `internal` (500). The AI code itself goes to the log and to
// ops.ai_generations (error_code), never to the buyer.

import type { EdgeErrorCode } from "../core/errors.ts";
import { HttpError } from "../core/errors.ts";

export const AI_ERROR_CODES = [
  /** The task key is not in the catalogue. */
  "unknown_task",
  /** The task's kill switch (catalogue flag, e.g. ai_doc_check) is off. */
  "flag_off",
  /** AI_MODE=live under PLINTH_ENV=test: CI never calls a model. */
  "live_refused",
  /** AI_MODE=recorded and no recorded response for this input SHA. Never a live fallback. */
  "recorded_miss",
  /** A live call for a task (or reader) whose model_id is still null. */
  "model_unpinned",
  /** AI_PROVIDER_TIER=free and the input is not a fictional sample in the manifest (E-8). */
  "tier_refused",
  /** No daily call cap and no ₹ budget: a task cannot go live unbudgeted. */
  "budget_unset",
  /** 100% of the daily call cap or the ₹ budget is used (the kill switch). */
  "budget_exhausted",
  /** The budget could not be read; live calls fail closed. */
  "budget_unavailable",
  /** The task has no response schema, so its output could not be checked. */
  "schema_missing",
  /** The output failed the response schema twice (one retry). */
  "schema_mismatch",
  /** The task's prompt file for this version is missing. */
  "prompt_missing",
  /** A reader-based task was called without a reader, or with one it does not list. */
  "reader_required",
  /** The input is malformed (no text, lines and media; a bad SHA; a bad id). */
  "bad_input",
  /** A missing secret or an inconsistent catalogue entry. */
  "config",
  /** The provider refused the prompt or stopped for safety. */
  "provider_blocked",
  /** The provider answered with an HTTP error, timed out, or sent no candidate. */
  "provider_error",
] as const;
export type AiErrorCode = typeof AI_ERROR_CODES[number];

/** AI code → contract code: switched off and budget or provider trouble read as 503. */
const EDGE_CODE: Readonly<Record<AiErrorCode, EdgeErrorCode>> = {
  unknown_task: "internal",
  flag_off: "flag_off",
  live_refused: "internal",
  recorded_miss: "internal",
  model_unpinned: "flag_off",
  tier_refused: "flag_off",
  budget_unset: "flag_off",
  budget_exhausted: "flag_off",
  budget_unavailable: "flag_off",
  schema_missing: "internal",
  schema_mismatch: "internal",
  prompt_missing: "internal",
  reader_required: "internal",
  bad_input: "invalid_input",
  config: "internal",
  provider_blocked: "internal",
  provider_error: "flag_off",
};

/** Refusals happen before any model call; errors happen during or after one. */
export const REFUSALS: ReadonlySet<AiErrorCode> = new Set([
  "unknown_task",
  "flag_off",
  "live_refused",
  "model_unpinned",
  "tier_refused",
  "budget_unset",
  "budget_exhausted",
  "budget_unavailable",
  "schema_missing",
  "prompt_missing",
  "reader_required",
  "bad_input",
  "config",
]);

export class AiError extends HttpError {
  readonly aiCode: AiErrorCode;
  /** A log-safe detail (names, counts, codes; never document text). */
  readonly detail: string;

  constructor(aiCode: AiErrorCode, detail: string, options: { cause?: unknown } = {}) {
    super(EDGE_CODE[aiCode], undefined, { cause: options.cause });
    this.name = "AiError";
    this.aiCode = aiCode;
    this.detail = detail;
  }

  get refused(): boolean {
    return REFUSALS.has(this.aiCode);
  }
}

export function isAiError(err: unknown, code?: AiErrorCode): err is AiError {
  return err instanceof AiError && (code === undefined || err.aiCode === code);
}
