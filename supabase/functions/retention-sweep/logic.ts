// retention-sweep: the daily DPDP sweep (BUILD_PLAN §13 retention table; API_CONTRACTS §3.5,
// §5.5; WORK_BREAKDOWN T53). Tested in logic.test.ts.
//
//   1. api.retention_due            files past their time: unsaved uploads after 30 days, voice
//                                   notes after 24 h, export ZIPs after their 7-day link.
//   2. Storage API remove           per bucket, in batches; a batch that fails stays due and is
//                                   retried tomorrow.
//   3. api.retention_mark_deleted   only for the files Storage removed (and only rows still due).
//   4. api.retention_anonymise_messages   WhatsApp messages 24 months after the last activity.
//   5. Erasures a delete-account call left unfinished (api.dpdp_erasure_pending → finishErasure).
// Logs carry counts only: never a key, a name or a number.

import type { Clock } from "../_shared/core/clock.ts";
import { verifyDispatchSecret } from "../_shared/core/auth.ts";
import type { CoreEnv } from "../_shared/core/env.ts";
import type { RequestContext } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import { json } from "../_shared/core/http.ts";
import type { Logger, LogSink } from "../_shared/core/log.ts";
import { errorFields } from "../_shared/core/log.ts";
import type { EraseDeps } from "../delete-account/logic.ts";
import { finishErasure } from "../delete-account/logic.ts";
import type { StorageAdapter } from "../export-data/storage.ts";
import { batchesByBucket } from "../export-data/storage.ts";

export const FN = "retention-sweep";
export const DUE_LIMIT = 500;
export const MESSAGE_LIMIT = 5000;
export const ERASURE_LIMIT = 10;

export type DueKind = "upload" | "voice" | "export";

export interface DueItem {
  kind: DueKind;
  id: string;
  bucket: string;
  key: string;
}

/** Narrows api.retention_due's answer. */
export function parseDue(value: unknown): DueItem[] {
  if (!Array.isArray(value)) throw new Error("api.retention_due did not return an array");
  return value.map((x) => {
    const v = x as Partial<DueItem> | null;
    if (
      !v || (v.kind !== "upload" && v.kind !== "voice" && v.kind !== "export") ||
      typeof v.id !== "string" || typeof v.bucket !== "string" || typeof v.key !== "string"
    ) {
      throw new Error("api.retention_due: items are {kind, id, bucket, key}");
    }
    return { kind: v.kind, id: v.id, bucket: v.bucket, key: v.key };
  });
}

export interface SweepDeps {
  due(limit: number): Promise<DueItem[]>;
  /** api.retention_mark_deleted(items) → { uploads, voice_notes, exports }. */
  markDeleted(items: readonly DueItem[]): Promise<Record<string, number>>;
  /** api.retention_anonymise_messages(limit) → { messages }. */
  anonymiseMessages(limit: number): Promise<Record<string, number>>;
  /** api.dpdp_erasure_pending(limit) → request ids. */
  erasurePending(limit: number): Promise<string[]>;
  storage: Pick<StorageAdapter, "remove">;
  erase: EraseDeps;
  log: Logger;
}

export interface SweepSummary {
  due: number;
  uploads_deleted: number;
  voice_notes_deleted: number;
  exports_deleted: number;
  files_failed: number;
  messages_anonymised: number;
  erasures_completed: number;
  erasures_open: number;
  erasures_failed: number;
}

export async function runSweep(deps: SweepDeps): Promise<SweepSummary> {
  const due = await deps.due(DUE_LIMIT);
  const summary: SweepSummary = {
    due: due.length,
    uploads_deleted: 0,
    voice_notes_deleted: 0,
    exports_deleted: 0,
    files_failed: 0,
    messages_anonymised: 0,
    erasures_completed: 0,
    erasures_open: 0,
    erasures_failed: 0,
  };

  // Files first, rows after: a row is marked only once Storage has removed its file.
  const removed: DueItem[] = [];
  for (const batch of batchesByBucket(due)) {
    try {
      await deps.storage.remove(batch.bucket, batch.keys);
      const keys = new Set(batch.keys);
      removed.push(...due.filter((d) => d.bucket === batch.bucket && keys.has(d.key)));
    } catch (err) {
      summary.files_failed += batch.keys.length;
      deps.log.error("retention: storage remove failed", {
        bucket: batch.bucket,
        files: batch.keys.length,
        ...errorFields(err),
      });
    }
  }
  if (removed.length) {
    const marked = await deps.markDeleted(removed);
    summary.uploads_deleted = marked.uploads ?? 0;
    summary.voice_notes_deleted = marked.voice_notes ?? 0;
    summary.exports_deleted = marked.exports ?? 0;
  }

  summary.messages_anonymised = (await deps.anonymiseMessages(MESSAGE_LIMIT)).messages ?? 0;

  for (const id of await deps.erasurePending(ERASURE_LIMIT)) {
    try {
      const outcome = await finishErasure(deps.erase, id, "web");
      if (outcome.completed) summary.erasures_completed++;
      else summary.erasures_open++;
    } catch (err) {
      summary.erasures_failed++;
      deps.log.error("retention: erasure failed", { request_id: id, ...errorFields(err) });
    }
  }
  return summary;
}

export interface MakeRetentionSweepOptions {
  deps(ctx: RequestContext): SweepDeps;
  env?: CoreEnv | (() => CoreEnv);
  clock?: Clock;
  /** Tests capture the access and error lines here. */
  sink?: LogSink;
}

/** The deployed function: POST only, the dispatch secret instead of a JWT. */
export function makeRetentionSweep(
  opts: MakeRetentionSweepOptions,
): (req: Request) => Promise<Response> {
  return createHandler(
    FN,
    async (req, ctx) => {
      await verifyDispatchSecret(req, ctx.env.dispatchSecret);
      await req.body?.cancel();
      const summary = await runSweep(opts.deps(ctx));
      ctx.log.info("retention sweep", { ...summary });
      return json(summary);
    },
    { methods: ["POST"], env: opts.env, clock: opts.clock, sink: opts.sink },
  );
}
