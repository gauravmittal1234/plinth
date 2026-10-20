// Test-only helpers for _shared/ai (T63). Production code never imports this folder.
// Values are placeholders: no real key, phone or document (AGENTS.md §6).

import { Secret } from "../../core/env.ts";
import { createLogger } from "../../core/log.ts";
import type { CapturedLogs, FakeFetch, FakeRpc, RpcAnswer } from "../../testing/mod.ts";
import {
  captureLogs,
  fakeFetch,
  fakeRpc,
  frozenClock,
  jsonResponse,
  noNetwork,
} from "../../testing/mod.ts";
import type { AiCatalogue, AiTask } from "../catalogue.ts";
import { DEFAULT_CATALOGUE } from "../catalogue.ts";
import type { AiEnv } from "../config.ts";
import type { AiContext } from "../gateway.ts";
import { memoryPromptSource } from "../prompts.ts";
import type { RecordedResponse } from "../recorded.ts";
import { memoryRecordedStore } from "../recorded.ts";
import { schemaSource } from "../schema.ts";

/** A fictional sample document's SHA (in the test manifest). */
export const SAMPLE_SHA = "1".repeat(64);
/** A document that is not a fictional sample (a buyer's own upload). */
export const BUYER_SHA = "2".repeat(64);

export const CLAIMS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["claims"],
  properties: {
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "raw_text", "value", "confidence"],
        properties: {
          type: { type: "string", enum: ["rera_number", "price", "possession", "area", "other"] },
          raw_text: { type: "string" },
          value: { type: ["string", "null"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          line_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export const VALID_OUTPUT = {
  claims: [
    {
      type: "price",
      raw_text: "From ₹2.74 Cr",
      value: "₹2.74 Cr",
      confidence: 0.92,
      line_ids: ["L2"],
    },
  ],
};

/** The catalogue's marketing-claims task with pinned test models, a schema and a call cap. */
export function claimsTask(overrides: Partial<AiTask> = {}): AiTask {
  const real = DEFAULT_CATALOGUE.tasks.find((t) => t.id === "extract.marketing_claims")!;
  return {
    ...real,
    model_id: "gemini-test-flash",
    readers: [
      { id: "a", model_class: "flash", prompt: "a@1" },
      { id: "b", model_class: "flash_lite", prompt: "b@1", model_id: "gemini-test-lite" },
    ],
    response_schema: CLAIMS_SCHEMA as unknown as Record<string, unknown>,
    daily_call_cap: 10,
    budget_inr_per_day: null,
    ...overrides,
  };
}

/** A cost-sheet-like task (bank policy, one prompt) for PII tests. */
export function bankTask(overrides: Partial<AiTask> = {}): AiTask {
  // A single-reader stand-in: the bank-policy tests are about redaction, not readers, so they
  // must not depend on whether the catalogue lists readers a and b for this task (T61 does).
  const { readers: _readers, ...real } = DEFAULT_CATALOGUE.tasks.find((t) =>
    t.id === "extract.payment_request"
  )!;
  return {
    ...real,
    model_id: "gemini-test-flash",
    response_schema: { type: "object" },
    daily_call_cap: 10,
    ...overrides,
  };
}

export function catalogueOf(...tasks: AiTask[]): AiCatalogue {
  return { catalogue: "ai_tasks", version: 1, tasks };
}

export function aiEnv(overrides: Partial<AiEnv> = {}): AiEnv {
  return {
    plinthEnv: "test",
    mode: "recorded",
    tier: "free",
    geminiKey: null,
    hashSalt: new Secret("test-hash-salt"),
    ...overrides,
  };
}

export const PROMPTS = memoryPromptSource({
  "extract.marketing_claims/a@1": "Reader A. List the marketing claims.",
  "extract.marketing_claims/b@1": "Reader B. List each claim on the page.",
  "extract.payment_request/v1": "List the payment request fields.",
  "classify.document/v1": "Label the document.",
});

export interface TestCtx {
  ctx: AiContext;
  rpc: FakeRpc;
  http: FakeFetch;
  logs: CapturedLogs;
}

export interface TestCtxOptions {
  env?: Partial<AiEnv>;
  catalogue?: AiCatalogue;
  flagsOn?: boolean;
  recorded?: Record<string, RecordedResponse>;
  manifest?: readonly string[];
  rpc?: Record<string, RpcAnswer>;
  route?: Parameters<typeof fakeFetch>[0];
}

/** An AiContext over fakes: flags, RPCs (budget and log), fetch, prompts, recorded store. */
export function testCtx(o: TestCtxOptions = {}): TestCtx {
  const logs = captureLogs();
  const rpc = fakeRpc({
    ai_generation_log: { data: "00000000-0000-4000-8000-000000000001" },
    ai_budget_status: { data: { task: "x", calls_today: 0, cost_inr_today: 0 } },
    ...o.rpc,
  });
  const http = fakeFetch(o.route ?? noNetwork);
  const ctx: AiContext = {
    env: aiEnv(o.env),
    rpc,
    flags: { isOn: () => Promise.resolve(o.flagsOn ?? true) },
    log: createLogger({ fn: "ai-test", sink: logs.sink, minLevel: "debug", clock: frozenClock() }),
    catalogue: o.catalogue ?? catalogueOf(claimsTask(), bankTask()),
    prompts: PROMPTS,
    schemas: schemaSource(),
    recorded: memoryRecordedStore(o.recorded ?? {}),
    manifest: () => Promise.resolve(new Set(o.manifest ?? [SAMPLE_SHA])),
    fetch: http.fetch,
    clock: frozenClock(),
    requestId: "req-ai-test",
  };
  return { ctx, rpc, http, logs };
}

/** A Gemini generateContent answer carrying `text`. */
export function geminiAnswer(text: string, tokens = { in: 120, out: 40 }): Response {
  return jsonResponse({
    candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }],
    usageMetadata: { promptTokenCount: tokens.in, candidatesTokenCount: tokens.out },
    modelVersion: "gemini-test-flash",
  });
}

/** The ai_generation_log calls a fake RPC client received. */
export function logCalls(rpc: FakeRpc) {
  return rpc.calls.filter((c) => c.fn === "ai_generation_log").map((c) => c.args);
}
