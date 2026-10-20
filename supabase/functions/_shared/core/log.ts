// JSON-lines logger with a request id (T29; BUILD_PLAN §11 "Logs").
//
// One JSON object per line: { ts, level, fn, request_id, msg, user_hash?, latency_ms?, ...fields }.
// Supabase's log explorer indexes these. Two guards keep personal data and secrets out:
//   - redaction by field name: a field whose name has a sensitive word (phone, email, otp, token,
//     secret, password, authorization, cookie, signature, jwt, aadhaar, pan, *_key) is replaced
//     by "[redacted]", however deep it sits;
//   - scrubbing by shape: in the message and every string value, phone numbers, emails, JWTs,
//     Supabase keys and bearer tokens are masked.
// Neither replaces judgement: never log a request body, a query string or an OTP.

import type { Clock } from "./clock.ts";
import { systemClock } from "./clock.ts";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Readonly<Record<string, unknown>>;
export type LogSink = (level: LogLevel, line: string) => void;

const RANK: Readonly<Record<LogLevel, number>> = { debug: 10, info: 20, warn: 30, error: 40 };

export const consoleSink: LogSink = (level, line) => {
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (level === "debug") console.debug(line);
  else console.log(line);
};

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** A logger that adds these fields to every line (e.g. user_hash). */
  child(fields: LogFields): Logger;
}

export interface LoggerOptions {
  fn: string;
  requestId?: string;
  sink?: LogSink;
  minLevel?: LogLevel;
  clock?: Clock;
  fields?: LogFields;
}

const SENSITIVE_WORDS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "apikey",
  "otp",
  "phone",
  "mobile",
  "msisdn",
  "email",
  "aadhaar",
  "pan",
  "jwt",
  "signature",
  "bearer",
]);
const SENSITIVE_PAIRS = [["api", "key"], ["private", "key"], ["secret", "key"], ["access", "key"]];

/** Splits snake_case, kebab-case and camelCase names into lower-case words. */
function words(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** True for a field name that may hold personal data or a credential. */
export function isSensitiveKey(name: string): boolean {
  const w = words(name);
  if (w.some((x) => SENSITIVE_WORDS.has(x))) return true;
  return SENSITIVE_PAIRS.some(([a, b]) => w.some((x, i) => x === a && w[i + 1] === b));
}

const SCRUBBERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]"],
  [/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[jwt]"],
  [/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[key]"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, "[email]"],
  [/\+\d[\d -]{8,16}\d\b/g, "[phone]"],
  [/\b(?:91)?[6-9]\d{9}\b/g, "[phone]"],
];

/** Masks phone numbers, emails, JWTs, Supabase keys and bearer tokens in free text. */
export function scrub(text: string): string {
  let out = text;
  for (const [re, mask] of SCRUBBERS) out = out.replace(re, mask);
  return out;
}

const MAX_DEPTH = 6;
const MAX_STRING = 2000;

/** A log-safe copy of a value: sensitive names redacted, strings scrubbed, cycles cut. */
export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    const s = scrub(value);
    return s.length > MAX_STRING ? `${s.slice(0, MAX_STRING)}…` : s;
  }
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") {
    return typeof value === "function" || typeof value === "symbol" ? String(value) : value;
  }
  if (value instanceof Error) return errorFields(value);
  if (value instanceof Date) return value.toISOString();
  if (seen.has(value)) return "[circular]";
  if (depth >= MAX_DEPTH) return "[deep]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = isSensitiveKey(k) ? "[redacted]" : redact(v, depth + 1, seen);
  }
  return out;
}

/** Log fields for a caught error: its name, a scrubbed message, a PostgREST code if any. */
export function errorFields(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    const out: Record<string, unknown> = {
      error_name: err.name,
      error_message: scrub(err.message).slice(0, 500),
    };
    if (typeof code === "string" || typeof code === "number") out.error_code = code;
    if (err.cause !== undefined) out.error_cause = causeFields(err.cause);
    return out;
  }
  if (err && typeof err === "object") return { error_cause: causeFields(err) };
  return { error_message: scrub(String(err)).slice(0, 500) };
}

function causeFields(cause: unknown): unknown {
  if (cause instanceof Error) {
    return { name: cause.name, message: scrub(cause.message).slice(0, 500) };
  }
  if (cause && typeof cause === "object") {
    const { code, message, hint } = cause as Record<string, unknown>;
    return redact({ code, message, hint });
  }
  return redact(cause);
}

export function createLogger(opts: LoggerOptions): Logger {
  const sink = opts.sink ?? consoleSink;
  const min = RANK[opts.minLevel ?? "info"];
  const clock = opts.clock ?? systemClock;
  const base: LogFields = opts.fields ?? {};

  const write = (level: LogLevel, msg: string, fields?: LogFields) => {
    if (RANK[level] < min) return;
    const extra = redact({ ...base, ...fields }) as Record<string, unknown>;
    const record = {
      ts: clock.now().toISOString(),
      level,
      fn: opts.fn,
      request_id: opts.requestId ?? null,
      msg: scrub(msg),
      ...extra,
    };
    let line: string;
    try {
      line = JSON.stringify(record);
    } catch {
      const { ts, fn, request_id } = record;
      line = JSON.stringify({
        ts,
        level,
        fn,
        request_id,
        msg: record.msg,
        fields: "[unserialisable]",
      });
    }
    sink(level, line);
  };

  return {
    debug: (msg, fields) => write("debug", msg, fields),
    info: (msg, fields) => write("info", msg, fields),
    warn: (msg, fields) => write("warn", msg, fields),
    error: (msg, fields) => write("error", msg, fields),
    child: (fields) => createLogger({ ...opts, fields: { ...base, ...fields } }),
  };
}
