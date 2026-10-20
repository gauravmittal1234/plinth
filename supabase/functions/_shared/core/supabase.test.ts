import {
  assertEquals,
  assertRejects,
  assertThrows,
  fakeFetch,
  fakeRequest,
  fakeRpc,
  jsonResponse,
  TEST_PUBLISHABLE_KEY,
  TEST_SECRET_KEY,
  TEST_SUPABASE_URL,
  testEnv,
} from "../testing/mod.ts";
import { EnvError } from "./env.ts";
import { HttpError } from "./errors.ts";
import {
  anonClient,
  callRpc,
  secretClient,
  userClient,
  userClientFromRequest,
} from "./supabase.ts";

const cfg = testEnv().supabase;
const rpcUrl = (fn: string) => `${TEST_SUPABASE_URL}/rest/v1/rpc/${fn}`;

Deno.test("anon: publishable key, api schema, request id", async () => {
  const net = fakeFetch(() => jsonResponse({ schema: "plinth.flags/1", flags: {} }));
  const client = anonClient(cfg, { requestId: "req-00000007", fn: "ask", fetch: net.fetch });
  await callRpc(client, "flags");
  const call = net.calls[0]!;
  assertEquals(`${call.url.origin}${call.url.pathname}`, rpcUrl("flags"));
  assertEquals(call.method, "POST");
  assertEquals(call.headers.get("apikey"), TEST_PUBLISHABLE_KEY);
  assertEquals(call.headers.get("authorization"), `Bearer ${TEST_PUBLISHABLE_KEY}`);
  assertEquals(call.headers.get("content-profile"), "api");
  assertEquals(call.headers.get("x-request-id"), "req-00000007");
});

Deno.test("user: the caller's token is the Authorization, the publishable key the apikey", async () => {
  const net = fakeFetch(() => jsonResponse({ ok: true }));
  await callRpc(userClient(cfg, "user-token-3", { fetch: net.fetch }), "unfollow", {
    p_slug: "aurelia-heights-phase-2",
  });
  const call = net.calls[0]!;
  assertEquals(call.headers.get("authorization"), "Bearer user-token-3");
  assertEquals(call.headers.get("apikey"), TEST_PUBLISHABLE_KEY);
  assertEquals(JSON.parse(call.body ?? "{}"), { p_slug: "aurelia-heights-phase-2" });

  const fromReq = userClientFromRequest(cfg, fakeRequest("x", { bearer: "user-token-4" }), {
    fetch: net.fetch,
  });
  await callRpc(fromReq, "me");
  assertEquals(net.calls[1]!.headers.get("authorization"), "Bearer user-token-4");
  assertThrows(() => userClientFromRequest(cfg, fakeRequest("x")), HttpError);
});

Deno.test("secret: the secret key, and only when configured", async () => {
  const net = fakeFetch(() => jsonResponse(1));
  await callRpc(secretClient(cfg, { fetch: net.fetch }), "rate_limit_hit", {});
  assertEquals(net.calls[0]!.headers.get("apikey"), TEST_SECRET_KEY);
  const noSecret = testEnv({ SUPABASE_SECRET_KEY: undefined }).supabase;
  assertThrows(() => secretClient(noSecret), EnvError, "SUPABASE_SECRET_KEY");
  assertThrows(
    () => anonClient(testEnv({ SUPABASE_URL: undefined }).supabase),
    EnvError,
    "SUPABASE_URL",
  );
});

Deno.test("GET for STABLE functions puts the args in the query", async () => {
  const net = fakeFetch(() => jsonResponse({}));
  await callRpc(anonClient(cfg, { fetch: net.fetch }), "risk_summary", {
    p_slug: "aurelia-heights-phase-2",
  }, { get: true });
  const call = net.calls[0]!;
  assertEquals(call.method, "GET");
  assertEquals(call.url.searchParams.get("p_slug"), "aurelia-heights-phase-2");
  assertEquals(call.headers.get("accept-profile"), "api");
});

Deno.test("a contract error from PostgREST becomes the same HttpError", async () => {
  const body = {
    code: "PT404",
    message: "not_found",
    details: "We can't find a project at that address.",
    hint: null,
  };
  const net = fakeFetch(() => jsonResponse(body, 404));
  const e = await assertRejects(
    () => callRpc(anonClient(cfg, { fetch: net.fetch }), "risk_summary", { p_slug: "nope" }),
    HttpError,
  );
  assertEquals([e.code, e.status, e.message], ["not_found", 404, body.details]);
});

Deno.test("the fake RpcClient answers from its table and records calls", async () => {
  const rpc = fakeRpc({
    flags: { data: { schema: "plinth.flags/1", flags: {} } },
    boom: { error: { code: "PT409", message: "conflict" } },
  });
  assertEquals(await callRpc(rpc, "flags", undefined, { get: true }), {
    schema: "plinth.flags/1",
    flags: {},
  });
  assertEquals(rpc.calls, [{ fn: "flags", args: {}, get: true }]);
  assertEquals((await assertRejects(() => callRpc(rpc, "boom"), HttpError)).code, "conflict");
  assertEquals((await assertRejects(() => callRpc(rpc, "unknown"), HttpError)).code, "internal");
});
