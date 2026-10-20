// health: liveness + DB ping. Run: npx --yes deno@2 task test (in supabase/functions).
import { checkContract } from "../_shared/core/validate.ts";
import {
  assertApiError,
  assertEquals,
  assertExists,
  assertMatch,
  assertStringIncludes,
  captureLogs,
  fakeFetch,
  fakeRequest,
  jsonResponse,
  readBody,
  TEST_PUBLISHABLE_KEY,
  TEST_SUPABASE_URL,
  testEnv,
} from "../_shared/testing/mod.ts";
import { assertFlagsEnvelope, makeHealth, pingApiFlags } from "./logic.ts";

// The fixture world's anon flags, as api.flags() returns them on the seeded database (T03).
const FIXTURE_FLAGS = JSON.parse(
  await Deno.readTextFile(
    new URL("../../../packages/fixtures/expected/flags/anon.json", import.meta.url),
  ),
);

const healthy = () => Promise.resolve();

Deno.test("GET answers { ok: true } (the contract's Ok) with a request id and no caching", async () => {
  const health = makeHealth({ pingDb: healthy, env: testEnv(), sink: captureLogs().sink });
  const res = await health(fakeRequest("health"));
  assertEquals(res.status, 200);
  const body = await readBody(res);
  assertEquals(body, { ok: true });
  checkContract("Ok", body);
  assertEquals(res.headers.get("cache-control"), "no-store");
  assertMatch(res.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/);
  assertMatch(res.headers.get("x-plinth-db-ms") ?? "", /^\d+$/);
});

Deno.test("the caller's x-request-id comes back and is on every log line", async () => {
  const logs = captureLogs();
  const health = makeHealth({ pingDb: healthy, env: testEnv(), sink: logs.sink });
  const res = await health(fakeRequest("health", { requestId: "uptime-check-0001" }));
  await res.body?.cancel();
  assertEquals(res.headers.get("x-request-id"), "uptime-check-0001");
  const line = logs.find("request");
  assertExists(line);
  assertEquals(line.fn, "health");
  assertEquals(line.request_id, "uptime-check-0001");
  assertEquals(line.status, 200);
  assertEquals(typeof line.latency_ms, "number");
});

Deno.test("the access log never carries the query string", async () => {
  const logs = captureLogs();
  const health = makeHealth({ pingDb: healthy, env: testEnv(), sink: logs.sink });
  await (await health(fakeRequest("health", { query: { token: "abc123secretvalue" } }))).body
    ?.cancel();
  assertEquals(logs.find("request")?.path, "/functions/v1/health");
  assertEquals(logs.text().includes("abc123secretvalue"), false);
});

Deno.test("other methods are not_found with Allow: GET", async () => {
  const health = makeHealth({ pingDb: healthy, env: testEnv(), sink: captureLogs().sink });
  const res = await health(fakeRequest("health", { json: { ping: true } }));
  assertEquals(res.headers.get("allow"), "GET");
  await assertApiError(res, "not_found");
});

Deno.test("a failing database is internal (500) and the cause stays in the log", async () => {
  const logs = captureLogs();
  const health = makeHealth({
    pingDb: () => Promise.reject(new Error("connection refused to 10.0.0.5")),
    env: testEnv(),
    sink: logs.sink,
  });
  const res = await health(fakeRequest("health"));
  const message = await assertApiError(res, "internal");
  assertEquals(message, "The database did not answer.");
  assertStringIncludes(logs.text(), "connection refused");
  assertEquals(logs.find("request")?.level, "error");
});

Deno.test("a database that hangs fails after the timeout", async () => {
  let aborted = false;
  const health = makeHealth({
    pingDb: (signal) =>
      new Promise<void>((_, reject) => {
        signal.addEventListener("abort", () => {
          aborted = true;
          reject(new Error("aborted"));
        });
      }),
    timeoutMs: 20,
    env: testEnv(),
    sink: captureLogs().sink,
  });
  await assertApiError(await health(fakeRequest("health")), "internal");
  assertEquals(aborted, true);
});

Deno.test("the real ping calls api.flags as anon through PostgREST, with the request id", async () => {
  const net = fakeFetch(() => jsonResponse(FIXTURE_FLAGS));
  const health = makeHealth({
    pingDb: pingApiFlags(net.fetch),
    env: testEnv(),
    sink: captureLogs().sink,
  });
  const res = await health(fakeRequest("health", { requestId: "uptime-check-0002" }));
  assertEquals(await readBody(res), { ok: true });

  assertEquals(net.calls.length, 1);
  const call = net.calls[0]!;
  assertEquals(`${call.url.origin}${call.url.pathname}`, `${TEST_SUPABASE_URL}/rest/v1/rpc/flags`);
  assertEquals(call.headers.get("apikey"), TEST_PUBLISHABLE_KEY);
  assertEquals(call.headers.get("authorization"), `Bearer ${TEST_PUBLISHABLE_KEY}`);
  assertEquals(call.headers.get("content-profile") ?? call.headers.get("accept-profile"), "api");
  assertEquals(call.headers.get("x-request-id"), "uptime-check-0002");
  assertStringIncludes(call.headers.get("x-client-info") ?? "", "plinth-edge/health");
});

Deno.test("a wrong payload from the database is a failed ping", async () => {
  const net = fakeFetch(() => jsonResponse({ flags: {} }));
  const health = makeHealth({
    pingDb: pingApiFlags(net.fetch),
    env: testEnv(),
    sink: captureLogs().sink,
  });
  await assertApiError(await health(fakeRequest("health")), "internal");
});

Deno.test("missing Supabase config is internal and the log names the variable only", async () => {
  const logs = captureLogs();
  const health = makeHealth({
    pingDb: pingApiFlags(fakeFetch(() => jsonResponse(FIXTURE_FLAGS)).fetch),
    env: testEnv({ SUPABASE_URL: undefined }),
    sink: logs.sink,
  });
  await assertApiError(await health(fakeRequest("health")), "internal");
  assertStringIncludes(logs.text(), "SUPABASE_URL");
  assertEquals(logs.text().includes(TEST_PUBLISHABLE_KEY), false);
});

Deno.test("assertFlagsEnvelope accepts the fixture flags and nothing else", () => {
  assertFlagsEnvelope(FIXTURE_FLAGS);
  for (
    const bad of [null, {}, { schema: "plinth.flags/1" }, { schema: "plinth.ok/1", flags: {} }]
  ) {
    let threw = false;
    try {
      assertFlagsEnvelope(bad);
    } catch {
      threw = true;
    }
    assertEquals(threw, true, JSON.stringify(bad));
  }
});
