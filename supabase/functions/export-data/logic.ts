// export-data: "Download my data" (DESIGN §5b; BUILD_PLAN §13; API_CONTRACTS §3.5; WORK_BREAKDOWN
// T53). Tested in logic.test.ts, zip.test.ts and pdf.test.ts.
//
// Two doors, one function:
//   POST /export-data/build   pg_cron every 15 minutes, x-plinth-dispatch-secret. Builds each open
//                             export request: api.dpdp_export_payload (that request's own user
//                             only) → ZIP (PDF + JSON) → private bucket `exports` at
//                             <request_id>/plinth-my-data.zip → api.dpdp_export_complete (7-day
//                             link, export_ready notification). One failure never stops the rest.
//   POST /export-data         the buyer's JWT, body { request_id }. api.dpdp_export_link (as the
//                             buyer) decides: the request is theirs, the file is ready and within
//                             its 7 days, and the JWT carries a sign-in code from the last
//                             10 minutes; every outcome is audited there. Then a signed URL that
//                             lives 5 minutes (never past the 7 days). The edge checks the code's
//                             age again from the token before it signs anything.
// Side effects are injected (BuildDeps, LinkDeps) so this file never touches the network.

import type { Clock } from "../_shared/core/clock.ts";
import { requireBearer, verifyDispatchSecret } from "../_shared/core/auth.ts";
import { fromBase64 } from "../_shared/core/crypto.ts";
import type { CoreEnv } from "../_shared/core/env.ts";
import { HttpError } from "../_shared/core/errors.ts";
import type { RequestContext } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import type { CorsOptions } from "../_shared/core/http.ts";
import { json } from "../_shared/core/http.ts";
import type { Logger, LogSink } from "../_shared/core/log.ts";
import { errorFields } from "../_shared/core/log.ts";
import { compileSchema, parseBodyWith } from "../_shared/core/validate.ts";
import { buildExportZip, EXPORT_FILE_NAME, parseExportPayload } from "./render.ts";
import type { StorageAdapter } from "./storage.ts";
import { SIGNED_URL_MAX_TTL_S } from "./storage.ts";

export const FN = "export-data";
export const EXPORT_BUCKET = "exports";
/** Requests built per run (the cron runs every 15 minutes). */
export const BUILD_BATCH = 10;
/** A sign-in code older than this does not open a download (app.dpdp_fresh_sign_in). */
export const FRESH_SIGN_IN_MAX_AGE_S = 600;
/** The GoTrue amr methods that mean "signed in with a code just now". */
export const SIGN_IN_CODE_METHODS: ReadonlySet<string> = new Set(["otp", "sms/signup"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The one key a request's ZIP may have (= app.dpdp_export_key in SQL). */
export function exportKey(requestId: string): string {
  if (!UUID_RE.test(requestId)) throw new Error("exportKey: not a request id");
  return `${requestId}/${EXPORT_FILE_NAME}`;
}

// ---------------------------------------------------------------------------
// The sign-in code's age, read from the token. The database makes the decision under the
// verified JWT (PostgREST); this is the edge's second look before it signs a URL.
// ---------------------------------------------------------------------------

/** The JWT's payload, unverified (callers rely on PostgREST having verified it). */
export function jwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(fromBase64(part)));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

/** Seconds since the epoch of the newest sign-in-code entry in amr, or null. */
export function lastSignInCodeAt(token: string): number | null {
  const amr = jwtPayload(token)?.amr;
  if (!Array.isArray(amr)) return null;
  let latest: number | null = null;
  for (const entry of amr) {
    const e = entry as { method?: unknown; timestamp?: unknown } | null;
    if (!e || typeof e.method !== "string" || !SIGN_IN_CODE_METHODS.has(e.method)) continue;
    if (typeof e.timestamp !== "number" || !Number.isFinite(e.timestamp)) continue;
    latest = latest === null ? e.timestamp : Math.max(latest, e.timestamp);
  }
  return latest;
}

/** True when the token carries a sign-in code from the last maxAgeS seconds (60 s skew). */
export function isFreshSignIn(
  token: string,
  now: Date,
  maxAgeS = FRESH_SIGN_IN_MAX_AGE_S,
): boolean {
  const at = lastSignInCodeAt(token);
  if (at === null) return false;
  const nowS = now.getTime() / 1000;
  return at >= nowS - maxAgeS && at <= nowS + 60;
}

/**
 * PostgREST refuses a bad or expired JWT with PGRST301/302/303, which callRpc reports as
 * `internal`; for a buyer-facing call that is auth_required (401). Other errors pass unchanged.
 */
export function jwtRejected(err: unknown): unknown {
  if (err instanceof HttpError && err.code === "internal") {
    const code = (err.cause as { code?: unknown } | undefined)?.code;
    if (typeof code === "string" && /^PGRST30\d$/.test(code)) {
      return new HttpError("auth_required", undefined, { cause: err.cause });
    }
  }
  return err;
}

// ---------------------------------------------------------------------------
// Build (dispatch secret).
// ---------------------------------------------------------------------------

export interface BuildDeps {
  /** api.dpdp_export_pending → request ids, oldest first. */
  pending(limit: number): Promise<string[]>;
  /** api.dpdp_export_payload(request_id). */
  payload(requestId: string): Promise<unknown>;
  /** api.dpdp_export_complete(request_id, key, bytes, sha256). */
  complete(requestId: string, key: string, bytes: number, sha256: string): Promise<unknown>;
  storage: Pick<StorageAdapter, "upload">;
  log: Logger;
}

export interface BuildSummary {
  pending: number;
  built: number;
  failed: number;
}

export async function runBuild(deps: BuildDeps, limit = BUILD_BATCH): Promise<BuildSummary> {
  const ids = await deps.pending(limit);
  const summary: BuildSummary = { pending: ids.length, built: 0, failed: 0 };
  for (const id of ids) {
    try {
      const payload = parseExportPayload(await deps.payload(id), id);
      const { bytes, sha256 } = await buildExportZip(payload);
      const key = exportKey(id);
      await deps.storage.upload(EXPORT_BUCKET, key, bytes, "application/zip");
      await deps.complete(id, key, bytes.length, sha256);
      summary.built++;
    } catch (err) {
      summary.failed++;
      deps.log.error("export build failed", { request_id: id, ...errorFields(err) });
    }
  }
  return summary;
}

/** Reads api.dpdp_export_pending's answer. */
export function parsePending(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("api.dpdp_export_pending did not return an array");
  return value
    .map((x) => (x as { request_id?: unknown } | null)?.request_id)
    .filter((id): id is string => typeof id === "string" && UUID_RE.test(id));
}

// ---------------------------------------------------------------------------
// Open the download (buyer JWT + a fresh sign-in code).
// ---------------------------------------------------------------------------

export interface LinkAnswer {
  request_id: string;
  status: "preparing" | "expired" | "sign_in_required" | "ready";
  line: string;
  export_key: string | null;
  link_expires_at: string | null;
}

export interface LinkDeps {
  /** api.dpdp_export_link(request_id) under the buyer's own JWT. */
  link(requestId: string): Promise<unknown>;
  storage: Pick<StorageAdapter, "signedUrl">;
  now(): Date;
}

export interface LinkResponse {
  request_id: string;
  status: "ready";
  url: string;
  url_expires_at: string;
  link_expires_at: string;
  line: string;
}

export const LINK_BODY_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  required: ["request_id"],
  properties: { request_id: { type: "string", format: "uuid" } },
} as const;

function parseLinkAnswer(value: unknown): LinkAnswer {
  const v = value as Partial<LinkAnswer> | null;
  const statuses = ["preparing", "expired", "sign_in_required", "ready"];
  if (
    !v || typeof v.status !== "string" || !statuses.includes(v.status) || typeof v.line !== "string"
  ) {
    throw new Error("api.dpdp_export_link returned an unexpected shape");
  }
  return v as LinkAnswer;
}

const STEP_UP =
  'Bearer error="insufficient_user_authentication", error_description="fresh sign-in code required"';

export async function openLink(
  deps: LinkDeps,
  token: string,
  requestId: string,
): Promise<LinkResponse> {
  const answer = parseLinkAnswer(await deps.link(requestId));
  switch (answer.status) {
    case "preparing":
      throw new HttpError("conflict", answer.line);
    case "expired":
      throw new HttpError("not_found", answer.line);
    case "sign_in_required":
      throw new HttpError("auth_required", answer.line, {
        headers: { "www-authenticate": STEP_UP },
      });
  }

  const now = deps.now();
  // Second look: the database said ready, so the token must carry a fresh code here too.
  if (!isFreshSignIn(token, now)) {
    throw new HttpError("auth_required", "Enter a fresh sign-in code to open your download.", {
      headers: { "www-authenticate": STEP_UP },
    });
  }
  const until = answer.link_expires_at ? new Date(answer.link_expires_at) : null;
  if (
    !answer.export_key || answer.export_key !== exportKey(requestId) || !until ||
    Number.isNaN(until.getTime())
  ) {
    throw new Error("api.dpdp_export_link: ready without a valid key or expiry");
  }
  const ttl = Math.min(SIGNED_URL_MAX_TTL_S, Math.floor((until.getTime() - now.getTime()) / 1000));
  if (ttl < 1) {
    throw new HttpError("not_found", "This download link has expired. Request a new download.");
  }

  const url = await deps.storage.signedUrl(EXPORT_BUCKET, answer.export_key, ttl, EXPORT_FILE_NAME);
  return {
    request_id: requestId,
    status: "ready",
    url,
    url_expires_at: new Date(now.getTime() + ttl * 1000).toISOString(),
    link_expires_at: answer.link_expires_at!,
    line: answer.line,
  };
}

// ---------------------------------------------------------------------------
// The deployed function.
// ---------------------------------------------------------------------------

export interface MakeExportDataOptions {
  buildDeps(ctx: RequestContext): BuildDeps;
  linkDeps(ctx: RequestContext, token: string): LinkDeps;
  env?: CoreEnv | (() => CoreEnv);
  clock?: Clock;
  /** Tests capture the access and error lines here. */
  sink?: LogSink;
  cors?: CorsOptions;
}

export function makeExportData(opts: MakeExportDataOptions): (req: Request) => Promise<Response> {
  return createHandler(
    FN,
    async (req, ctx) => {
      const path = new URL(req.url).pathname.replace(/\/+$/, "");
      if (path.endsWith(`/${FN}/build`)) {
        await verifyDispatchSecret(req, ctx.env.dispatchSecret);
        await req.body?.cancel();
        const summary = await runBuild(opts.buildDeps(ctx));
        ctx.log.info("export build", { ...summary });
        return json(summary);
      }
      if (!path.endsWith(`/${FN}`)) throw new HttpError("not_found");

      const token = requireBearer(req);
      const body = await parseBodyWith<{ request_id: string }>(
        req,
        await compileSchema(LINK_BODY_SCHEMA),
        { maxBytes: 1024 },
      );
      const result = await openLink(opts.linkDeps(ctx, token), token, body.request_id);
      const sub = jwtPayload(token)?.sub;
      if (typeof sub === "string") await ctx.identify(sub);
      ctx.log.info("export link signed", { request_id: result.request_id });
      return json(result);
    },
    { methods: ["POST"], env: opts.env, clock: opts.clock, sink: opts.sink, cors: opts.cors },
  );
}
