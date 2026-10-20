// _shared/otp: login-code delivery for the Send-SMS auth hook (T41). Owner: T41.
//
//   Functions take readOtpConfig, selectAdapters and sendWithFallback from _shared/otp/mod.ts.
//
//   rules.ts     OTP rules (10 min, 30 s, sender PLINTH), per-number limits, phone helpers
//   adapter.ts   OtpAdapter, OtpSendError, postJson (timeout), sendWithFallback
//   select.ts    OTP_CHANNELS + META_MODE → the adapters for a number (all real channels off by
//                default; fixture test numbers never reach a provider)
//   mock.ts      logs only; the code appears in the log only when PLINTH_ENV=local
//   whatsapp.ts  the login_code AUTHENTICATION template through the Graph API
//   msg91.ts     DLT SMS through MSG91's Flow API (+91 only)
//
// Nothing here logs, returns or throws a phone number or a code (mock in local excepted).

export * from "./adapter.ts";
export * from "./mock.ts";
export * from "./msg91.ts";
export * from "./rules.ts";
export * from "./select.ts";
export * from "./whatsapp.ts";
