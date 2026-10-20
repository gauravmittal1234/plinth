// Signed Standard Webhooks requests for tests (Supabase Auth hooks, T41).
// The secret is random per test run, so no webhook secret is ever written into the repo.

import type { Clock } from "../core/clock.ts";
import { systemClock } from "../core/clock.ts";
import { toBase64 } from "../core/crypto.ts";
import { signStandardWebhook } from "../core/webhooks.ts";
import { fakeRequest } from "./request.ts";

/** A fresh secret in Supabase's format: "v1,whsec_<base64 of 32 random bytes>". */
export function randomWebhookSecret(): string {
  return `v1,whsec_${toBase64(crypto.getRandomValues(new Uint8Array(32)))}`;
}

export interface SignedWebhookOptions {
  clock?: Clock;
  id?: string;
  path?: string;
}

/** A POST carrying `body` with valid webhook-id / -timestamp / -signature headers. */
export async function signedWebhook(
  secret: string,
  body: unknown,
  opts: SignedWebhookOptions = {},
): Promise<Request> {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const id = opts.id ?? `msg_${crypto.randomUUID()}`;
  const timestamp = Math.floor((opts.clock ?? systemClock).now().getTime() / 1000);
  const signature = await signStandardWebhook(secret, { id, timestamp, body: raw });
  return fakeRequest(opts.path ?? "hook", {
    method: "POST",
    body: raw,
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(timestamp),
      "webhook-signature": signature,
    },
  });
}
