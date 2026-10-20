// delete-account: erasure with legal-hold rules (BUILD_PLAN §13; API_CONTRACTS §3.5, the pet_app
// pattern; WORK_BREAKDOWN T53). Tested in logic.test.ts. finishErasure is shared with
// retention-sweep, which finishes any erasure a call left half done.
//
// Order (pet_app: "any failure stops before the sign-in is deleted, so the person can try again"):
//   1. api.account_delete_request()        under the buyer's own JWT: the record (T45b). It is
//                                          the only way this function learns which account to
//                                          erase, so a buyer can only ever erase their own.
//   2. api.dpdp_erasure_run(request)        service: the account data goes in one transaction;
//                                          the consent proof stays under legal hold; returns the
//                                          files still to remove and the user id.
//   3. Storage API remove                  the user's uploads, voice notes and export ZIPs.
//   4. auth.admin.deleteUser(id, true)      only once the files are gone: a soft delete, so GoTrue
//                                          obfuscates the phone and email, clears the metadata,
//                                          ends every session, and the kept consent rows point
//                                          at an identity that names no one.
//   5. api.dpdp_erasure_complete(…)         records steps 3 and 4; when both are done the
//                                          request is completed and stops naming the account.
// The response confirms only what the records say (AGENTS.md rule 9): the request (always) and
// the erasure record (status erasing | erased).

import type { Clock } from "../_shared/core/clock.ts";
import { requireBearer } from "../_shared/core/auth.ts";
import type { CoreEnv } from "../_shared/core/env.ts";
import { HttpError } from "../_shared/core/errors.ts";
import type { RequestContext } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import type { CorsOptions } from "../_shared/core/http.ts";
import { json, parseJson, readText } from "../_shared/core/http.ts";
import type { Logger, LogSink } from "../_shared/core/log.ts";
import { errorFields } from "../_shared/core/log.ts";
import { check, compileSchema } from "../_shared/core/validate.ts";
import type { StorageAdapter, StorageObject } from "../export-data/storage.ts";
import { batchesByBucket } from "../export-data/storage.ts";

export const FN = "delete-account";
export type ErasureChannel = "web" | "app";

export interface ErasureRun {
  request_id: string;
  user_id: string | null;
  status: "erasing" | "erased";
  storage_objects: StorageObject[];
  record: Record<string, unknown>;
}

/** Narrows api.dpdp_erasure_run's answer. */
export function parseErasureRun(value: unknown): ErasureRun {
  const v = value as Partial<ErasureRun> | null;
  if (
    !v || typeof v.request_id !== "string" || (v.status !== "erasing" && v.status !== "erased") ||
    !Array.isArray(v.storage_objects) || !v.record || typeof v.record !== "object"
  ) {
    throw new Error("api.dpdp_erasure_run returned an unexpected shape");
  }
  const objects = v.storage_objects.filter((o): o is StorageObject =>
    !!o && typeof o === "object" && typeof (o as StorageObject).bucket === "string" &&
    typeof (o as StorageObject).key === "string"
  );
  if (objects.length !== v.storage_objects.length) {
    throw new Error("api.dpdp_erasure_run: storage_objects are {bucket, key}");
  }
  return {
    request_id: v.request_id,
    user_id: typeof v.user_id === "string" ? v.user_id : null,
    status: v.status,
    storage_objects: objects,
    record: v.record as Record<string, unknown>,
  };
}

export interface EraseDeps {
  /** api.dpdp_erasure_run(request_id, channel), as the service. */
  run(requestId: string, channel: ErasureChannel): Promise<unknown>;
  /** api.dpdp_erasure_complete(request_id, storage_removed, identity_erased), as the service. */
  complete(requestId: string, storageRemoved: boolean, identityErased: boolean): Promise<unknown>;
  storage: Pick<StorageAdapter, "remove">;
  /** auth.admin.deleteUser(userId, true): GoTrue's soft delete. An already-deleted user is fine. */
  deleteIdentity(userId: string): Promise<void>;
  log: Logger;
}

export interface ErasureOutcome {
  completed: boolean;
  record: Record<string, unknown>;
}

/** Steps 2–5 for one erasure request. Re-runnable: every step is idempotent. */
export async function finishErasure(
  deps: EraseDeps,
  requestId: string,
  channel: ErasureChannel,
): Promise<ErasureOutcome> {
  const run = parseErasureRun(await deps.run(requestId, channel));
  if (run.status === "erased") return { completed: true, record: run.record };

  let storageRemoved = true;
  for (const batch of batchesByBucket(run.storage_objects)) {
    try {
      await deps.storage.remove(batch.bucket, batch.keys);
    } catch (err) {
      storageRemoved = false;
      deps.log.error("erasure: storage remove failed", {
        request_id: requestId,
        bucket: batch.bucket,
        files: batch.keys.length,
        ...errorFields(err),
      });
    }
  }

  let identityErased = false;
  if (storageRemoved && run.user_id) {
    try {
      await deps.deleteIdentity(run.user_id);
      identityErased = true;
    } catch (err) {
      deps.log.error("erasure: sign-in soft delete failed", {
        request_id: requestId,
        ...errorFields(err),
      });
    }
  }

  const record = await deps.complete(requestId, storageRemoved, identityErased) as
    | Record<
      string,
      unknown
    >
    | null;
  if (!record || typeof record !== "object") {
    throw new Error("api.dpdp_erasure_complete returned an unexpected shape");
  }
  return { completed: record.status === "erased", record };
}

// ---------------------------------------------------------------------------
// The buyer's call.
// ---------------------------------------------------------------------------

export const DELETE_BODY_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  additionalProperties: false,
  properties: { channel: { enum: ["web", "app"] } },
} as const;

/** The optional body { channel }: an empty body means the app. */
export async function readDeleteBody(req: Request): Promise<{ channel: ErasureChannel }> {
  const text = await readText(req, { maxBytes: 1024 });
  if (text.trim() === "") return { channel: "app" };
  const body = check<{ channel?: ErasureChannel }>(
    await compileSchema(DELETE_BODY_SCHEMA),
    parseJson(text),
  );
  return { channel: body.channel ?? "app" };
}

export interface DeleteDeps {
  /** api.account_delete_request() under the buyer's own JWT (T45b). */
  request(): Promise<unknown>;
  erase: EraseDeps;
}

export interface DeleteResponse {
  request: Record<string, unknown>;
  erasure: Record<string, unknown> | null;
}

export async function deleteAccount(
  deps: DeleteDeps,
  channel: ErasureChannel,
  log: Logger,
): Promise<{ status: number; body: DeleteResponse }> {
  const request = await deps.request() as Record<string, unknown> | null;
  if (
    !request || request.schema !== "plinth.account_delete_request/1" ||
    typeof request.request_id !== "string"
  ) {
    throw new Error("api.account_delete_request returned an unexpected shape");
  }

  let erasure: ErasureOutcome | null = null;
  try {
    erasure = await finishErasure(deps.erase, request.request_id, channel);
  } catch (err) {
    // The request is on record and due in 30 days; retention-sweep finishes it.
    log.error("erasure did not finish; retention-sweep retries it", {
      request_id: request.request_id,
      ...errorFields(err),
    });
  }
  return {
    status: erasure?.completed ? 200 : 202,
    body: { request, erasure: erasure?.record ?? null },
  };
}

export interface MakeDeleteAccountOptions {
  deps(ctx: RequestContext, token: string): DeleteDeps;
  env?: CoreEnv | (() => CoreEnv);
  clock?: Clock;
  /** Tests capture the access and error lines here. */
  sink?: LogSink;
  cors?: CorsOptions;
}

export function makeDeleteAccount(
  opts: MakeDeleteAccountOptions,
): (req: Request) => Promise<Response> {
  return createHandler(
    FN,
    async (req, ctx) => {
      if (!new URL(req.url).pathname.replace(/\/+$/, "").endsWith(`/${FN}`)) {
        throw new HttpError("not_found");
      }
      const token = requireBearer(req);
      const { channel } = await readDeleteBody(req);
      const { status, body } = await deleteAccount(opts.deps(ctx, token), channel, ctx.log);
      ctx.log.info("account erasure", {
        request_id: body.request.request_id,
        erasure: body.erasure?.status ?? "pending",
      });
      return json(body, { status });
    },
    { methods: ["POST"], env: opts.env, clock: opts.clock, sink: opts.sink, cors: opts.cors },
  );
}
