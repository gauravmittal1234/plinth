// Domain errors from the API (API_CONTRACTS §1 "Errors"). Functions raise
// SQLSTATE PT<http> with `message` = one of these codes and `details` = a human
// sentence in house copy. Stub from T05; T16 maps PostgREST errors onto it.

export const ERROR_CODES = [
  "not_found",
  "not_in_coverage",
  "invalid_input",
  "auth_required",
  "forbidden",
  "consent_required",
  "cap_reached",
  "conflict",
  "rate_limited",
  "flag_off",
  // Skeleton only: the function's signature exists, its adapter arrives with T16.
  "not_implemented",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export class DataError extends Error {
  readonly code: ErrorCode;
  /** The api.* function that failed, e.g. "risk_summary". */
  readonly rpc: string;

  constructor(code: ErrorCode, rpc: string, message: string) {
    super(message);
    this.name = "DataError";
    this.code = code;
    this.rpc = rpc;
  }
}

export function isDataError(e: unknown, code?: ErrorCode): e is DataError {
  return e instanceof DataError && (code === undefined || e.code === code);
}
