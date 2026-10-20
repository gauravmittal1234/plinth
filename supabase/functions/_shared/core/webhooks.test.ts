import {
  assertEquals,
  assertRejects,
  assertThrows,
  frozenClock,
  MINUTE,
  randomWebhookSecret,
  signedWebhook,
} from "../testing/mod.ts";
import { EnvError, Secret } from "./env.ts";
import { HttpError } from "./errors.ts";
import {
  readStandardWebhook,
  signStandardWebhook,
  verifyStandardWebhook,
  webhookSecretKey,
} from "./webhooks.ts";

// The Send-SMS hook body (API_CONTRACTS §5.4). The number is a fictional fixture placeholder.
const BODY = { user: { phone: "910000000001" }, sms: { otp: "000000" } };

Deno.test("a correctly signed Supabase Auth hook verifies and parses", async () => {
  const secret = randomWebhookSecret();
  const clock = frozenClock();
  const req = await signedWebhook(secret, BODY, { clock });
  assertEquals(await readStandardWebhook(req, new Secret(secret), { clock }), BODY);
});

Deno.test("the signature matches the Standard Webhooks construction", async () => {
  // Spec construction: base64(HMAC-SHA256(key, `${id}.${ts}.${body}`)) with the whsec_ key decoded.
  const key = crypto.getRandomValues(new Uint8Array(24));
  const b64 = btoa(String.fromCharCode(...key));
  const sig = await signStandardWebhook(`whsec_${b64}`, {
    id: "msg_1",
    timestamp: 1760769000,
    body: "{}",
  });
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("msg_1.1760769000.{}")),
  );
  assertEquals(sig, `v1,${btoa(String.fromCharCode(...mac))}`);
  assertEquals(
    await signStandardWebhook(`v1,whsec_${b64}`, {
      id: "msg_1",
      timestamp: 1760769000,
      body: "{}",
    }),
    sig,
  );
});

Deno.test("a tampered body, a wrong secret or a stale timestamp is forbidden", async () => {
  const secret = randomWebhookSecret();
  const clock = frozenClock();
  const req = await signedWebhook(secret, BODY, { clock });
  const raw = await req.text();

  const tampered = raw.replace("000000", "111111");
  const e1 = await assertRejects(
    () => verifyStandardWebhook(req.headers, tampered, secret, { clock }),
    HttpError,
  );
  assertEquals(e1.code, "forbidden");

  await assertRejects(
    () => verifyStandardWebhook(req.headers, raw, randomWebhookSecret(), { clock }),
    HttpError,
    "does not match",
  );

  clock.advance(6 * MINUTE);
  await assertRejects(
    () => verifyStandardWebhook(req.headers, raw, secret, { clock }),
    HttpError,
    "outside the allowed window",
  );
  clock.advance(-12 * MINUTE);
  await assertRejects(
    () => verifyStandardWebhook(req.headers, raw, secret, { clock }),
    HttpError,
    "outside the allowed window",
  );
});

Deno.test("any one of several signatures may match (secret rotation)", async () => {
  const secret = randomWebhookSecret();
  const clock = frozenClock();
  const req = await signedWebhook(secret, BODY, { clock });
  const headers = new Headers(req.headers);
  headers.set(
    "webhook-signature",
    `v1,${btoa("old")} v2,ignored ${headers.get("webhook-signature")}`,
  );
  await verifyStandardWebhook(headers, await req.text(), secret, { clock });
});

Deno.test("missing headers are auth_required; a bad or unset secret is a config error", async () => {
  const secret = randomWebhookSecret();
  const e = await assertRejects(
    () => verifyStandardWebhook(new Headers(), "{}", secret),
    HttpError,
  );
  assertEquals(e.code, "auth_required");
  await assertRejects(() => verifyStandardWebhook(new Headers(), "{}", null), EnvError);
  assertThrows(() => webhookSecretKey("v1,whsec_!!!"), EnvError);
  assertThrows(() => webhookSecretKey(`whsec_${btoa("short")}`), EnvError);
});
