import { FROZEN_AT } from "../core/clock.ts";
import {
  assertEquals,
  assertRejects,
  captureLogs,
  fakeFetch,
  fakeRequest,
  frozenClock,
  noNetwork,
  testEnv,
} from "./mod.ts";

const FUNCTIONS_DIR = new URL("../../", import.meta.url);

/** Every .ts file under supabase/functions, as paths relative to it. */
async function sourceFiles(dir = FUNCTIONS_DIR, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory) {
      out.push(...await sourceFiles(new URL(`${entry.name}/`, dir), `${rel}/`));
    } else if (entry.name.endsWith(".ts")) out.push(rel);
  }
  return out;
}

Deno.test("production code never imports _shared/testing", async () => {
  const offenders: string[] = [];
  for (const rel of await sourceFiles()) {
    if (rel.startsWith("_shared/testing/") || rel.endsWith(".test.ts")) continue;
    const text = await Deno.readTextFile(new URL(rel, FUNCTIONS_DIR));
    if (
      /from\s+["'][^"']*_shared\/testing\//.test(text) || /from\s+["']\.\.?\/testing\//.test(text)
    ) {
      offenders.push(rel);
    }
  }
  assertEquals(offenders, []);
});

Deno.test("tests run without network permission", async () => {
  const status = await Deno.permissions.query({ name: "net" });
  assertEquals(status.state === "granted", false);
  await assertRejects(() => fetch("https://example.com/"));
});

Deno.test("the frozen clock starts at the design today", () => {
  assertEquals(frozenClock().now().getTime(), new Date(FROZEN_AT).getTime());
});

Deno.test("fakeRequest builds what the gateway passes on", async () => {
  const req = fakeRequest("ask", {
    json: { q: 1 },
    bearer: "t",
    ip: "203.0.113.1",
    query: { a: "b" },
  });
  assertEquals(req.method, "POST");
  assertEquals(req.url, "http://localhost:54321/functions/v1/ask?a=b");
  assertEquals(req.headers.get("content-type"), "application/json");
  assertEquals(req.headers.get("authorization"), "Bearer t");
  assertEquals(await req.json(), { q: 1 });
  assertEquals(fakeRequest("/health").method, "GET");
});

Deno.test("fakeFetch records calls; noNetwork refuses them", async () => {
  const net = fakeFetch(() => new Response("hi"));
  assertEquals(
    await (await net.fetch("http://x.test/a", { method: "PUT", body: "b" })).text(),
    "hi",
  );
  assertEquals([net.calls[0]!.method, net.calls[0]!.body], ["PUT", "b"]);
  await assertRejects(
    () => fakeFetch(noNetwork).fetch("http://x.test/"),
    Error,
    "unexpected fetch",
  );
});

Deno.test("testEnv is the test world: recorded AI, mock Meta, placeholder keys", () => {
  const env = testEnv();
  assertEquals([env.plinthEnv, env.aiMode, env.metaMode], ["test", "recorded", "mock"]);
  assertEquals(testEnv({ SUPABASE_URL: undefined }).supabase.url, null);
  const logs = captureLogs();
  logs.sink("info", JSON.stringify({ msg: "m" }));
  assertEquals(logs.find("m")?.msg, "m");
});
