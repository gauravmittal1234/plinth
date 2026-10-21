// retention-sweep logic. Run: npx --yes deno@2 task test (in supabase/functions).
// The due rule itself lives in SQL (api.retention_due) and is pgTAP-tested with the same clock
// moves in supabase/tests/dpdp/002_retention.test.sql. Here an in-memory table applies that rule
// against a frozen clock, so the tests follow the edge's order: due → Storage → mark.
import {
  assert,
  assertApiError,
  assertEquals,
  captureLogs,
  DAY,
  fakeRequest,
  frozenClock,
  HOUR,
  readBody,
  testEnv,
} from "../_shared/testing/mod.ts";
import type { TestClock } from "../_shared/testing/mod.ts";
import { createLogger } from "../_shared/core/log.ts";
import type { EraseDeps } from "../delete-account/logic.ts";
import type { DueItem, SweepDeps } from "./logic.ts";
import { makeRetentionSweep, parseDue, runSweep } from "./logic.ts";

const DISPATCH_SECRET = `dispatch-${crypto.randomUUID()}`;

interface Upload {
  id: string;
  kind: "cost_sheet" | "voice_note";
  key: string;
  saved: boolean;
  createdAt: Date;
  deletedAt: Date | null;
}

/** app.uploads in memory, with api.retention_due's rule (30 days unless saved; voice at 24 h). */
function uploadsWorld(clock: TestClock) {
  const at = clock.now();
  const rows: Upload[] = [
    {
      id: "u-unsaved",
      kind: "cost_sheet",
      key: "t53/unsaved.pdf",
      saved: false,
      createdAt: at,
      deletedAt: null,
    },
    {
      id: "u-saved",
      kind: "cost_sheet",
      key: "t53/saved.pdf",
      saved: true,
      createdAt: at,
      deletedAt: null,
    },
    {
      id: "u-voice",
      kind: "voice_note",
      key: "t53/voice.ogg",
      saved: false,
      createdAt: at,
      deletedAt: null,
    },
  ];
  const files = new Set(
    rows.map((r) => `${r.kind === "voice_note" ? "voice-tmp" : "uploads"}/${r.key}`),
  );
  const isDue = (r: Upload, now: Date) =>
    r.deletedAt === null &&
    (r.kind === "voice_note"
      ? now.getTime() - r.createdAt.getTime() >= DAY
      : !r.saved && now.getTime() - r.createdAt.getTime() >= 30 * DAY);
  return { rows, files, isDue };
}

function sweepDeps(clock: TestClock, over: Partial<SweepDeps> = {}) {
  const w = uploadsWorld(clock);
  const logs = captureLogs();
  const calls: string[] = [];
  const noErase = {} as EraseDeps;
  const deps: SweepDeps = {
    log: createLogger({ fn: "retention-sweep", sink: logs.sink }),
    due: () =>
      Promise.resolve(
        w.rows.filter((r) => w.isDue(r, clock.now())).map((r): DueItem => ({
          kind: r.kind === "voice_note" ? "voice" : "upload",
          id: r.id,
          bucket: r.kind === "voice_note" ? "voice-tmp" : "uploads",
          key: r.key,
        })),
      ),
    storage: {
      remove(bucket, keys) {
        calls.push(`remove:${bucket}:${keys.join(",")}`);
        for (const k of keys) w.files.delete(`${bucket}/${k}`);
        return Promise.resolve();
      },
    },
    markDeleted(items) {
      calls.push(`mark:${items.map((i) => i.id).join(",")}`);
      const out = { uploads: 0, voice_notes: 0, exports: 0 };
      for (const item of items) {
        const row = w.rows.find((r) => r.id === item.id && r.key === item.key);
        if (!row || !w.isDue(row, clock.now())) continue;
        row.deletedAt = clock.now();
        if (row.kind === "voice_note") out.voice_notes++;
        else out.uploads++;
      }
      return Promise.resolve(out);
    },
    anonymiseMessages: () => Promise.resolve({ messages: 0 }),
    erasurePending: () => Promise.resolve([]),
    erase: noErase,
    ...over,
  };
  return { deps, w, calls, logs };
}

// ---------------------------------------------------------------------------
// Accept: "the sweep with the clock advanced 31 days deletes an unsaved upload and keeps a saved one".
// ---------------------------------------------------------------------------

Deno.test("Accept: clock + 31 days → the unsaved upload is deleted, the saved one is kept", async () => {
  const clock = frozenClock();
  const { deps, w, calls } = sweepDeps(clock);

  clock.advance(31 * DAY);
  const summary = await runSweep(deps);

  const unsaved = w.rows.find((r) => r.id === "u-unsaved")!;
  const saved = w.rows.find((r) => r.id === "u-saved")!;
  assert(unsaved.deletedAt, "the unsaved upload is deleted");
  assertEquals(w.files.has("uploads/t53/unsaved.pdf"), false, "its file left Storage");
  assertEquals(saved.deletedAt, null, "the saved upload is kept");
  assertEquals(w.files.has("uploads/t53/saved.pdf"), true, "its file stays");
  assertEquals(summary.uploads_deleted, 1);
  assertEquals(summary.voice_notes_deleted, 1);
  // Storage first, then the rows.
  assertEquals(calls, [
    "remove:uploads:t53/unsaved.pdf",
    "remove:voice-tmp:t53/voice.ogg",
    "mark:u-unsaved,u-voice",
  ]);
});

Deno.test("day 29: nothing but the voice note (past 24 h) is due", async () => {
  const clock = frozenClock();
  const { deps, w } = sweepDeps(clock);
  clock.advance(29 * DAY);
  const summary = await runSweep(deps);
  assertEquals(summary, {
    due: 1,
    uploads_deleted: 0,
    voice_notes_deleted: 1,
    exports_deleted: 0,
    files_failed: 0,
    messages_anonymised: 0,
    erasures_completed: 0,
    erasures_open: 0,
    erasures_failed: 0,
  });
  assertEquals(w.rows.filter((r) => r.deletedAt).map((r) => r.id), ["u-voice"]);
});

Deno.test("day 0 + 23 h: the voice note is still within its 24 h", async () => {
  const clock = frozenClock();
  const { deps, calls } = sweepDeps(clock);
  clock.advance(23 * HOUR);
  assertEquals((await runSweep(deps)).due, 0);
  assertEquals(calls, []);
});

Deno.test("a bucket Storage fails to clear is not marked; it stays due for tomorrow", async () => {
  const clock = frozenClock();
  const { deps, w, logs } = sweepDeps(clock);
  deps.storage = {
    remove(bucket, keys) {
      if (bucket === "uploads") return Promise.reject(new Error("storage down"));
      for (const k of keys) w.files.delete(`${bucket}/${k}`);
      return Promise.resolve();
    },
  };
  clock.advance(31 * DAY);
  const summary = await runSweep(deps);
  assertEquals(summary.files_failed, 1);
  assertEquals(summary.uploads_deleted, 0);
  assertEquals(summary.voice_notes_deleted, 1);
  assertEquals(w.rows.find((r) => r.id === "u-unsaved")!.deletedAt, null);
  const line = logs.find("retention: storage remove failed");
  assertEquals(line?.bucket, "uploads");
  assert(!logs.text().includes("t53/unsaved.pdf"), "keys never reach the logs");
});

Deno.test("old messages are anonymised and unfinished erasures are finished", async () => {
  const clock = frozenClock();
  const finished: string[] = [];
  const erase: EraseDeps = {
    log: createLogger({ fn: "retention-sweep", sink: () => {} }),
    run: (id) =>
      Promise.resolve({
        request_id: id,
        user_id: id === "e-fail" ? "u" : null,
        status: id === "e-fail" ? "erasing" : "erased",
        storage_objects: [],
        record: { status: "erased" },
      }),
    storage: { remove: () => Promise.resolve() },
    deleteIdentity: () => Promise.reject(new Error("gotrue down")),
    complete: (id) => {
      finished.push(id);
      return Promise.resolve({ status: "erasing" });
    },
  };
  const { deps } = sweepDeps(clock, {
    anonymiseMessages: () => Promise.resolve({ messages: 7 }),
    erasurePending: () => Promise.resolve(["e-done", "e-fail", "e-throw"]),
    erase: {
      ...erase,
      run: (id, channel) =>
        id === "e-throw" ? Promise.reject(new Error("db down")) : erase.run(id, channel),
    },
  });
  const summary = await runSweep(deps);
  assertEquals(summary.messages_anonymised, 7);
  assertEquals(summary.erasures_completed, 1);
  assertEquals(summary.erasures_open, 1);
  assertEquals(summary.erasures_failed, 1);
  assertEquals(finished, ["e-fail"]);
});

Deno.test("parseDue: only {kind, id, bucket, key} items", () => {
  assertEquals(
    parseDue([{ kind: "export", id: "r", bucket: "exports", key: "r/plinth-my-data.zip" }]).length,
    1,
  );
  for (
    const bad of [{}, [{ kind: "profile", id: "x", bucket: "b", key: "k" }], [{
      kind: "upload",
      id: "x",
    }]]
  ) {
    let threw = false;
    try {
      parseDue(bad);
    } catch {
      threw = true;
    }
    assert(threw, JSON.stringify(bad));
  }
});

Deno.test("POST /retention-sweep: the dispatch secret only", async () => {
  const clock = frozenClock();
  const { deps, calls } = sweepDeps(clock);
  const fn = makeRetentionSweep({
    env: testEnv({ PLINTH_DISPATCH_SECRET: DISPATCH_SECRET }),
    clock,
    sink: () => {},
    deps: () => deps,
  });
  const sweep = (secret?: string) =>
    fn(fakeRequest("retention-sweep", {
      method: "POST",
      body: "{}",
      headers: secret ? { "x-plinth-dispatch-secret": secret } : {},
    }));
  await assertApiError(await sweep(), "auth_required");
  await assertApiError(await sweep("wrong"), "forbidden");
  assertEquals(calls, []);
  clock.advance(31 * DAY);
  const body = await readBody<{ uploads_deleted: number }>(await sweep(DISPATCH_SECRET));
  assertEquals(body.uploads_deleted, 1);

  const unset = makeRetentionSweep({ env: testEnv(), sink: () => {}, deps: () => deps });
  await assertApiError(
    await unset(
      fakeRequest("retention-sweep", {
        method: "POST",
        headers: { "x-plinth-dispatch-secret": "x" },
      }),
    ),
    "internal",
  );
});
