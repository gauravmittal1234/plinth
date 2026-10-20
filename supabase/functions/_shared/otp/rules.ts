// OTP rules and phone helpers (T41; fix-trust.md "OTP rules", API_CONTRACTS §5.4).
//
//   The code lasts 10 minutes; a new code after 30 seconds   Auth enforces both
//                                                            (config.toml [auth.sms] otp_expiry,
//                                                            max_frequency); the WhatsApp template
//                                                            and the SMS text say the same
//   WhatsApp template text as in WaAlerts                    whatsapp.ts (login_code)
//   SMS sender "PLINTH"                                      msg91.ts (bound to the DLT template)
//   Per-number limits: 5 codes an hour, 10 a day             OTP_RATE_LIMITS, ops.rate_limits
//
// Test numbers: the fixture block +91 99000 003NN (packages/fixtures/canonical/people.json
// test_phones) is never sent to a provider, in any environment.

import type { RateLimitRule } from "../core/ratelimit.ts";

export const OTP_RULES = {
  /** Digits in a code (config.toml [auth.sms] otp_length). */
  codeLength: 6,
  /** A code lasts 10 minutes (config.toml [auth.sms] otp_expiry). */
  ttlSeconds: 600,
  /** A new code only after 30 seconds (config.toml [auth.sms] max_frequency). */
  resendAfterSeconds: 30,
  /** The SMS sender header, registered with TRAI DLT and bound to the MSG91 template. */
  smsSender: "PLINTH",
} as const;

/** Per phone number, on top of Auth's per-IP limits ([auth.rate_limit]). */
export const OTP_RATE_LIMITS: readonly RateLimitRule[] = [
  { bucket: "otp_phone_hour", limit: 5, windowSeconds: 60 * 60 },
  { bucket: "otp_phone_day", limit: 10, windowSeconds: 24 * 60 * 60 },
];

const E164 = /^\+[1-9]\d{7,14}$/;
/** The fixture-only block +91 99000 003NN. */
const TEST_BLOCK = /^\+9199000003\d{2}$/;

/** Auth stores the phone as digits without "+"; returns E.164 ("+91…"), or null. */
export function toE164(phone: string): string | null {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  const e164 = compact.startsWith("+") ? compact : `+${compact}`;
  return E164.test(e164) ? e164 : null;
}

/** True for the fixture test block +91 99000 003NN (never a real person). */
export function isTestNumber(e164: string): boolean {
  return TEST_BLOCK.test(e164);
}

/** True for a +91 number with ten digits: the only numbers DLT SMS reaches. */
export function isIndianNumber(e164: string): boolean {
  return /^\+91\d{10}$/.test(e164);
}

/** A code as Auth generates it: digits only. */
export function isOtpCode(code: string): boolean {
  return /^\d{4,10}$/.test(code);
}

/** "+91 99••• ••318": the masked form the product shows (DATA_MODEL app.profiles). */
export function maskPhone(e164: string): string {
  const m = /^\+91(\d{2})\d{5}(\d{3})$/.exec(e164);
  if (m) return `+91 ${m[1]}••• ••${m[2]}`;
  return `${e164.slice(0, 3)}••••${e164.slice(-3)}`;
}
