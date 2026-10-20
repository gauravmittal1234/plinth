import { sha256Hex } from "../core/crypto.ts";
import { EnvError, Secret } from "../core/env.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
  assertThrows,
  testEnvSource,
} from "../testing/mod.ts";
import { readAiEnv } from "./config.ts";
import { AiError } from "./errors.ts";
import type { AiContext } from "./gateway.ts";
import { inputShaFor, runReaders, runTask } from "./gateway.ts";
import type { TaskInput } from "./input.ts";
import { canonicalJson } from "./input.ts";
import type { RecordedResponse } from "./recorded.ts";
import {
  bankTask,
  BUYER_SHA,
  catalogueOf,
  claimsTask,
  geminiAnswer,
  logCalls,
  SAMPLE_SHA,
  testCtx,
  VALID_OUTPUT,
} from "./testdata/helpers.ts";

const FLYER: TaskInput = {
  source_sha256: SAMPLE_SHA,
  lines: [
    { id: "L1", text: "Aurelia Heights Phase 2 · RERA GGM/2023/45" },
    { id: "L2", text: "From ₹2.74 Cr · call +91 98765 43210" },
  ],
};

/** The SHA runTask computes for an input and reader. */
const shaFor = (input: TaskInput, taskKey: string, prompt: string) =>
  inputShaFor(taskKey, input, {
    reader: prompt.split("@")[0],
    catalogue: catalogueOf(claimsTask()),
  });

Deno.test("input SHA = sha256 of [task@version, prompt version, the stripped input]", async () => {
  const sha = await shaFor(FLYER, "extract.marketing_claims@1", "a@1");
  const want = await sha256Hex(canonicalJson([
    "extract.marketing_claims@1",
    "a@1",
    {
      lines: [
        { id: "L1", text: "Aurelia Heights Phase 2 · RERA GGM/2023/45" },
        { id: "L2", text: "From ₹2.74 Cr · call [PHONE_1]" },
      ],
    },
  ]));
  assertEquals(sha, want);
});

function recording(sha: string, attempts: RecordedResponse["attempts"], prompt = "a@1") {
  return {
    [`packages/fixtures/recorded/ai/extract.marketing_claims/${sha}`]: {
      format: "plinth.ai_recorded/1" as const,
      task: "extract.marketing_claims@1",
      prompt_version: prompt,
      input_sha256: sha,
      source_sha256: SAMPLE_SHA,
      model: "gemini-test-flash",
      attempts,
    },
  };
}

const live = { plinthEnv: "dev" as const, mode: "live" as const, geminiKey: new Secret("k-test") };

Deno.test("recorded hit: replays the output for the input SHA, no network, one log row", async () => {
  const sha = await shaFor(FLYER, "extract.marketing_claims@1", "a@1");
  const { ctx, rpc, http } = testCtx({
    recorded: recording(sha, [{ output: VALID_OUTPUT, tokens_in: 100, tokens_out: 30 }]),
  });
  const r = await runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" });
  assertEquals(r.output, VALID_OUTPUT);
  assertEquals([r.mode, r.input_sha256, r.prompt_version, r.model_calls], [
    "recorded",
    sha,
    "a@1",
    0,
  ]);
  assertEquals(http.calls.length, 0);
  const rows = logCalls(rpc);
  assertEquals(rows.length, 1);
  assertEquals(
    [rows[0]!.p_status, rows[0]!.p_mode, rows[0]!.p_tier, rows[0]!.p_input_sha256],
    ["ok", "recorded", "free", sha],
  );
  assertEquals(rpc.calls.some((c) => c.fn === "ai_budget_status"), false);
});

Deno.test("recorded miss: recorded_miss, never a live fallback, still logged", async () => {
  const { ctx, rpc, http } = testCtx({ env: { geminiKey: new Secret("k-test") } });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(e.aiCode, "recorded_miss");
  assertEquals(http.calls.length, 0);
  assertEquals(logCalls(rpc).map((r) => [r.p_status, r.p_error_code]), [[
    "error",
    "recorded_miss",
  ]]);
});

Deno.test("live is refused under PLINTH_ENV=test, by the env reader and by the gateway", async () => {
  assertThrows(() => readAiEnv(testEnvSource({ AI_MODE: "live" })), EnvError);
  assertEquals(readAiEnv(testEnvSource()).tier, "free");
  assertEquals(readAiEnv(testEnvSource()).mode, "recorded");
  const { ctx, http, rpc } = testCtx({ env: { mode: "live", geminiKey: new Secret("k-test") } });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(e.aiCode, "live_refused");
  assertEquals(http.calls.length, 0);
  assertEquals(logCalls(rpc)[0]!.p_status, "refused");
});

Deno.test("free tier refuses a document outside the manifest; paid lifts it", async () => {
  const buyer = { ...FLYER, source_sha256: BUYER_SHA };
  const free = testCtx({ env: live, route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)) });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", buyer, free.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals([e.aiCode, e.code], ["tier_refused", "flag_off"]);
  assertEquals(free.http.calls.length, 0);
  assertEquals(free.rpc.calls.some((c) => c.fn === "ai_budget_status"), false);
  assertEquals(logCalls(free.rpc)[0]!.p_error_code, "tier_refused");

  const media: TaskInput = {
    source_sha256: SAMPLE_SHA,
    media: { mime_type: "image/png", data: new TextEncoder().encode("not the sample page") },
  };
  const ocr = await assertRejects(
    () => runTask("extract.marketing_claims@1", media, free.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(ocr.aiCode, "tier_refused");

  const paid = testCtx({
    env: { ...live, tier: "paid" },
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
  });
  const r = await runTask("extract.marketing_claims@1", buyer, paid.ctx, { reader: "a" });
  assertEquals([r.tier, r.model_calls, r.output], ["paid", 1, VALID_OUTPUT]);
});

Deno.test("a null model_id refuses a live call (reader B of another class too)", async () => {
  const cat = catalogueOf(claimsTask({ model_id: null }));
  const { ctx, http } = testCtx({ env: live, catalogue: cat });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(e.aiCode, "model_unpinned");
  const noB = catalogueOf(claimsTask({
    readers: [
      { id: "a", model_class: "flash", prompt: "a@1" },
      { id: "b", model_class: "flash_lite", prompt: "b@1" },
    ],
  }));
  const b = testCtx({ env: live, catalogue: noB });
  const eb = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, b.ctx, { reader: "b" }),
    AiError,
  );
  assertEquals(eb.aiCode, "model_unpinned");
  assertEquals(http.calls.length + b.http.calls.length, 0);
});

Deno.test("live request: key in a header, prompt as system, fenced PII-free data, no tools", async () => {
  const { ctx, http, rpc } = testCtx({
    env: live,
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
  });
  const r = await runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" });
  assertEquals(r.model, "gemini-test-flash");
  const call = http.calls[0]!;
  assertEquals(
    call.url.href,
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-test-flash:generateContent",
  );
  assertEquals(call.headers.get("x-goog-api-key"), "k-test");
  const body = JSON.parse(call.body!);
  assertEquals(Object.keys(body).sort(), ["contents", "generationConfig", "systemInstruction"]);
  assertEquals(body.systemInstruction.parts[0].text, "Reader A. List the marketing claims.");
  const userText: string = body.contents[0].parts[0].text;
  assert(userText.startsWith("```document\nL1\t"), userText);
  assertStringIncludes(userText, "[PHONE_1]");
  assertFalse(userText.includes("98765"), "the phone reached the model");
  assertFalse(userText.includes("Reader A"), "instructions in the user turn");
  assertEquals(body.generationConfig.responseMimeType, "application/json");
  assertEquals(body.generationConfig.responseSchema.type, "OBJECT");
  assertEquals(body.generationConfig.temperature, 0);
  // budget read before the call, one log row after it
  assertEquals(rpc.calls.map((c) => c.fn), ["ai_budget_status", "ai_generation_log"]);
  assertEquals(logCalls(rpc)[0]!.p_model_calls, 1);
  assertEquals(logCalls(rpc)[0]!.p_tokens_in, 120);
});

Deno.test("schema mismatch: one retry, then schema_mismatch (live and recorded)", async () => {
  let n = 0;
  const retry = testCtx({
    env: live,
    route: () =>
      geminiAnswer(n++ === 0 ? '{"claims": "not a list"}' : JSON.stringify(VALID_OUTPUT)),
  });
  const ok = await runTask("extract.marketing_claims@1", FLYER, retry.ctx, { reader: "a" });
  assertEquals([ok.model_calls, ok.output], [2, VALID_OUTPUT]);
  assertEquals(retry.rpc.calls.filter((c) => c.fn === "ai_budget_status").length, 2);
  assert(retry.logs.find("ai output failed the schema"));

  const bad = testCtx({ env: live, route: () => geminiAnswer("not json") });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, bad.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(e.aiCode, "schema_mismatch");
  assertEquals(bad.http.calls.length, 2);
  const row = logCalls(bad.rpc);
  assertEquals(row.length, 1);
  assertEquals([row[0]!.p_status, row[0]!.p_error_code, row[0]!.p_model_calls], [
    "error",
    "schema_mismatch",
    2,
  ]);

  const sha = await shaFor(FLYER, "extract.marketing_claims@1", "a@1");
  const rec = testCtx({ recorded: recording(sha, [{ text: "{}" }, { output: VALID_OUTPUT }]) });
  const replay = await runTask("extract.marketing_claims@1", FLYER, rec.ctx, { reader: "a" });
  assertEquals(replay.attempts.length, 2);
  const once = testCtx({ recorded: recording(sha, [{ text: "{}" }]) });
  const e2 = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, once.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(e2.aiCode, "schema_mismatch");
});

Deno.test("budget: refused at 100% of the call cap, warned at 80%, refused when unset", async () => {
  const full = testCtx({
    env: live,
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
    rpc: { ai_budget_status: { data: { task: "t", calls_today: 10, cost_inr_today: 0 } } },
  });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, full.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals([e.aiCode, e.code], ["budget_exhausted", "flag_off"]);
  assertEquals(full.http.calls.length, 0);
  assertEquals(
    [logCalls(full.rpc)[0]!.p_status, logCalls(full.rpc)[0]!.p_error_code],
    ["refused", "budget_exhausted"],
  );
  assert(full.logs.find("ai budget exhausted; kill switch"));

  const inr = testCtx({
    env: live,
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
    rpc: {
      ai_budget_status: {
        data: { task: "t", calls_today: 1, cost_inr_today: 50, budget_inr_per_day: 50 },
      },
    },
  });
  const ei = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, inr.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(ei.aiCode, "budget_exhausted");

  const warm = testCtx({
    env: live,
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
    rpc: { ai_budget_status: { data: { task: "t", calls_today: 8, cost_inr_today: 0 } } },
  });
  await runTask("extract.marketing_claims@1", FLYER, warm.ctx, { reader: "a" });
  const line = warm.logs.find("ai budget at 80%")!;
  assertEquals([line.level, line.used_pct, line.daily_call_cap], ["warn", 80, 10]);

  const unset = testCtx({
    env: live,
    catalogue: catalogueOf(claimsTask({ daily_call_cap: null })),
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
  });
  const eu = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, unset.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(eu.aiCode, "budget_unset");

  const down = testCtx({
    env: live,
    route: () => geminiAnswer(JSON.stringify(VALID_OUTPUT)),
    rpc: { ai_budget_status: { error: { code: "PGRST202", message: "missing" } } },
  });
  const ed = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, down.ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(ed.aiCode, "budget_unavailable");
  assertEquals(down.http.calls.length, 0);
});

Deno.test("the retry checks the budget again, counting the first attempt", async () => {
  let n = 0;
  const { ctx, http } = testCtx({
    env: live,
    route: () => geminiAnswer(n++ === 0 ? "nope" : JSON.stringify(VALID_OUTPUT)),
    rpc: { ai_budget_status: { data: { task: "t", calls_today: 9, cost_inr_today: 0 } } },
  });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" }),
    AiError,
  );
  assertEquals(e.aiCode, "budget_exhausted");
  assertEquals(http.calls.length, 1);
});

Deno.test("kill switch off: flag_off before anything else, logged as refused", async () => {
  const { ctx, rpc, http } = testCtx({ flagsOn: false, env: live });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" }),
    AiError,
  );
  assertEquals([e.aiCode, e.code, e.status], ["flag_off", "flag_off", 503]);
  assertEquals(http.calls.length, 0);
  assertEquals(logCalls(rpc).map((r) => [r.p_status, r.p_error_code]), [["refused", "flag_off"]]);
});

Deno.test("every call logs: unknown task, missing reader, bad input, provider error", async () => {
  const cases: [string, TaskInput, { reader?: string }, string, Partial<AiContext>?][] = [
    ["nope.task@1", FLYER, {}, "unknown_task"],
    ["extract.marketing_claims@1", FLYER, {}, "reader_required"],
    [
      "extract.marketing_claims@1",
      { source_sha256: "x" } as TaskInput,
      { reader: "a" },
      "bad_input",
    ],
  ];
  for (const [key, input, opts, code] of cases) {
    const { ctx, rpc } = testCtx();
    const e = await assertRejects(() => runTask(key, input, ctx, opts), AiError);
    assertEquals(e.aiCode, code);
    assertEquals(logCalls(rpc).length, 1, code);
    assertEquals(logCalls(rpc)[0]!.p_task, key);
  }
  const { ctx, rpc } = testCtx({ env: live, route: () => new Response("busy", { status: 503 }) });
  const e = await assertRejects(
    () => runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" }),
    AiError,
  );
  assertEquals([e.aiCode, e.detail], ["provider_error", "the model answered HTTP 503"]);
  assertEquals(logCalls(rpc).map((r) => [r.p_status, r.p_model_calls]), [["error", 1]]);
});

Deno.test("a failed log write keeps the answer and reports on the JSON log", async () => {
  const sha = await shaFor(FLYER, "extract.marketing_claims@1", "a@1");
  const { ctx, logs } = testCtx({
    recorded: recording(sha, [{ output: VALID_OUTPUT }]),
    rpc: { ai_generation_log: { error: { code: "42501", message: "permission denied" } } },
  });
  const r = await runTask("extract.marketing_claims@1", FLYER, ctx, { reader: "a" });
  assertEquals([r.logged, r.output], [false, VALID_OUTPUT]);
  assert(logs.find("ai_generation_log failed"));
});

Deno.test("bank policy: the account becomes a token with last 4, and logs stay redacted", async () => {
  const input: TaskInput = {
    source_sha256: SAMPLE_SHA,
    lines: [
      { id: "L1", text: "Pay the booking amount to A/c 50200071824417, IFSC HDFC0001234" },
      { id: "L2", text: "Questions: accounts@example.test or 098765 43210" },
    ],
  };
  const echo = {
    account: "50200071824417",
    contact: "+91 98765 43210",
    note: "Pay to [ACCOUNT_1]",
  };
  const { ctx, http, rpc, logs } = testCtx({
    env: live,
    catalogue: catalogueOf(bankTask()),
    route: () => geminiAnswer(JSON.stringify(echo)),
  });
  const r = await runTask("extract.payment_request@1", input, ctx);
  const sent = JSON.parse(http.calls[0]!.body!).contents[0].parts[0].text as string;
  assertFalse(sent.includes("50200071824417"));
  assertStringIncludes(sent, "A/c [ACCOUNT_1]");
  assertStringIncludes(sent, "[EMAIL_1]");
  assertStringIncludes(sent, "[PHONE_1]");
  const account = r.vault.ofKind("ACCOUNT")[0]!;
  assertEquals([account.token, account.last4, account.sha256.length], ["[ACCOUNT_1]", "4417", 64]);
  assertEquals(JSON.stringify({ v: r.vault }), '{"v":"[pii vault]"}');
  const stored = JSON.stringify(logCalls(rpc)[0]!.p_output);
  assertFalse(stored.includes("50200071824417"), stored);
  assertFalse(stored.includes("98765"), stored);
  assertFalse(logs.text().includes("50200071824417"));
  assertFalse(logs.text().includes("Pay the booking amount"));
});

Deno.test("runReaders: both readers, different prompts and SHAs, two log rows", async () => {
  const shaA = await shaFor(FLYER, "extract.marketing_claims@1", "a@1");
  const shaB = await shaFor(FLYER, "extract.marketing_claims@1", "b@1");
  const { ctx, rpc } = testCtx({
    recorded: {
      ...recording(shaA, [{ output: VALID_OUTPUT }], "a@1"),
      ...recording(shaB, [{ output: VALID_OUTPUT }], "b@1"),
    },
  });
  const both = await runReaders("extract.marketing_claims@1", FLYER, ctx);
  assertEquals(Object.keys(both), ["a", "b"]);
  assertEquals([both.a!.prompt_version, both.b!.prompt_version], ["a@1", "b@1"]);
  assert(both.a!.input_sha256 !== both.b!.input_sha256);
  assertEquals(logCalls(rpc).length, 2);
});

Deno.test("tool-using tasks are not run by this gateway (extractors get no tools)", async () => {
  const { ctx } = testCtx();
  const e = await assertRejects(
    () =>
      runTask("answer.ask@1", { source_sha256: SAMPLE_SHA, text: "hi" }, {
        ...ctx,
        catalogue: undefined,
      }),
    AiError,
  );
  assertEquals(e.aiCode, "config");
});
