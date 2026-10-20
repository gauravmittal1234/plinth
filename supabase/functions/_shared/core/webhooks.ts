// Standard Webhooks verification (T29; https://www.standardwebhooks.com, API_CONTRACTS §5.4).
//
// Supabase Auth hooks (the Send-SMS hook → auth-sms-hook, T41) sign each call with:
//   webhook-id         a unique message id
//   webhook-timestamp  Unix seconds
//   webhook-signature  space-separated "v1,<base64 HMAC-SHA256>" entries
// over `${id}.${timestamp}.${rawBody}`, keyed by the base64 secret. The secret env value looks like
// "v1,whsec_<base64>" (SEND_SMS_HOOK_SECRET); both prefixes are optional here.
//
//   const payload = await readStandardWebhook(req, env.sendSmsHookSecret);   // throws HttpError
//
// Missing headers → auth_required (401). A stale timestamp or a wrong signature → forbidden (403).
// Meta's X-Hub-Signature-256 is a different scheme and lives in _shared/wa/verify.ts (T44); it
// can reuse hmacSha256 and timingSafeEqual from crypto.ts.

import type { Clock } from "./clock.ts";
import { systemClock } from "./clock.ts";
import type { Bytes } from "./crypto.ts";
import { fromBase64, hmacSha256, timingSafeEqual, toBase64 } from "./crypto.ts";
import type { Secret } from "./env.ts";
import { EnvError } from "./env.ts";
import { HttpError } from "./errors.ts";
import type { ReadBodyOptions } from "./http.ts";
import { parseJson, readText } from "./http.ts";

export const STANDARD_WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export interface StandardWebhookMessage {
  id: string;
  /** Unix seconds. */
  timestamp: number;
  body: string;
}

export interface VerifyOptions {
  clock?: Clock;
  toleranceSeconds?: number;
}

/** The HMAC key from a Standard Webhooks secret ("v1,whsec_<b64>", "whsec_<b64>" or "<b64>"). */
export function webhookSecretKey(secret: string): Bytes {
  const raw = secret.trim().replace(/^v1,/, "").replace(/^whsec_/, "");
  let key: Bytes;
  try {
    key = fromBase64(raw);
  } catch {
    throw new EnvError(["webhook secret"], "is not base64 (expected v1,whsec_<base64>)");
  }
  if (key.length < 16) throw new EnvError(["webhook secret"], "is shorter than 16 bytes");
  return key;
}

/** The "v1,<base64>" signature of a message (used by tests and any internal caller). */
export async function signStandardWebhook(
  secret: string,
  msg: StandardWebhookMessage,
): Promise<string> {
  const mac = await hmacSha256(webhookSecretKey(secret), `${msg.id}.${msg.timestamp}.${msg.body}`);
  return `v1,${toBase64(mac)}`;
}

export async function verifyStandardWebhook(
  headers: Headers,
  body: string,
  secret: string | Secret | null,
  opts: VerifyOptions = {},
): Promise<void> {
  const value = typeof secret === "string" ? secret : secret?.reveal();
  if (!value) throw new EnvError(["webhook secret"], "is not set");
  const key = webhookSecretKey(value);

  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigs = headers.get("webhook-signature");
  if (!id || !ts || !sigs) {
    throw new HttpError("auth_required", "The webhook signature headers are missing.");
  }
  const timestamp = Number(ts);
  const now = Math.floor((opts.clock ?? systemClock).now().getTime() / 1000);
  const tolerance = opts.toleranceSeconds ?? STANDARD_WEBHOOK_TOLERANCE_SECONDS;
  if (!/^\d{1,12}$/.test(ts) || Math.abs(now - timestamp) > tolerance) {
    throw new HttpError("forbidden", "The webhook timestamp is outside the allowed window.");
  }
  const expected = await hmacSha256(key, `${id}.${ts}.${body}`);
  for (const entry of sigs.split(" ")) {
    const [version, sig] = entry.split(",", 2);
    if (version !== "v1" || !sig) continue;
    let given: Bytes;
    try {
      given = fromBase64(sig);
    } catch {
      continue;
    }
    if (timingSafeEqual(given, expected)) return;
  }
  throw new HttpError("forbidden", "The webhook signature does not match.");
}

/** Reads the raw body, verifies it, then parses it as JSON. */
export async function readStandardWebhook(
  req: Request,
  secret: string | Secret | null,
  opts: VerifyOptions & ReadBodyOptions = {},
): Promise<unknown> {
  const body = await readText(req, { maxBytes: opts.maxBytes ?? 256 * 1024 });
  await verifyStandardWebhook(req.headers, body, secret, opts);
  return parseJson(body);
}
