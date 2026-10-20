// auth-sms-hook: Supabase Auth's Send-SMS hook (T41; API_CONTRACTS §3.5, §5.4). Tested in
// logic.test.ts.
//
// Auth answers a user from the hook's reply, so the outcomes are:
//   delivered                       200 {}
//   a refusal the user should see   200 { "error": { "http_code": 400 | 429 | 500, "message" } }
//                                   Auth returns that status and sentence to the app. Never an
//                                   HTTP 429/503: Auth retries those when Retry-After is set.
//   a bad call                      401/403 (signature), 422 (payload), 500 (configuration);
//                                   Auth turns them into a generic error.
//
// Order: verify the signature → read the payload → pick the channels (test numbers never reach a
// provider) → per-number limits (ops.rate_limits, deny when the store is down) → send, WhatsApp
// first, then SMS. The code and the number are never logged (mock.ts in local excepted).

import type { CoreEnv, EnvSource, Secret } from "../_shared/core/env.ts";
import { EnvError, isDevEnv, processEnv, readSecret } from "../_shared/core/env.ts";
import { HttpError } from "../_shared/core/errors.ts";
import type { Handler, HandlerOptions } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import { json } from "../_shared/core/http.ts";
import type { RateLimitStore } from "../_shared/core/ratelimit.ts";
import { checkRateLimit, rpcRateLimitStore } from "../_shared/core/ratelimit.ts";
import { secretClient } from "../_shared/core/supabase.ts";
import { readStandardWebhook } from "../_shared/core/webhooks.ts";
import { sendWithFallback } from "../_shared/otp/adapter.ts";
import { isOtpCode, OTP_RATE_LIMITS, toE164 } from "../_shared/otp/rules.ts";
import type { OtpConfig } from "../_shared/otp/select.ts";
import { readOtpConfig, selectAdapters } from "../_shared/otp/select.ts";

export const FN = "auth-sms-hook";

/** Sentences Auth passes to the sign-in screen (house copy: plain, no trust words). */
export const HOOK_MESSAGES = {
  testNumber: "This number can't receive sign-in codes.",
  noChannel: "We can't send a code to this number yet.",
  sendFailed: "We couldn't send your code. Try again in a minute.",
} as const;

export function tooManyCodes(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  const wait = minutes >= 120
    ? `${Math.ceil(minutes / 60)} hours`
    : `${minutes} minute${minutes === 1 ? "" : "s"}`;
  return `Too many codes for this number. Try again in ${wait}.`;
}

/** The Supabase hook error reply: HTTP 200 carrying the status Auth should answer with. */
export function hookError(httpCode: 400 | 429 | 500, message: string): Response {
  return json({ error: { http_code: httpCode, message } });
}

export interface SendSmsInput {
  userId: string | null;
  /** E.164. */
  phone: string;
  code: string;
}

/** Reads Auth's payload: { user: { id, phone }, sms: { otp } }. */
export function parseSendSmsPayload(payload: unknown): SendSmsInput {
  const p = payload as { user?: { id?: unknown; phone?: unknown }; sms?: { otp?: unknown } } | null;
  const phone = typeof p?.user?.phone === "string" ? toE164(p.user.phone) : null;
  const code = typeof p?.sms?.otp === "string" && isOtpCode(p.sms.otp) ? p.sms.otp : null;
  if (!phone || !code) {
    throw new HttpError("invalid_input", "The hook payload needs user.phone and sms.otp.");
  }
  const id = p?.user?.id;
  return { userId: typeof id === "string" && id ? id : null, phone, code };
}

export interface AuthSmsHookDeps {
  /** SEND_SMS_HOOK_SECRET, OTP_CHANNELS and the provider variables. Default: Deno.env. */
  envSource?: EnvSource;
  /** Default: readSecret(envSource, "SEND_SMS_HOOK_SECRET"). */
  hookSecret?: string | Secret | null;
  /** Default: readOtpConfig(envSource). */
  otpConfig?: OtpConfig;
  /** Default: ops.rate_limits through api.rate_limit_hit (secret key). */
  rateLimitStore?: RateLimitStore;
  /** Provider calls. Default: global fetch. */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

/** A public salt for local and test only; elsewhere PLINTH_HASH_SALT must be set. */
const DEV_SALT = "plinth-unsalted";

function rateLimitSalt(env: CoreEnv): string {
  const salt = env.hashSalt?.reveal();
  if (salt) return salt;
  if (isDevEnv(env.plinthEnv)) return DEV_SALT;
  throw new EnvError(["PLINTH_HASH_SALT"], "must be set to rate-limit sign-in codes");
}

export function authSmsHookHandler(deps: AuthSmsHookDeps = {}): Handler {
  const src = deps.envSource ?? processEnv;
  let otpConfig = deps.otpConfig ?? null;

  return async (req, ctx) => {
    const secret = deps.hookSecret !== undefined
      ? deps.hookSecret
      : readSecret(src, "SEND_SMS_HOOK_SECRET");
    const payload = await readStandardWebhook(req, secret, { clock: ctx.clock });
    const input = parseSendSmsPayload(payload);
    if (input.userId) await ctx.identify(input.userId);

    otpConfig ??= readOtpConfig(src);
    const selection = selectAdapters(ctx.env, otpConfig, input.phone, {
      fetch: deps.fetch,
      timeoutMs: deps.timeoutMs,
    });
    if (!selection.ok) {
      ctx.log.warn("login code refused", { refusal: selection.refusal });
      return selection.refusal === "test_number"
        ? hookError(400, HOOK_MESSAGES.testNumber)
        : hookError(400, HOOK_MESSAGES.noChannel);
    }

    const store = deps.rateLimitStore ??
      rpcRateLimitStore(secretClient(ctx.env.supabase, { requestId: ctx.requestId, fn: ctx.fn }));
    const salt = rateLimitSalt(ctx.env);
    for (const rule of OTP_RATE_LIMITS) {
      const limit = await checkRateLimit(store, rule, input.phone, {
        salt,
        clock: ctx.clock,
        onStoreError: "deny",
        log: ctx.log,
      });
      if (!limit.allowed) {
        ctx.log.warn("login code rate limited", { bucket: rule.bucket, limit: rule.limit });
        return hookError(429, tooManyCodes(limit.retryAfterSeconds));
      }
    }

    try {
      const sent = await sendWithFallback(
        selection.adapters,
        { to: input.phone, code: input.code },
        ctx.log,
      );
      ctx.log.info("login code sent", {
        mode: selection.mode,
        channel: sent.channel,
        attempts: sent.attempts,
        provider_id: sent.providerId,
      });
    } catch (err) {
      ctx.log.error("login code not sent", {
        mode: selection.mode,
        attempts: selection.adapters.map((a) => a.channel),
        error_name: err instanceof Error ? err.name : "unknown",
      });
      return hookError(500, HOOK_MESSAGES.sendFailed);
    }
    return json({});
  };
}

export interface MakeAuthSmsHookOptions extends Omit<HandlerOptions, "methods">, AuthSmsHookDeps {}

/** The deployed function: POST only, wrapped by createHandler. */
export function makeAuthSmsHook(
  opts: MakeAuthSmsHookOptions = {},
): (req: Request) => Promise<Response> {
  const {
    envSource,
    hookSecret,
    otpConfig,
    rateLimitStore,
    fetch,
    timeoutMs,
    ...handlerOptions
  } = opts;
  return createHandler(
    FN,
    authSmsHookHandler({ envSource, hookSecret, otpConfig, rateLimitStore, fetch, timeoutMs }),
    { ...handlerOptions, methods: ["POST"] },
  );
}
