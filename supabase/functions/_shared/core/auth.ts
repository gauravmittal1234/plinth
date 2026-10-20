// Machine and user credentials at the edge (T29; API_CONTRACTS §5.5, BUILD_PLAN §12.5, §12.8).
//
//   verifyDispatchSecret(req, env.dispatchSecret)
//       pg_cron / pg_net → outbox-dispatch, retention-sweep. Header x-plinth-dispatch-secret,
//       compared in constant time. Missing header → auth_required (401); wrong → forbidden (403);
//       secret not configured → EnvError (500). It never accepts a request when unset.
//   requireBearer(req)
//       The user's JWT for buyer-scoped functions (pass it to userClient in supabase.ts).
//
// These functions are deployed with verify_jwt = false (config.toml [functions.<name>]) because
// they check their own credentials.

import { timingSafeEqualText } from "./crypto.ts";
import type { Secret } from "./env.ts";
import { EnvError } from "./env.ts";
import { HttpError } from "./errors.ts";
import { bearerToken } from "./http.ts";

export const DISPATCH_SECRET_HEADER = "x-plinth-dispatch-secret";

export async function verifyDispatchSecret(req: Request, expected: Secret | null): Promise<void> {
  const secret = expected?.reveal();
  if (!secret) throw new EnvError(["PLINTH_DISPATCH_SECRET"], "is not set");
  const given = req.headers.get(DISPATCH_SECRET_HEADER);
  if (!given) throw new HttpError("auth_required", "This endpoint needs the dispatch secret.");
  if (!(await timingSafeEqualText(given, secret))) {
    throw new HttpError("forbidden", "The dispatch secret does not match.");
  }
}

/** The caller's bearer token, or auth_required (401). */
export function requireBearer(req: Request): string {
  const token = bearerToken(req);
  if (!token) throw new HttpError("auth_required");
  return token;
}
