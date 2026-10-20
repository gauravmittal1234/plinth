// Domain errors from the API (API_CONTRACTS §1 "Errors"). RPCs raise SQLSTATE
// PT<http> through ops.raise_api_error() (T04): PostgREST answers with
// { code: "PT404", message: "not_found", details: "<house-copy sentence>" }.
// Every adapter rejects with a DataError, so pages branch on `code` only
// (`isDataError(e, "not_found")` → notFound()), whichever adapter served them.

/** The contract codes (packages/contracts error.schema.json ApiErrorCode), with their HTTP status. */
export const API_ERROR_STATUS = {
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
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_STATUS;

/** Codes the web adds for failures that never come from an api.* function. */
export const CLIENT_ERROR_CODES = [
  // The api.* function does not exist on this backend yet (PostgREST PGRST202).
  "not_implemented",
  // Fixture mode has no expected payload for these arguments (packages/fixtures/expected).
  "fixture_missing",
  // A payload broke its contract schema (dev and test only, see validate.ts).
  "bad_response",
  // Network failure, timeout or a 5xx without a contract code.
  "unavailable",
  // Anything else PostgREST or the client library reported.
  "internal",
] as const;

export const ERROR_CODES = [
  ...(Object.keys(API_ERROR_STATUS) as ApiErrorCode[]),
  ...CLIENT_ERROR_CODES,
] as const;

export type ErrorCode = ApiErrorCode | (typeof CLIENT_ERROR_CODES)[number];

/** A DataError as plain data: what crosses a `"use cache"` boundary (cache.ts). */
export type DataErrorShape = {
  code: ErrorCode;
  rpc: string;
  message: string;
  status: number;
};

export class DataError extends Error {
  readonly code: ErrorCode;
  /** The api.* function that failed, e.g. "risk_summary". */
  readonly rpc: string;
  /** HTTP status the error maps to (the PT<http> status for contract codes). */
  readonly status: number;

  /** `message` is the server's house-copy sentence when the API sent one. */
  constructor(code: ErrorCode, rpc: string, message: string, status = statusOf(code)) {
    super(message);
    this.name = "DataError";
    this.code = code;
    this.rpc = rpc;
    this.status = status;
  }

  toShape(): DataErrorShape {
    return { code: this.code, rpc: this.rpc, message: this.message, status: this.status };
  }

  static fromShape(shape: DataErrorShape): DataError {
    return new DataError(shape.code, shape.rpc, shape.message, shape.status);
  }
}

export function isDataError(e: unknown, code?: ErrorCode): e is DataError {
  return e instanceof DataError && (code === undefined || e.code === code);
}

export function isApiErrorCode(code: unknown): code is ApiErrorCode {
  return typeof code === "string" && Object.hasOwn(API_ERROR_STATUS, code);
}

function statusOf(code: ErrorCode): number {
  if (isApiErrorCode(code)) return API_ERROR_STATUS[code];
  switch (code) {
    case "not_implemented":
      return 501;
    case "fixture_missing":
      return 404;
    case "unavailable":
      return 503;
    default:
      return 500;
  }
}

/** The error half of a PostgREST response (supabase-js `PostgrestError`, or its plain shape). */
export type PostgrestErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

/**
 * Maps a PostgREST error to a DataError.
 *
 * - `PT<http>` + a contract code in `message` → that code; the message is
 *   `details` (the house-copy sentence) when present.
 * - `PGRST202` (no such function in the schema cache) → not_implemented: the
 *   api.* function lands with a later task.
 * - JWT errors (`PGRST301`, `PGRST302`) → auth_required; `42501` → forbidden.
 * - No code and HTTP status 0 (fetch failed, timeout) or a 5xx → unavailable.
 */
export function fromPostgrestError(
  rpc: string,
  error: PostgrestErrorLike,
  httpStatus?: number,
): DataError {
  const code = error.code ?? "";
  const message = error.message ?? "";
  const details = error.details?.trim() || null;

  if (/^PT\d{3}$/.test(code) && isApiErrorCode(message)) {
    return new DataError(message, rpc, details ?? message, Number(code.slice(2)));
  }
  if (code === "PGRST202") {
    return new DataError(
      "not_implemented",
      rpc,
      `api.${rpc} does not exist on this backend yet: ${message}`,
    );
  }
  if (code === "PGRST301" || code === "PGRST302" || code === "PGRST303") {
    return new DataError("auth_required", rpc, message || "Sign in again.");
  }
  if (code === "42501") return new DataError("forbidden", rpc, message);
  if (!code && (!httpStatus || httpStatus >= 500)) {
    return new DataError(
      "unavailable",
      rpc,
      `api.${rpc} could not be reached: ${message || "no response"}`,
    );
  }
  return new DataError(
    "internal",
    rpc,
    `api.${rpc} failed (${code || httpStatus || "?"}): ${message}`,
    httpStatus && httpStatus >= 400 ? httpStatus : 500,
  );
}
