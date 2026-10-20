import {
  assertApiError,
  assertEquals,
  assertExists,
  assertMatch,
  captureLogs,
  fakeRequest,
  readBody,
  testEnv,
} from "../testing/mod.ts";
import { EnvError } from "./env.ts";
import { HttpError } from "./errors.ts";
import { createHandler } from "./handler.ts";
import { json } from "./http.ts";

Deno.test("the handler gets a context and the response gets the request id", async () => {
  const logs = captureLogs();
  const handler = createHandler(
    "probe",
    (req, ctx) =>
      json({
        fn: ctx.fn,
        id: ctx.requestId,
        ip: ctx.ip,
        env: ctx.env.plinthEnv,
        method: req.method,
      }),
    { methods: ["POST"], env: testEnv(), sink: logs.sink },
  );
  const res = await handler(
    fakeRequest("probe", { json: {}, requestId: "req-00000042", ip: "203.0.113.9" }),
  );
  assertEquals(await readBody(res), {
    fn: "probe",
    id: "req-00000042",
    ip: "203.0.113.9",
    env: "test",
    method: "POST",
  });
  assertEquals(res.headers.get("x-request-id"), "req-00000042");
  const line = logs.find("request");
  assertExists(line);
  assertEquals([line.level, line.status, line.method, line.path], [
    "info",
    200,
    "POST",
    "/functions/v1/probe",
  ]);
  assertEquals(logs.text().includes("203.0.113.9"), false);
});

Deno.test("a thrown HttpError becomes its contract body and a warn line", async () => {
  const logs = captureLogs();
  const handler = createHandler("probe", () => {
    throw new HttpError("consent_required");
  }, { methods: ["POST"], env: testEnv(), sink: logs.sink });
  await assertApiError(await handler(fakeRequest("probe", { json: {} })), "consent_required");
  assertEquals(logs.find("request")?.level, "warn");
});

Deno.test("an unexpected error is internal; the cause is logged, never returned", async () => {
  const logs = captureLogs();
  const handler = createHandler("probe", () => {
    throw new TypeError("cannot read properties of undefined (reading 'band')");
  }, { methods: ["GET"], env: testEnv(), sink: logs.sink });
  const res = await handler(fakeRequest("probe"));
  const message = await assertApiError(res, "internal");
  assertEquals(message.includes("band"), false);
  const err = logs.find("unhandled error");
  assertExists(err);
  assertEquals(err.error_name, "TypeError");
  assertEquals(logs.find("request")?.level, "error");
});

Deno.test("a configuration error is internal and names the variables", async () => {
  const logs = captureLogs();
  const handler = createHandler("probe", () => json({}), {
    methods: ["GET"],
    env: () => {
      throw new EnvError(["PLINTH_ENV"], "must be one of …");
    },
    sink: logs.sink,
  });
  await assertApiError(await handler(fakeRequest("probe")), "internal");
  assertEquals(logs.find("configuration error")?.missing_or_invalid, ["PLINTH_ENV"]);
});

Deno.test("methods outside the list are not_found with Allow", async () => {
  const handler = createHandler("probe", () => json({}), {
    methods: ["post", "GET"],
    env: testEnv(),
    sink: captureLogs().sink,
  });
  const res = await handler(fakeRequest("probe", { method: "DELETE" }));
  assertEquals(res.headers.get("allow"), "POST, GET");
  await assertApiError(res, "not_found");
});

Deno.test("CORS: preflight answered, allowed origin echoed on the real response", async () => {
  const cors = { origins: ["https://plinth.in"] };
  const handler = createHandler("ask", () => json({ ok: true }), {
    methods: ["POST"],
    cors,
    env: testEnv(),
    sink: captureLogs().sink,
  });
  const pre = await handler(
    fakeRequest("ask", { method: "OPTIONS", headers: { origin: "https://plinth.in" } }),
  );
  assertEquals(pre.status, 204);
  assertEquals(pre.headers.get("access-control-allow-origin"), "https://plinth.in");
  const res = await handler(
    fakeRequest("ask", { json: {}, headers: { origin: "https://plinth.in" } }),
  );
  assertEquals(res.headers.get("access-control-allow-origin"), "https://plinth.in");
  await res.body?.cancel();
});

Deno.test("identify() adds a salted user_hash to later lines, never the id", async () => {
  const logs = captureLogs();
  const userId = "7d0e2f8a-0000-4000-8000-000000000318";
  const handler = createHandler("probe", async (_req, ctx) => {
    const hash = await ctx.identify(userId);
    ctx.log.info("acting", { step: 1 });
    return json({ hash });
  }, { methods: ["GET"], env: testEnv(), sink: logs.sink });
  const { hash } = await readBody<{ hash: string }>(await handler(fakeRequest("probe")));
  assertMatch(hash, /^[0-9a-f]{16}$/);
  assertEquals(logs.find("acting")?.user_hash, hash);
  assertEquals(logs.find("request")?.user_hash, hash);
  assertEquals(logs.text().includes(userId), false);
});

Deno.test("waitUntil runs the task and logs its failure", async () => {
  const logs = captureLogs();
  let done!: () => void;
  const finished = new Promise<void>((r) => (done = r));
  const handler = createHandler("probe", (_req, ctx) => {
    ctx.waitUntil(Promise.reject(new Error("late failure")).finally(() => setTimeout(done, 0)));
    return json({ ok: true });
  }, { methods: ["GET"], env: testEnv(), sink: logs.sink });
  await (await handler(fakeRequest("probe"))).body?.cancel();
  await finished;
  assertEquals(logs.find("background task failed")?.error_message, "late failure");
});
