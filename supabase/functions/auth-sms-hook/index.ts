// auth-sms-hook: POST /functions/v1/auth-sms-hook · auth: Standard Webhooks signature (T41;
// API_CONTRACTS §3.5, §5.4). Supabase Auth's Send-SMS hook.
//
// ← { "user": { "id", "phone" }, "sms": { "otp" } }   headers webhook-id, webhook-timestamp,
//                                                     webhook-signature (SEND_SMS_HOOK_SECRET)
// → 200 {}                                            the code went out (or to the mock log)
//   200 { "error": { "http_code", "message" } }       400 test number / no channel, 429 too
//                                                     many codes (5 an hour, 10 a day per
//                                                     number), 500 every channel failed
//   401 / 403                                         missing or wrong signature, stale timestamp
//   422 invalid_input                                 no user.phone or sms.otp
//   404 not_found                                     any method but POST (Allow: POST)
//   500 internal                                      configuration (names only in the log)
// Channels: WhatsApp login_code template, then MSG91 DLT SMS (sender PLINTH). All off by default:
// a real channel needs META_MODE=live, OTP_CHANNELS and its keys (_shared/otp/select.ts).
// Env: SEND_SMS_HOOK_SECRET; PLINTH_ENV, META_MODE, OTP_CHANNELS; WA_PHONE_NUMBER_ID,
// WA_ACCESS_TOKEN; MSG91_AUTH_KEY, MSG91_TEMPLATE_ID; PLINTH_HASH_SALT; SUPABASE_URL and the secret
// key (rate limits in ops.rate_limits).
// Deploy without JWT verification ([functions.auth-sms-hook] verify_jwt = false): Auth signs the
// call with the webhook secret, not a JWT.
// Logic and tests: logic.ts, logic.test.ts.

import { makeAuthSmsHook } from "./logic.ts";

Deno.serve(makeAuthSmsHook());
