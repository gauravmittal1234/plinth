import { assertEquals, assertExists, captureLogs, frozenClock } from "../testing/mod.ts";
import { createLogger, errorFields, isSensitiveKey, redact, scrub } from "./log.ts";

Deno.test("one JSON line per call with the BUILD_PLAN §11 fields", () => {
  const logs = captureLogs();
  const log = createLogger({
    fn: "ask",
    requestId: "req-00000001",
    sink: logs.sink,
    clock: frozenClock(),
  });
  log.child({ user_hash: "a1b2c3d4e5f60718" }).info("answered", { latency_ms: 42 });
  const line = logs.lines[0];
  assertExists(line);
  assertEquals(line, {
    ts: "2026-10-18T06:30:00.000Z",
    level: "info",
    fn: "ask",
    request_id: "req-00000001",
    msg: "answered",
    user_hash: "a1b2c3d4e5f60718",
    latency_ms: 42,
  });
});

Deno.test("levels below the minimum are dropped", () => {
  const logs = captureLogs();
  const log = createLogger({ fn: "x", sink: logs.sink, minLevel: "warn" });
  log.debug("d");
  log.info("i");
  log.warn("w");
  log.error("e");
  assertEquals(logs.lines.map((l) => l.level), ["warn", "error"]);
});

Deno.test("sensitive field names are redacted at any depth", () => {
  for (
    const k of [
      "phone",
      "to_phone",
      "waPhone",
      "otp",
      "access_token",
      "Authorization",
      "api_key",
      "email",
      "pan",
      "signature",
    ]
  ) {
    assertEquals(isSensitiveKey(k), true, k);
  }
  for (
    const k of [
      "tokens_in",
      "footprint",
      "company",
      "dedupe_key",
      "user_hash",
      "status",
      "error_code",
    ]
  ) {
    assertEquals(isSensitiveKey(k), false, k);
  }
  assertEquals(redact({ a: { b: [{ otp: "123456", ok: 1 }] }, phone: "x" }), {
    a: { b: [{ otp: "[redacted]", ok: 1 }] },
    phone: "[redacted]",
  });
});

Deno.test("phones, emails, JWTs, keys and bearer tokens are scrubbed from free text", () => {
  const jwt = ["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiJ0ZXN0In0", "c2lnbmF0dXJl"].join(".");
  const key = ["sb", "secret", "abcdefghijklmnop"].join("_");
  const text = `sent to +91 99000 00318 and 9900000318 for rohan@example.com with ${jwt} ` +
    `and ${key}; Authorization: Bearer abc.def-123`;
  assertEquals(
    scrub(text),
    "sent to [phone] and [phone] for [email] with [jwt] and [key]; Authorization: Bearer [redacted]",
  );
  // Dates, offsets, ids and amounts stay readable.
  const keep = "2026-10-18T12:00:00+05:30 id 123e4567-e89b-12d3-a456-426614174000 ₹1,67,20,000";
  assertEquals(scrub(keep), keep);
});

Deno.test("errors log their name and a scrubbed message, plus the cause", () => {
  const cause = { code: "PGRST202", message: "Could not find api.nope", details: "secret detail" };
  const err = new Error("failed for +919900000318", { cause });
  assertEquals(errorFields(err), {
    error_name: "Error",
    error_message: "failed for [phone]",
    error_cause: { code: "PGRST202", message: "Could not find api.nope", hint: undefined },
  });
  assertEquals(errorFields("plain"), { error_message: "plain" });
});

Deno.test("cycles, bigints and long strings do not break a line", () => {
  const logs = captureLogs();
  const loop: Record<string, unknown> = { n: 10n };
  loop.self = loop;
  createLogger({ fn: "x", sink: logs.sink }).info("m", { loop, long: "x".repeat(5000) });
  const line = logs.lines[0]!;
  assertEquals((line.loop as Record<string, unknown>).self, "[circular]");
  assertEquals((line.loop as Record<string, unknown>).n, "10");
  assertEquals((line.long as string).length, 2001);
});
