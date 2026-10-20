// Cached public reads (Cache Components: `"use cache"` + cacheTag + cacheLife).
// This is the web's ISR: a read is cached with the tags of tags.ts and stays
// until POST /api/revalidate expires one of them, with a time-based backstop.
//
// The result crosses the cache boundary as plain data (`Settled`): a thrown
// error would not survive serialisation, and pages need the DataError code.
// Domain errors that depend only on the arguments (an unknown slug) are cached
// like data; a failure of the moment (network, 5xx, rate limit) never is.
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { DataError, type DataErrorShape, type ErrorCode } from "./errors";
import { invoke } from "./invoke";
import type { DataMode } from "./mode";
import { apiFunction, type RpcArgs, type RpcName } from "./registry";
import { tagsForCall, tagsForPayload } from "./tags";

export type Settled = { ok: true; value: unknown } | { ok: false; error: DataErrorShape };

/** Errors cached with the read. Everything else is a failure of the moment. */
const STABLE_ERRORS: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "not_found",
  "not_in_coverage",
  "invalid_input",
  // Fixture files and deployed functions change only with a build or a migration.
  "fixture_missing",
  "not_implemented",
]);

export async function settle(run: () => Promise<unknown>, rpc: RpcName): Promise<Settled> {
  try {
    return { ok: true, value: await run() };
  } catch (e) {
    const error =
      e instanceof DataError
        ? e
        : new DataError("internal", rpc, e instanceof Error ? e.message : String(e));
    return { ok: false, error: error.toShape() };
  }
}

export async function cachedRead(
  mode: DataMode,
  rpc: RpcName,
  args: RpcArgs,
  fixtureState: string | null,
): Promise<Settled> {
  "use cache";
  const known = tagsForCall(rpc, args);
  cacheTag(...known);
  const settled = await settle(() => invoke(mode, rpc, args, { fixtureState }), rpc);
  if (settled.ok) {
    const found = tagsForPayload(rpc, settled.value).filter((t) => !known.includes(t));
    if (found.length > 0) cacheTag(...found);
  }
  // One cacheLife per call. flags: about a minute (BUILD_PLAN §10); everything
  // else waits for its tags, with an hourly refresh as the backstop.
  if (!settled.ok && !STABLE_ERRORS.has(settled.error.code)) {
    cacheLife({ stale: 0, revalidate: 0, expire: 0 });
  } else if (apiFunction(rpc).cache === "minutes") {
    cacheLife("minutes");
  } else {
    cacheLife("hours");
  }
  return settled;
}
