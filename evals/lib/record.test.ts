import type { AiCatalogue } from "../../supabase/functions/_shared/ai/catalogue.ts";
import type { AiContext } from "../../supabase/functions/_shared/ai/gateway.ts";
import { filePromptSource } from "../../supabase/functions/_shared/ai/prompts.ts";
import { Secret } from "../../supabase/functions/_shared/core/env.ts";
import { createLogger } from "../../supabase/functions/_shared/core/log.ts";
import {
  assertEquals,
  fakeFetch,
  fakeRpc,
  jsonResponse,
} from "../../supabase/functions/_shared/testing/mod.ts";
import { recordRefusal, recordSet } from "./record.ts";
import { toyRecordings } from "./selftest/make.ts";
import { loadSet } from "./sets.ts";

const ANSWERS = JSON.parse(
  await Deno.readTextFile(new URL("selftest/answers.json", import.meta.url)),
);

Deno.test("record refuses outside dev/local, off the free tier, in recorded mode and in PR CI", () => {
  const base = {
    plinthEnv: "dev" as const,
    mode: "live" as const,
    tier: "free" as const,
    geminiKey: null,
    hashSalt: null,
  };
  assertEquals(recordRefusal(base, {}), null);
  assertEquals(recordRefusal(base, { ci: "true", workflow: "nightly" }), null);
  assertEquals(typeof recordRefusal(base, { ci: "true", workflow: "ci-evals" }), "string");
  assertEquals(typeof recordRefusal({ ...base, tier: "paid" }, {}), "string");
  assertEquals(typeof recordRefusal({ ...base, mode: "recorded" }, {}), "string");
  assertEquals(typeof recordRefusal({ ...base, plinthEnv: "prod" }, {}), "string");
});

Deno.test("recordSet (fake Gemini, fake RPCs) writes the same files the self-test replays", async () => {
  const set = await loadSet(new URL("selftest/toy/", import.meta.url));
  // The fake model answers each reader's call with its toy answer, in order.
  const queue: Record<string, unknown[]> = {};
  for (const [id, byReader] of Object.entries(ANSWERS)) {
    if (typeof byReader === "string") continue;
    for (const [reader, attempts] of Object.entries(byReader as Record<string, unknown[]>)) {
      queue[`${id}/${reader}`] = attempts.map((a) => a);
    }
  }
  let current = "";
  const http = fakeFetch(() => {
    const a = queue[current]!.shift() as {
      output?: unknown;
      text?: string;
      tokens_in: number;
      tokens_out: number;
    };
    return jsonResponse({
      candidates: [{
        content: { parts: [{ text: a.text ?? JSON.stringify(a.output) }] },
        finishReason: "STOP",
      }],
      usageMetadata: { promptTokenCount: a.tokens_in, candidatesTokenCount: a.tokens_out },
    });
  });
  const rpc = fakeRpc({
    ai_budget_status: { data: { task: "t", calls_today: 0, cost_inr_today: 0 } },
    ai_generation_log: { data: "row" },
  });
  const ctx: AiContext = {
    env: {
      plinthEnv: "dev",
      mode: "live",
      tier: "free",
      geminiKey: new Secret("k-test"),
      hashSalt: new Secret("s-test"),
    },
    rpc,
    flags: { isOn: () => Promise.resolve(true) },
    log: createLogger({ fn: "record-test", sink: () => {} }),
    catalogue: set.catalogue as AiCatalogue,
    manifest: () => Promise.resolve(new Set(["1".repeat(64)])),
    prompts: filePromptSource(new URL("selftest/prompts/", import.meta.url)),
    fetch: (input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}"));
      const sys: string = body.systemInstruction?.parts?.[0]?.text ?? "";
      const doc: string = body.contents?.[0]?.parts?.[0]?.text ?? "";
      const id = doc.includes("Skyline") ? "flyer-1" : "flyer-2";
      current = `${id}/${sys.startsWith("Toy reader A") ? "a" : "b"}`;
      return http.fetch(input, init);
    },
  };

  const { files, failures } = await recordSet(set, ctx, new Date("2026-10-18T06:30:00Z"));
  assertEquals(failures, []);
  const want = await toyRecordings();
  assertEquals(files.map((f) => f.path).sort(), want.map((f) => f.path));
  for (const f of files) {
    const w = want.find((x) => x.path === f.path)!;
    assertEquals(f.file.input_sha256, w.file.input_sha256);
    assertEquals(f.file.attempts.length, w.file.attempts.length, f.path);
  }
  assertEquals(rpc.calls.filter((c) => c.fn === "ai_generation_log").length, 4);
  assertEquals(http.calls.length, 5); // flyer-1 reader a retried once
});

Deno.test("recordSet on the free tier refuses a golden outside the manifest", async () => {
  const set = await loadSet(new URL("selftest/toy/", import.meta.url));
  const http = fakeFetch(() => jsonResponse({}));
  const ctx: AiContext = {
    env: {
      plinthEnv: "dev",
      mode: "live",
      tier: "free",
      geminiKey: new Secret("k-test"),
      hashSalt: new Secret("s-test"),
    },
    rpc: fakeRpc({ ai_generation_log: { data: "row" } }),
    flags: { isOn: () => Promise.resolve(true) },
    log: createLogger({ fn: "record-test", sink: () => {} }),
    manifest: () => Promise.resolve(new Set<string>()),
    prompts: filePromptSource(new URL("selftest/prompts/", import.meta.url)),
    fetch: http.fetch,
  };
  const { files, failures } = await recordSet(set, ctx, new Date());
  assertEquals(files, []);
  assertEquals(failures.length, 4);
  assertEquals(failures.every((f) => f.includes("tier_refused")), true);
  assertEquals(http.calls.length, 0);
});
