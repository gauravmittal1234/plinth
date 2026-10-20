// The AI task catalogue at the edge (T63; packages/contracts/catalogues/ai_tasks.json, owner T61).
//
// Code asks for a task, never a model (BUILD_PLAN §14). This module reads the catalogue, finds a
// task by key ("extract.marketing_claims@1") or id, and answers the per-call questions the
// gateway needs: which prompt version, which model, which kill switch, which budget.
// The catalogue is bundled as a JSON module, so a deployed function carries it.

import catalogueJson from "../../../../packages/contracts/catalogues/ai_tasks.json" with {
  type: "json",
};
import type { FlagKey } from "../core/flags.ts";
import { AiError } from "./errors.ts";

export type PiiPolicy = "strip" | "strip_and_redact_bank" | "public_record";

export interface AiReader {
  id: string;
  model_class: string;
  /** The prompt version, e.g. "a@1": prompts/<task id>/a@1.md. */
  prompt: string;
  /** Pinned after the bake-off (M3-2). Null: a live call refuses. */
  model_id?: string | null;
}

export interface AiTask {
  id: string;
  version: number;
  key: string;
  used_by?: readonly string[];
  model_class: string;
  model_id: string | null;
  fallback_class?: string | null;
  fallback_model_id?: string | null;
  temperature: number | null;
  max_output_tokens: number | null;
  budget_inr_per_day: number | null;
  /** Free-tier calls per day (T61 adds it; FOUNDER_QUESTIONS M3-13). */
  daily_call_cap?: number | null;
  /**
   * The response schema: a reference into packages/contracts/schemas ("x.schema.json",
   * "x.schema.json#/$defs/Y", "ai/x.schema.json"), or an inline JSON Schema (test catalogues).
   */
  response_schema: string | Record<string, unknown> | null;
  /** The prompt version for a task without readers (default "v<version>"). */
  prompt?: string;
  readers?: readonly AiReader[];
  /** Ask's api tools (M5). Extractors never get tools. */
  tools?: readonly string[];
  /** The flag that switches this task off (default from KILL_SWITCHES). */
  kill_switch?: FlagKey | null;
  pii_policy: PiiPolicy;
  eval_set?: string | null;
  recorded_dir?: string | null;
  milestone?: string;
  labels?: readonly string[];
  note?: string | null;
}

export interface AiCatalogue {
  catalogue: "ai_tasks";
  version: number;
  tasks: readonly AiTask[];
}

/** The catalogue in packages/contracts (bundled). */
export const DEFAULT_CATALOGUE = catalogueJson as unknown as AiCatalogue;

/**
 * Kill switches by task id (catalogues/flags.json). doc-check's tasks stop with ai_doc_check,
 * Ask's with ai_ask, staging with ai_staging. extract.harera_order runs in the Python pipelines
 * and has no edge switch, so the edge gateway refuses it.
 */
export const KILL_SWITCHES: Readonly<Record<string, FlagKey>> = {
  "ocr.document": "ai_doc_check",
  "classify.document": "ai_doc_check",
  "extract.marketing_claims": "ai_doc_check",
  "extract.cost_sheet": "ai_doc_check",
  "extract.demand_letter": "ai_doc_check",
  "extract.payment_request": "ai_doc_check",
  "transcribe.voice": "ai_ask",
  "parse.search_query": "ai_ask",
  "answer.ask": "ai_ask",
  "stage.room": "ai_staging",
};

/** Finds a task by key ("id@version") or by id (the catalogue's current version). */
export function findTask(catalogue: AiCatalogue, keyOrId: string): AiTask {
  const hit = catalogue.tasks.find((t) => t.key === keyOrId) ??
    (keyOrId.includes("@") ? undefined : catalogue.tasks.find((t) => t.id === keyOrId));
  if (!hit) throw new AiError("unknown_task", `no AI task ${keyOrId} in the catalogue`);
  if (hit.key !== `${hit.id}@${hit.version}`) {
    throw new AiError("config", `catalogue key ${hit.key} does not match ${hit.id}@${hit.version}`);
  }
  return hit;
}

export function killSwitchFor(task: AiTask): FlagKey {
  const flag = task.kill_switch ?? KILL_SWITCHES[task.id];
  if (!flag) throw new AiError("config", `AI task ${task.key} has no edge kill switch`);
  return flag;
}

/** True for the document readers (OCR, classify, extract): data in, schema out, no tools. */
export function isExtractor(task: AiTask): boolean {
  return /^(ocr|classify|extract|transcribe|parse)\./.test(task.id);
}

/** The reader a call uses: required when the task lists readers, refused otherwise. */
export function readerFor(task: AiTask, readerId: string | undefined): AiReader | null {
  const readers = task.readers ?? [];
  if (readers.length === 0) {
    if (readerId !== undefined) {
      throw new AiError("reader_required", `AI task ${task.key} has no reader ${readerId}`);
    }
    return null;
  }
  const reader = readers.find((r) => r.id === readerId);
  if (!reader) {
    const ids = readers.map((r) => r.id).join(", ");
    throw new AiError("reader_required", `AI task ${task.key} needs a reader (${ids})`);
  }
  return reader;
}

/** The prompt version: the reader's ("a@1"), the task's `prompt`, or "v<version>". */
export function promptVersionFor(task: AiTask, reader: AiReader | null): string {
  const v = reader?.prompt ?? task.prompt ?? `v${task.version}`;
  if (!/^[a-z0-9_-]+(@\d+)?$/i.test(v)) {
    throw new AiError("config", `AI task ${task.key} has an unusable prompt version`);
  }
  return v;
}

/**
 * The pinned model for a call, or null. A reader uses its own model_id; a reader without one
 * inherits the task's only when it is the same model class (reader B is a different class).
 */
export function modelFor(task: AiTask, reader: AiReader | null): string | null {
  if (reader) {
    if (reader.model_id) return reader.model_id;
    return reader.model_class === task.model_class ? task.model_id : null;
  }
  return task.model_id;
}

/** The task's recorded-response folder, relative to the repo root. */
export function recordedDirFor(task: AiTask): string {
  return task.recorded_dir ?? `packages/fixtures/recorded/ai/${task.id}`;
}
