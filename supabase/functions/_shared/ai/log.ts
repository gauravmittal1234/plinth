// Every AI call writes ops.ai_generations (T63; BUILD_PLAN §11, DATA_MODEL §10).
//
// logGeneration() calls api.ai_generation_log (T60; service role only) once per runTask, whether
// it answered, refused or failed. The output is redacted first: every string is passed through
// the PII stripper with bank redaction and long-number masking (an OCR answer can hold a phone or
// an account number the model read off the page), then through the logger's field-name redaction.
// The input is never logged, only its SHA. A failed log write is reported on the JSON log and
// does not discard a model answer that has already been paid for.

import type { Secret } from "../core/env.ts";
import type { Logger } from "../core/log.ts";
import { errorFields, isSensitiveKey, scrub } from "../core/log.ts";
import type { RpcClient } from "../core/supabase.ts";
import { callRpc } from "../core/supabase.ts";
import type { AiTier } from "./config.ts";
import type { AiErrorCode } from "./errors.ts";
import { PiiStripper } from "./pii.ts";

export type GenerationStatus = "ok" | "refused" | "error";

/** One ops.ai_generations row, as api.ai_generation_log takes it (named p_ arguments). */
export interface GenerationRecord {
  task: string;
  prompt_version: string | null;
  model: string | null;
  mode: "live" | "recorded";
  tier: AiTier;
  status: GenerationStatus;
  error_code: AiErrorCode | null;
  input_sha256: string | null;
  source_sha256: string | null;
  /** Redacted before it is sent (redactOutput). */
  output: unknown;
  tokens_in: number;
  tokens_out: number;
  cost_inr: number;
  latency_ms: number;
  /** Model calls made: 0 (refused before a call, or recorded), 1, or 2 (one retry). */
  model_calls: number;
  request_id: string | null;
}

/**
 * A copy of a model output that is safe to keep for 12 months (BUILD_PLAN §13): PII and long
 * numbers become tokens, credentials are scrubbed, sensitive field names are redacted. Unlike
 * the JSON logger it keeps long strings whole (an OCR page is the record).
 */
export function redactOutput(output: unknown, salt: Secret | string): unknown {
  const stripper = new PiiStripper("strip_and_redact_bank", salt, { aggressive: true });
  const walk = (v: unknown, depth: number): unknown => {
    if (typeof v === "string") return scrub(stripper.strip(v));
    if (v === null || typeof v !== "object") return v;
    if (depth > 16) return "[deep]";
    if (Array.isArray(v)) return v.map((x) => walk(x, depth + 1));
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, isSensitiveKey(k) ? "[redacted]" : walk(x, depth + 1)]),
    );
  };
  return walk(output, 0);
}

/** The api.ai_generation_log arguments for a record. */
export function logArgs(r: GenerationRecord): Record<string, unknown> {
  return {
    p_task: r.task,
    p_prompt_version: r.prompt_version,
    p_model: r.model,
    p_mode: r.mode,
    p_tier: r.tier,
    p_status: r.status,
    p_error_code: r.error_code,
    p_input_sha256: r.input_sha256,
    p_source_sha256: r.source_sha256,
    p_output: r.output ?? null,
    p_tokens_in: r.tokens_in,
    p_tokens_out: r.tokens_out,
    p_cost_inr: r.cost_inr,
    p_latency_ms: r.latency_ms,
    p_model_calls: r.model_calls,
    p_request_id: r.request_id,
  };
}

/** Writes the row and one JSON log line (no output, no input). Never throws. */
export async function logGeneration(
  rpc: RpcClient,
  record: GenerationRecord,
  log: Logger,
): Promise<boolean> {
  const line = {
    task: record.task,
    prompt_version: record.prompt_version,
    model: record.model,
    mode: record.mode,
    tier: record.tier,
    status: record.status,
    error_code: record.error_code,
    input_sha256: record.input_sha256,
    tokens_in: record.tokens_in,
    tokens_out: record.tokens_out,
    cost_inr: record.cost_inr,
    latency_ms: record.latency_ms,
    model_calls: record.model_calls,
  };
  if (record.status === "ok") log.info("ai call", line);
  else log.warn("ai call not answered", line);
  try {
    await callRpc(rpc, "ai_generation_log", logArgs(record));
    return true;
  } catch (err) {
    log.error("ai_generation_log failed", { task: record.task, ...errorFields(err) });
    return false;
  }
}
