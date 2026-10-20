// auth-sms-hook: signature verification, adapter selection, per-number limits and the rule that
// in prod mode the code is never logged. Run: npx --yes deno@2 task test (in supabase/functions).
//
// Numbers: Rohan's fixture number (people.json, +91 99000 003NN block), which real channels
// refuse, and +910000000001, the repo's placeholder that belongs to nobody, for the paths that
// reach a (fake) provider. The webhook secret and the codes are random per run.

import type { RateLimitStore } from "../_shared/core/ratelimit.ts";
import { MemoryRateLimitStore } from "../_shared/core/ratelimit.ts";
import { readCoreEnv } from "../_shared/core/env.ts";
import { loginCodeMessage } from "../_shared/otp/whatsapp.ts";
import { msg91FlowBody } from "../_shared/otp/msg91.ts";
import type { CapturedLogs, FakeFetch, TestClock } from "../_shared/testing/mod.ts";
import {
  assert,
  assertApiError,
  assertEquals,
  assertFalse,
  assertMatch,
  captureLogs,
  fakeFetch,
  fakeRequest,
  frozenClock,
  HOUR,
  jsonResponse,
  MINUTE,
  noNetwork,
  randomWebhookSecret,
  readBody,
  signedWebhook,
  testEnvSource,
} from "../_shared/testing/mod.ts";
import { HOOK_MESSAGES, makeAuthSmsHook, tooManyCodes } from "./logic.ts";

const ROHAN_ID = "bff1ee72-9910-5980-a875-96a9a00b24cf";
const ROHAN_AUTH_PHONE = "919900000318"; // as Auth stores it: digits, no "+"
const PLACEHOLDER_AUTH_PHONE = "910000000001";

const SECRET = randomWebhookSecret();

const LIVE = {
  META_MODE: "live",
  OTP_CHANNELS: "whatsapp,msg91",
  WA_PHONE_NUMBER_ID: "test-phone-id",
  WA_ACCESS_TOKEN: "test-wa-token",
  MSG91_AUTH_KEY: "test-sms-key",
  MSG91_TEMPLATE_ID: "test-sms-template",
};

function randomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
}

function payload(phone: string, code: string, id = ROHAN_ID) {
  return {
    user: { id, aud: "authenticated", role: "authenticated", phone, app_metadata: {} },
    sms: { otp: code },
  };
}

interface Setup {
  vars?: Record<string, string | undefined>;
  route?: Parameters<typeof fakeFetch>[0];
  store?: RateLimitStore;
  clock?: TestClock;
}

interface Hook {
  call(body: unknown, opts?: { secret?: string; at?: TestClock }): Promise<Response>;
  logs: CapturedLogs;
  ff: FakeFetch;
  clock: TestClock;
}

function setup(s: Setup = {}): Hook {
  const src = testEnvSource({ SEND_SMS_HOOK_SECRET: SECRET, ...s.vars });
  const logs = captureLogs();
  const ff = fakeFetch(s.route ?? noNetwork);
  const clock = s.clock ?? frozenClock();
  const handler = makeAuthSmsHook({
    env: readCoreEnv(src),
    envSource: src,
    rateLimitStore: s.store ?? new MemoryRateLimitStore(),
    fetch: ff.fetch,
    sink: logs.sink,
    clock,
  });
  return {
    call: async (body, opts = {}) =>
      handler(
        await signedWebhook(opts.secret ?? SECRET, body, {
          clock: opts.at ?? clock,
          path: "auth-sms-hook",
        }),
      ),
    logs,
    ff,
    clock,
  };
}

async function assertHookError(res: Response, httpCode: number, message?: string | RegExp) {
  assertEquals(res.status, 200, "hook errors travel as HTTP 200 so Auth relays them");
  assertEquals(res.headers.get("retry-after"), null);
  const body = await readBody<{ error: { http_code: number; message: string } }>(res);
  assertEquals(body.error.http_code, httpCode);
  if (typeof message === "string") assertEquals(body.error.message, message);
  else if (message) assertMatch(body.error.message, message);
}

/** Neither the code nor the number (in any form) nor a provider key reached the logs. */
function assertCleanLogs(logs: CapturedLogs, code: string, authPhone: string) {
  const text = logs.text();
  assertFalse(text.includes(code), "the code is not in the logs");
  assertFalse(text.includes(authPhone), "the number is not in the logs");
  assertFalse(text.includes(authPhone.slice(-10)), "nor its last ten digits");
  assertFalse(text.includes("test-wa-token") || text.includes("test-sms-key"));
}

// Signature verification (Standard Webhooks) ------------------------------------------------------

Deno.test("a correctly signed call is accepted and answers {}", async () => {
  const hook = setup();
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()));
  assertEquals(res.status, 200);
  assertEquals(await readBody(res), {});
  assertEquals(res.headers.get("content-type"), "application/json; charset=utf-8");
  assertEquals(hook.logs.find("login code sent")?.mode, "mock");
});

Deno.test("signature: missing webhook headers → 401 auth_required", async () => {
  const hook = makeAuthSmsHook({
    env: readCoreEnv(testEnvSource()),
    envSource: testEnvSource({ SEND_SMS_HOOK_SECRET: SECRET }),
    rateLimitStore: new MemoryRateLimitStore(),
    sink: captureLogs().sink,
  });
  const res = await hook(
    fakeRequest("auth-sms-hook", { json: payload(PLACEHOLDER_AUTH_PHONE, randomCode()) }),
  );
  await assertApiError(res, "auth_required");
});

Deno.test("signature: signed with another secret → 403 forbidden, nothing sent", async () => {
  const hook = setup();
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()), {
    secret: randomWebhookSecret(),
  });
  await assertApiError(res, "forbidden");
  assertEquals(hook.logs.find("login code sent"), undefined);
});

Deno.test("signature: a body changed after signing → 403 forbidden", async () => {
  const hook = setup();
  const signed = await signedWebhook(SECRET, payload(PLACEHOLDER_AUTH_PHONE, randomCode()), {
    clock: hook.clock,
    path: "auth-sms-hook",
  });
  const tampered = new Request(signed.url, {
    method: "POST",
    headers: signed.headers,
    body: JSON.stringify(payload(PLACEHOLDER_AUTH_PHONE, randomCode())),
  });
  const handler = makeAuthSmsHook({
    env: readCoreEnv(testEnvSource()),
    envSource: testEnvSource({ SEND_SMS_HOOK_SECRET: SECRET }),
    rateLimitStore: new MemoryRateLimitStore(),
    sink: captureLogs().sink,
    clock: hook.clock,
  });
  await assertApiError(await handler(tampered), "forbidden");
});

Deno.test("signature: a timestamp older than 5 minutes → 403 forbidden", async () => {
  const hook = setup();
  const past = frozenClock();
  past.advance(-6 * MINUTE);
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()), { at: past });
  await assertApiError(res, "forbidden");
});

Deno.test("signature: SEND_SMS_HOOK_SECRET unset → 500 internal, the log names no value", async () => {
  const hook = setup({ vars: { SEND_SMS_HOOK_SECRET: undefined } });
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()));
  await assertApiError(res, "internal");
  assert(hook.logs.find("configuration error"));
});

Deno.test("only POST: GET → 404 with Allow: POST", async () => {
  const hook = makeAuthSmsHook({ env: readCoreEnv(testEnvSource()), sink: captureLogs().sink });
  const res = await hook(fakeRequest("auth-sms-hook"));
  await assertApiError(res, "not_found");
  assertEquals(res.headers.get("allow"), "POST");
});

Deno.test("a signed payload without user.phone or sms.otp → 422 invalid_input", async () => {
  const hook = setup();
  await assertApiError(await hook.call({ user: { id: ROHAN_ID }, sms: {} }), "invalid_input");
  await assertApiError(
    await hook.call(payload("not-a-number", randomCode())),
    "invalid_input",
  );
});

// Adapter selection, end to end ------------------------------------------------------------------------

Deno.test("prod, live: WhatsApp gets the login_code body; nothing else is called", async () => {
  const code = randomCode();
  const hook = setup({
    vars: { ...LIVE, PLINTH_ENV: "prod" },
    route: () => jsonResponse({ messages: [{ id: "wamid.TEST1" }] }),
  });
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, code));
  assertEquals(await readBody(res), {});
  assertEquals(hook.ff.calls.length, 1);
  assertEquals(hook.ff.calls[0]!.url.hostname, "graph.facebook.com");
  assertEquals(
    JSON.parse(hook.ff.calls[0]!.body!),
    loginCodeMessage(`+${PLACEHOLDER_AUTH_PHONE}`, code),
  );
  const sent = hook.logs.find("login code sent");
  assertEquals([sent?.mode, sent?.channel, sent?.provider_id], ["live", "whatsapp", "wamid.TEST1"]);
  assertCleanLogs(hook.logs, code, PLACEHOLDER_AUTH_PHONE);
});

Deno.test("prod, live: WhatsApp down → MSG91 SMS delivers; the code is never logged", async () => {
  const code = randomCode();
  const hook = setup({
    vars: { ...LIVE, PLINTH_ENV: "prod" },
    route: (call) =>
      call.url.hostname === "graph.facebook.com"
        ? jsonResponse({ error: { code: 131000 } }, 500)
        : jsonResponse({ type: "success", message: "req-test-3" }),
  });
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, code));
  assertEquals(await readBody(res), {});
  assertEquals(hook.ff.calls.map((c) => c.url.hostname), [
    "graph.facebook.com",
    "control.msg91.com",
  ]);
  assertEquals(
    JSON.parse(hook.ff.calls[1]!.body!),
    msg91FlowBody("test-sms-template", `+${PLACEHOLDER_AUTH_PHONE}`, code),
  );
  assertEquals(hook.logs.find("login code sent")?.attempts, ["whatsapp", "msg91"]);
  assertCleanLogs(hook.logs, code, PLACEHOLDER_AUTH_PHONE);
});

Deno.test("prod, live: every channel failing → hook error 500; the code is never logged", async () => {
  const code = randomCode();
  const hook = setup({
    vars: { ...LIVE, PLINTH_ENV: "prod" },
    route: () => jsonResponse({ error: { code: 1 }, type: "error" }, 503),
  });
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, code));
  await assertHookError(res, 500, HOOK_MESSAGES.sendFailed);
  assert(hook.logs.find("login code not sent"));
  assertCleanLogs(hook.logs, code, PLACEHOLDER_AUTH_PHONE);
});

Deno.test("prod, mock mode (the default): nothing is sent and the code is never logged", async () => {
  const code = randomCode();
  const hook = setup({ vars: { PLINTH_ENV: "prod", PLINTH_HASH_SALT: "test-hash-salt" } });
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, code));
  assertEquals(await readBody(res), {});
  assertEquals(hook.ff.calls.length, 0);
  assertEquals(hook.logs.find("login code (mock): not sent")?.local_code, undefined);
  assertCleanLogs(hook.logs, code, PLACEHOLDER_AUTH_PHONE);
});

Deno.test("local, mock mode: the code is in the function log (API_CONTRACTS §5.4)", async () => {
  const code = randomCode();
  const hook = setup({ vars: { PLINTH_ENV: "local" } });
  await (await hook.call(payload(ROHAN_AUTH_PHONE, code))).body?.cancel();
  const line = hook.logs.find("login code (mock): not sent");
  assertEquals(line?.local_code, code);
  assertEquals(line?.to_masked, "+91 99••• ••318");
  assertEquals(hook.ff.calls.length, 0);
});

Deno.test("fixture test numbers: mock outside prod even when live, refused in prod; never fetched", async () => {
  const dev = setup({ vars: { ...LIVE, PLINTH_ENV: "dev" } });
  assertEquals(await readBody(await dev.call(payload(ROHAN_AUTH_PHONE, randomCode()))), {});
  assertEquals(dev.logs.find("login code sent")?.mode, "test_number");
  assertEquals(dev.ff.calls.length, 0);

  const prod = setup({ vars: { ...LIVE, PLINTH_ENV: "prod" } });
  await assertHookError(
    await prod.call(payload(ROHAN_AUTH_PHONE, randomCode())),
    400,
    HOOK_MESSAGES.testNumber,
  );
  assertEquals(prod.ff.calls.length, 0);
});

Deno.test("prod without PLINTH_HASH_SALT → 500 internal before anything is sent", async () => {
  const hook = setup({
    vars: { ...LIVE, PLINTH_ENV: "prod", PLINTH_HASH_SALT: undefined },
    route: noNetwork,
  });
  await assertApiError(await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode())), "internal");
  assertEquals(hook.ff.calls.length, 0);
});

// Per-number rate limits ------------------------------------------------------------------------------

Deno.test("per number: the 6th code in an hour → hook error 429 (no Retry-After, no HTTP 429)", async () => {
  const hook = setup();
  for (let i = 0; i < 5; i++) {
    assertEquals(
      await readBody(await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()))),
      {},
    );
    hook.clock.advance(31_000);
  }
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()));
  await assertHookError(res, 429, /^Too many codes for this number\. Try again in \d+ minutes?\.$/);
  assertEquals(hook.logs.find("login code rate limited")?.bucket, "otp_phone_hour");

  // Another number is not affected.
  assertEquals(await readBody(await hook.call(payload(ROHAN_AUTH_PHONE, randomCode()))), {});
});

Deno.test("per number: 10 codes a day, whatever the hours", async () => {
  const hook = setup();
  for (let i = 0; i < 10; i++) {
    if (i === 5) hook.clock.advance(HOUR);
    assertEquals(
      await readBody(await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()))),
      {},
    );
  }
  hook.clock.advance(HOUR);
  const res = await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode()));
  await assertHookError(
    res,
    429,
    /^Too many codes for this number\. Try again in \d+ (hours|minutes)\.$/,
  );
  assertEquals(hook.logs.find("login code rate limited")?.bucket, "otp_phone_day");
});

Deno.test("per number: when the limit store is down, codes are refused (deny)", async () => {
  const broken: RateLimitStore = { hit: () => Promise.reject(new Error("db unreachable")) };
  const hook = setup({ store: broken });
  await assertHookError(await hook.call(payload(PLACEHOLDER_AUTH_PHONE, randomCode())), 429);
  assert(hook.logs.find("rate limit store failed"));
});

Deno.test("tooManyCodes words the wait in minutes, then hours", () => {
  assertEquals(tooManyCodes(30), "Too many codes for this number. Try again in 1 minute.");
  assertEquals(tooManyCodes(59 * 60), "Too many codes for this number. Try again in 59 minutes.");
  assertEquals(tooManyCodes(5 * 3600), "Too many codes for this number. Try again in 5 hours.");
});
