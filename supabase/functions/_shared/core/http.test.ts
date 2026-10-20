import { assertEquals, assertRejects, fakeRequest } from "../testing/mod.ts";
import { HttpError } from "./errors.ts";
import {
  bearerToken,
  clientIp,
  corsHeaders,
  json,
  ok,
  preflight,
  readJson,
  readText,
  requestIdOf,
} from "./http.ts";

Deno.test("json() and ok() set the content type and no-store unless told otherwise", async () => {
  const res = json({ a: 1 }, { status: 201, headers: { "cache-control": "public, max-age=60" } });
  assertEquals(res.status, 201);
  assertEquals(res.headers.get("content-type"), "application/json; charset=utf-8");
  assertEquals(res.headers.get("cache-control"), "public, max-age=60");
  assertEquals(await ok().json(), { ok: true });
  assertEquals(ok().headers.get("cache-control"), "no-store");
});

Deno.test("request ids: a well-formed caller id is kept, anything else is replaced", () => {
  assertEquals(requestIdOf(fakeRequest("x", { requestId: "web-7f3a9c21" })), "web-7f3a9c21");
  for (const bad of ["short", "has spaces in it", "<script>alert(1)</script>", "x".repeat(200)]) {
    const id = requestIdOf(fakeRequest("x", { headers: { "x-request-id": bad } }));
    assertEquals(/^[0-9a-f-]{36}$/.test(id), true, bad);
  }
});

Deno.test("client IP from the first forwarded address", () => {
  assertEquals(
    clientIp(fakeRequest("x", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } })),
    "203.0.113.7",
  );
  assertEquals(
    clientIp(fakeRequest("x", { headers: { "cf-connecting-ip": "198.51.100.2" } })),
    "198.51.100.2",
  );
  assertEquals(clientIp(fakeRequest("x")), null);
});

Deno.test("bearer tokens", () => {
  assertEquals(bearerToken(fakeRequest("x", { bearer: "user-token-1" })), "user-token-1");
  assertEquals(bearerToken(fakeRequest("x", { headers: { authorization: "Basic abc" } })), null);
  assertEquals(bearerToken(fakeRequest("x")), null);
});

Deno.test("readJson parses JSON bodies", async () => {
  assertEquals(await readJson(fakeRequest("x", { json: { question: "q" } })), { question: "q" });
  const vendor = fakeRequest("x", {
    body: "{}",
    headers: { "content-type": "application/vnd.api+json" },
  });
  assertEquals(await readJson(vendor), {});
});

Deno.test("readJson refuses bad input as invalid_input", async () => {
  const cases: Array<[Request, string]> = [
    [
      fakeRequest("x", { body: "{}", headers: { "content-type": "text/plain" } }),
      "application/json",
    ],
    [
      fakeRequest("x", { body: "{nope", headers: { "content-type": "application/json" } }),
      "not valid JSON",
    ],
    [
      fakeRequest("x", {
        body: "",
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
      "empty",
    ],
  ];
  for (const [req, words] of cases) {
    const e = await assertRejects(() => readJson(req), HttpError, words);
    assertEquals(e.code, "invalid_input");
  }
});

Deno.test("bodies over the cap are refused, declared or streamed", async () => {
  const big = JSON.stringify({ text: "x".repeat(2000) });
  await assertRejects(
    () => readJson(fakeRequest("x", { json: JSON.parse(big) }), { maxBytes: 1000 }),
    HttpError,
    "over 1000 bytes",
  );
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < 5; i++) c.enqueue(new TextEncoder().encode("x".repeat(400)));
      c.close();
    },
  });
  const req = new Request("http://localhost/functions/v1/x", { method: "POST", body: stream });
  await assertRejects(() => readText(req, { maxBytes: 1000 }), HttpError, "over 1000 bytes");
  const latin1 = new Request("http://localhost/x", {
    method: "POST",
    body: new Uint8Array([0xff, 0xfe]),
  });
  await assertRejects(() => readText(latin1), HttpError, "UTF-8");
});

Deno.test("CORS: allowed origins are echoed, others get nothing", () => {
  const opts = { origins: ["https://plinth.in"], methods: ["POST", "OPTIONS"] };
  const h = corsHeaders(fakeRequest("ask", { headers: { origin: "https://plinth.in" } }), opts);
  assertEquals(h?.get("access-control-allow-origin"), "https://plinth.in");
  assertEquals(h?.get("vary"), "Origin");
  assertEquals(h?.get("access-control-allow-headers")?.includes("x-request-id"), true);
  assertEquals(
    corsHeaders(fakeRequest("ask", { headers: { origin: "https://evil.example" } }), opts),
    null,
  );
  assertEquals(corsHeaders(fakeRequest("ask"), opts), null);
  const pre = preflight(
    fakeRequest("ask", { method: "OPTIONS", headers: { origin: "https://plinth.in" } }),
    opts,
  );
  assertEquals(pre.status, 204);
  assertEquals(pre.headers.get("access-control-allow-methods"), "POST, OPTIONS");
});
