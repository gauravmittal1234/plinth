import {
  assertEquals,
  assertRejects,
  captureLogs,
  fakeRpc,
  frozenClock,
  HOUR,
  MINUTE,
} from "../testing/mod.ts";
import { HttpError } from "./errors.ts";
import { createLogger } from "./log.ts";
import {
  checkRateLimit,
  enforceRateLimit,
  MemoryRateLimitStore,
  rpcRateLimitStore,
  windowStart,
} from "./ratelimit.ts";

const RULE = { bucket: "otp_phone", limit: 3, windowSeconds: 3600 };
const salt = "test-hash-salt";

Deno.test("windows align to the epoch", () => {
  assertEquals(
    windowStart(new Date("2026-10-18T06:30:00Z"), 3600).toISOString(),
    "2026-10-18T06:00:00.000Z",
  );
  assertEquals(
    windowStart(new Date("2026-10-18T06:30:59Z"), 60).toISOString(),
    "2026-10-18T06:30:00.000Z",
  );
});

Deno.test("the fourth hit in an hour is rate_limited with Retry-After; the next window resets", async () => {
  const store = new MemoryRateLimitStore();
  const clock = frozenClock(); // 06:30 UTC: 30 minutes left in the window
  for (let i = 1; i <= 3; i++) {
    const r = await enforceRateLimit(store, RULE, "+910000000001", { salt, clock });
    assertEquals([r.count, r.remaining], [i, 3 - i]);
  }
  const e = await assertRejects(
    () => enforceRateLimit(store, RULE, "+910000000001", { salt, clock }),
    HttpError,
  );
  assertEquals([e.code, e.status, e.headers.get("retry-after")], [
    "rate_limited",
    429,
    String(30 * 60),
  ]);
  // Another key is counted apart.
  assertEquals((await checkRateLimit(store, RULE, "+910000000002", { salt, clock })).allowed, true);
  clock.advance(31 * MINUTE);
  assertEquals((await checkRateLimit(store, RULE, "+910000000001", { salt, clock })).count, 1);
});

Deno.test("the shared store sends a pseudonym, never the key", async () => {
  const rpc = fakeRpc({ rate_limit_hit: () => ({ data: 2, error: null }) });
  const clock = frozenClock();
  const r = await checkRateLimit(rpcRateLimitStore(rpc), RULE, "+910000000001", { salt, clock });
  assertEquals([r.allowed, r.count], [true, 2]);
  const call = rpc.calls[0]!;
  assertEquals(call.fn, "rate_limit_hit");
  assertEquals(call.args.p_bucket, "otp_phone");
  assertEquals(call.args.p_window_start, "2026-10-18T06:00:00.000Z");
  assertEquals(/^[0-9a-f]{64}$/.test(String(call.args.p_key_hash)), true);
  assertEquals(JSON.stringify(call.args).includes("910000000001"), false);
});

Deno.test("a store failure lets traffic through by default, or refuses it when asked", async () => {
  const rpc = fakeRpc({});
  const logs = captureLogs();
  const log = createLogger({ fn: "wa-webhook", sink: logs.sink });
  const clock = frozenClock();
  const open = await checkRateLimit(rpcRateLimitStore(rpc), RULE, "k", { salt, clock, log });
  assertEquals(open.allowed, true);
  assertEquals(logs.find("rate limit store failed")?.allowed, true);
  const closed = await checkRateLimit(rpcRateLimitStore(rpc), RULE, "k", {
    salt,
    clock,
    onStoreError: "deny",
  });
  assertEquals(closed.allowed, false);
});

Deno.test("bad rules are programming errors", async () => {
  const store = new MemoryRateLimitStore();
  await assertRejects(() =>
    checkRateLimit(store, { ...RULE, bucket: "Bad Bucket" }, "k", { salt })
  );
  await assertRejects(() => checkRateLimit(store, { ...RULE, limit: 0 }, "k", { salt }));
  assertEquals(store.size, 0);
  assertEquals(HOUR, 3600 * 1000);
});
