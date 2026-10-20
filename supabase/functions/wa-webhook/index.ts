// wa-webhook: GET/POST /functions/v1/wa-webhook (API_CONTRACTS §5.1) · auth: Meta's signature (T44).
//
// GET  ?hub.mode=subscribe&hub.verify_token=<WA_VERIFY_TOKEN>&hub.challenge=<n>
//      → 200 text/plain <n> · 403 forbidden when the token does not match
// POST Meta's { "object": "whatsapp_business_account", "entry": [ … ] } with X-Hub-Signature-256
//      → 200 { "ok": true } within ~1 s; routing runs after the response (waitUntil)
//      → 403 forbidden          missing or wrong signature (nothing is stored)
//      → 503 flag_off           the wa_inbound kill switch is off (Meta redelivers later)
//      → 422 invalid_input      a signed body that is not JSON, or over 1 MiB
// POST /wa-webhook/sweep with x-plinth-dispatch-secret (pg_cron, every minute)
//      → 200 { "ok": true, "claimed", "routed", "failed" } · 401/403 without the secret
// Env: WA_APP_SECRET, WA_VERIFY_TOKEN, WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN (live sends only),
// PLINTH_JWT_SECRET (tap tokens; else SUPABASE_JWT_SECRET), PLINTH_DISPATCH_SECRET, META_MODE
// (default mock), SUPABASE_URL and keys (the platform injects them).
// Deploy without JWT verification (config.toml [functions.wa-webhook] verify_jwt = false): Meta
// sends no Supabase token; the function checks Meta's signature itself.
// Logic and tests: logic.ts, router.ts, logic.test.ts; handlers/* (T46a, T46b).

import { makeWaWebhook } from "./logic.ts";

Deno.serve(makeWaWebhook());
