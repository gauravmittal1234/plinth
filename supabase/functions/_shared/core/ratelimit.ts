// Fixed-window rate limits (T29; BUILD_PLAN §12.8 "every webhook is rate-limited per IP and per
// sender", DATA_MODEL §10 ops.rate_limits).
//
//   const result = await enforceRateLimit(store, { bucket: "otp_phone", limit: 5, windowSeconds: 3600 },
//                                         phone, { salt });          // throws rate_limited (429)
//
// The key (an IP, a phone, a user id) is never stored: only an HMAC pseudonym keyed by
// PLINTH_HASH_SALT. Windows are aligned to the epoch, so every isolate counts in the same row.
//
// Stores:
//   MemoryRateLimitStore     tests and local runs (per isolate only)
//   rpcRateLimitStore(c)     the shared count in ops.rate_limits, through a service-only RPC.
//                            ops.rate_limits arrives with an M2 migration (handoff, T29 PR):
//
//   create table ops.rate_limits (
//     bucket text not null, key_hash text not null, window_start timestamptz not null,
//     count integer not null default 0, primary key (bucket, key_hash, window_start));
//   alter table ops.rate_limits enable row level security;
//   create function api.rate_limit_hit(p_bucket text, p_key_hash text, p_window_start timestamptz)
//   returns integer language sql volatile security definer set search_path = '' as $$
//     insert into ops.rate_limits as r (bucket, key_hash, window_start, count)
//     values (p_bucket, p_key_hash, p_window_start, 1)
//     on conflict (bucket, key_hash, window_start) do update set count = r.count + 1
//     returning r.count $$;
//   revoke all on function api.rate_limit_hit(text, text, timestamptz) from public, anon, authenticated;
//   grant execute on function api.rate_limit_hit(text, text, timestamptz) to service_role;
//   -- plus a daily delete of windows older than a day (retention-sweep or pg_cron).
//
// If the store fails, the default is to let the request through and log a warning ("allow"):
// a limiter outage must not drop WhatsApp messages. Use onStoreError: "deny" where an extra
// request costs money or reaches a person (OTP sends).

import type { Clock } from "./clock.ts";
import { systemClock } from "./clock.ts";
import { pseudonym } from "./crypto.ts";
import { HttpError } from "./errors.ts";
import type { Logger } from "./log.ts";
import { errorFields } from "./log.ts";
import type { RpcClient } from "./supabase.ts";
import { callRpc } from "./supabase.ts";

export interface RateLimitRule {
  /** Names what is limited, e.g. "otp_phone", "ask_ip", "wa_sender". */
  bucket: string;
  /** Requests allowed per window. */
  limit: number;
  windowSeconds: number;
}

export interface RateLimitStore {
  /** Adds one hit and returns the window's count including it. */
  hit(bucket: string, keyHash: string, windowStart: Date): Promise<number>;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  /** PLINTH_HASH_SALT. */
  salt: string;
  clock?: Clock;
  onStoreError?: "allow" | "deny";
  log?: Logger;
}

const BUCKET_RE = /^[a-z][a-z0-9_.:-]{1,63}$/;

export class MemoryRateLimitStore implements RateLimitStore {
  readonly #counts = new Map<string, number>();

  hit(bucket: string, keyHash: string, windowStart: Date): Promise<number> {
    const k = `${bucket}|${keyHash}|${windowStart.toISOString()}`;
    const n = (this.#counts.get(k) ?? 0) + 1;
    this.#counts.set(k, n);
    return Promise.resolve(n);
  }

  /** Rows held, for tests. */
  get size(): number {
    return this.#counts.size;
  }
}

/** The shared store: api.rate_limit_hit (service role only) over ops.rate_limits. */
export function rpcRateLimitStore(client: RpcClient, fn = "rate_limit_hit"): RateLimitStore {
  return {
    async hit(bucket, keyHash, windowStart) {
      const n = await callRpc<number>(client, fn, {
        p_bucket: bucket,
        p_key_hash: keyHash,
        p_window_start: windowStart.toISOString(),
      });
      if (typeof n !== "number" || !Number.isFinite(n)) throw new Error(`${fn} returned no count`);
      return n;
    },
  };
}

/** The start of the fixed window that contains `at`. */
export function windowStart(at: Date, windowSeconds: number): Date {
  const w = windowSeconds * 1000;
  return new Date(Math.floor(at.getTime() / w) * w);
}

export async function checkRateLimit(
  store: RateLimitStore,
  rule: RateLimitRule,
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  if (!BUCKET_RE.test(rule.bucket)) throw new Error(`rate limit: bad bucket name ${rule.bucket}`);
  if (!(rule.limit > 0 && rule.windowSeconds > 0)) {
    throw new Error("rate limit: limit and window must be > 0");
  }
  const now = (opts.clock ?? systemClock).now();
  const start = windowStart(now, rule.windowSeconds);
  const resetAt = new Date(start.getTime() + rule.windowSeconds * 1000);
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
  const keyHash = await pseudonym(`${rule.bucket}:${key}`, opts.salt);

  let count: number;
  try {
    count = await store.hit(rule.bucket, keyHash, start);
  } catch (err) {
    const allow = (opts.onStoreError ?? "allow") === "allow";
    opts.log?.warn("rate limit store failed", {
      bucket: rule.bucket,
      allowed: allow,
      ...errorFields(err),
    });
    return {
      allowed: allow,
      count: 0,
      limit: rule.limit,
      remaining: allow ? rule.limit : 0,
      resetAt,
      retryAfterSeconds,
    };
  }
  return {
    allowed: count <= rule.limit,
    count,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
    retryAfterSeconds,
  };
}

/** checkRateLimit, throwing rate_limited (429, Retry-After) when over the limit. */
export async function enforceRateLimit(
  store: RateLimitStore,
  rule: RateLimitRule,
  key: string,
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const result = await checkRateLimit(store, rule, key, opts);
  if (!result.allowed) {
    throw new HttpError("rate_limited", undefined, {
      headers: { "retry-after": String(result.retryAfterSeconds) },
    });
  }
  return result;
}
