// Contract errors for edge functions (T29; API_CONTRACTS §1 "Errors", error.schema.json).
//
// Edge functions answer { "error": { "code", "message" } } with the same codes and HTTP statuses
// as the RPCs (ops.raise_api_error, T04). `internal` (500) is the one edge-only code: it is what
// ops.raise_api_error already raises for an unknown code, and what an unexpected failure returns.
// Its message never carries the cause; the cause goes to the log.
//
// Throw an HttpError anywhere inside a handler; createHandler (handler.ts) turns it into the
// response. fromRpcError maps a PostgREST error from an api.* function to the same codes.

import type { ApiErrorCode } from "../../../../packages/contracts/gen/ts/types.ts";

export type { ApiErrorCode };
export type EdgeErrorCode = ApiErrorCode | "internal";

/** Code → HTTP status. Mirrors ops.raise_api_error and error.schema.json's RpcError rules. */
export const ERROR_STATUS = {
  not_found: 404,
  not_in_coverage: 404,
  invalid_input: 422,
  auth_required: 401,
  forbidden: 403,
  consent_required: 409,
  cap_reached: 409,
  conflict: 409,
  rate_limited: 429,
  flag_off: 503,
  internal: 500,
} as const satisfies Record<EdgeErrorCode, number>;

/** Default messages: plain sentences, no trust words (copy lint, AGENTS.md §5). */
export const DEFAULT_MESSAGE: Readonly<Record<EdgeErrorCode, string>> = {
  not_found: "We couldn't find that.",
  not_in_coverage: "We don't cover that area yet.",
  invalid_input: "Something in the request isn't right.",
  auth_required: "Sign in to do this.",
  forbidden: "You don't have access to this.",
  consent_required: "This needs your consent first.",
  cap_reached: "You've reached the limit for this.",
  conflict: "This changed while you were on it. Try again.",
  rate_limited: "Too many tries. Wait a moment and try again.",
  flag_off: "This isn't switched on right now.",
  internal: "Something went wrong on our side. Try again in a minute.",
};

export function isEdgeErrorCode(value: unknown): value is EdgeErrorCode {
  return typeof value === "string" && Object.hasOwn(ERROR_STATUS, value);
}

export interface HttpErrorOptions {
  /** Extra response headers (Retry-After, Allow, WWW-Authenticate). */
  headers?: HeadersInit;
  /** The underlying failure, for the log only. */
  cause?: unknown;
}

/** A contract error a handler can throw; createHandler renders it. */
export class HttpError extends Error {
  readonly code: EdgeErrorCode;
  readonly status: number;
  readonly headers: Headers;

  constructor(code: EdgeErrorCode, message?: string, options: HttpErrorOptions = {}) {
    super(message ?? DEFAULT_MESSAGE[code], { cause: options.cause });
    this.name = "HttpError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    this.headers = new Headers(options.headers);
  }

  /** The response body: { error: { code, message } } (ApiError, error.schema.json). */
  body(): { error: { code: EdgeErrorCode; message: string } } {
    return { error: { code: this.code, message: this.message } };
  }
}

/** The PostgREST error shape (`{ code, message, details, hint }`); supabase-js passes it through. */
export interface PostgrestErrorLike {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/**
 * A PostgREST error from an api.* function → HttpError. Contract errors (SQLSTATE PT<http>,
 * message = domain code, details = house-copy sentence) keep their code and sentence. Anything
 * else (a missing function, a permission error, a timeout) is `internal`, with the original
 * error kept as the cause for the log.
 */
export function fromRpcError(err: PostgrestErrorLike): HttpError {
  const code = err.message;
  if (typeof err.code === "string" && /^PT\d{3}$/.test(err.code) && isEdgeErrorCode(code)) {
    const sentence = typeof err.details === "string" && err.details.trim()
      ? err.details
      : undefined;
    return new HttpError(code, sentence, { cause: err });
  }
  return new HttpError("internal", undefined, { cause: err });
}
