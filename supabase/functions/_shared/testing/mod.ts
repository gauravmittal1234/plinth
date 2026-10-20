// _shared/testing: helpers for Deno tests of edge functions (T29). Owner: T29.
// Test files only: production code never imports this folder (testing.test.ts checks it).
//
//   import { assertEquals, fakeRequest, frozenClock, testEnv, captureLogs } from "../_shared/testing/mod.ts";
//
//   fakeRequest("ask", { json: {...}, bearer: "user-token" })   a Request for /functions/v1/ask
//   frozenClock()                                               18 Oct 2026 12:00 IST; advance(ms)
//   testEnv({ PLINTH_DISPATCH_SECRET: "…" })                    CoreEnv for PLINTH_ENV=test
//   captureLogs()                                               a LogSink that keeps parsed lines
//   fakeFetch(route)                                            a fetch that records calls, no network
//   fakeRpc({ flags: {...} })                                   an RpcClient answering from a table
//   signedWebhook(secret, body)                                 a Standard Webhooks request
//   readBody(res) / assertApiError(res, "not_found")            response assertions
//
// `deno task test` runs without --allow-net: a test that reaches for the network fails.

export * from "./deps.ts";
export * from "./clock.ts";
export * from "./env.ts";
export * from "./fetch.ts";
export * from "./log.ts";
export * from "./request.ts";
export * from "./response.ts";
export * from "./rpc.ts";
export * from "./webhooks.ts";
