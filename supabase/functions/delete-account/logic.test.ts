// delete-account logic. Run: npx --yes deno@2 task test (in supabase/functions).
// The database side of the erasure (what is removed, what stays as consent proof) is pgTAP-tested
// in supabase/tests/dpdp/003_erasure.test.sql; here a small in-memory world stands in for it, so
// the tests can follow the edge's order: record → erase → files → sign-in → completion record.
import {
  assert,
  assertApiError,
  assertEquals,
  assertRejects,
  captureLogs,
  fakeRequest,
  frozenClock,
  readBody,
  testEnv,
} from "../_shared/testing/mod.ts";
import { createLogger } from "../_shared/core/log.ts";
import type { DeleteDeps, EraseDeps, ErasureChannel } from "./logic.ts";
import { deleteAccount, finishErasure, makeDeleteAccount, parseErasureRun } from "./logic.ts";

const ROHAN = "bff1ee72-9910-5980-a875-96a9a00b24cf";
const REQUEST_ID = "00000000-0000-4000-8000-0000000053e9";
const EXPORT_KEY = "00000000-0000-4000-8000-0000000053b1/plinth-my-data.zip";
const REFS = ["C-1018-11", "C-1015-02", "C-1012-05", "C-1012-04", "C-0902-01"];

/** Stands in for the database, Storage and GoTrue. */
function world() {
  const state = {
    profiles: new Set([ROHAN]),
    consents: REFS.map((ref) => ({ ref, principal: ROHAN })),
    identities: new Map([[ROHAN, { phone: "919900000318" as string | null, sessions: 2 }]]),
    files: new Set([`uploads/t53/upload.pdf`, `exports/${EXPORT_KEY}`]),
    erased: false,
    completed: false,
    calls: [] as string[],
  };
  const logs = captureLogs();
  const failStorage = { on: false };
  const failIdentity = { on: false };

  const erase: EraseDeps = {
    log: createLogger({ fn: "delete-account", sink: logs.sink }),
    run(id: string, channel: ErasureChannel) {
      state.calls.push(`run:${channel}`);
      if (state.completed) {
        return Promise.resolve({
          request_id: id,
          user_id: null,
          status: "erased",
          storage_objects: [],
          record: { schema: "plinth.account_erasure/1", status: "erased" },
        });
      }
      // The database's part (pgTAP): the profile goes, the consent rows stay.
      state.profiles.delete(ROHAN);
      state.erased = true;
      return Promise.resolve({
        request_id: id,
        user_id: ROHAN,
        status: "erasing",
        storage_objects: [
          { bucket: "exports", key: EXPORT_KEY },
          { bucket: "uploads", key: "t53/upload.pdf" },
        ],
        record: { schema: "plinth.account_erasure/1", status: "erasing" },
      });
    },
    storage: {
      remove(bucket, keys) {
        state.calls.push(`remove:${bucket}`);
        if (failStorage.on) return Promise.reject(new Error("storage down"));
        for (const k of keys) state.files.delete(`${bucket}/${k}`);
        return Promise.resolve();
      },
    },
    deleteIdentity(userId) {
      state.calls.push("identity");
      if (failIdentity.on) return Promise.reject(new Error("gotrue down"));
      // GoTrue's soft delete: the row stays for the kept consent rows, the phone is obfuscated,
      // the sessions end.
      const identity = state.identities.get(userId)!;
      identity.phone = null;
      identity.sessions = 0;
      return Promise.resolve();
    },
    complete(id, storageRemoved, identityErased) {
      state.calls.push(`complete:${storageRemoved}:${identityErased}`);
      state.completed = storageRemoved && identityErased;
      return Promise.resolve({
        schema: "plinth.account_erasure/1",
        request_id: id,
        status: state.completed ? "erased" : "erasing",
        status_line: state.completed
          ? "Your account was erased on 18 Oct 2026."
          : "We are erasing your account.",
        kept_lines: [
          "Proof of the consents you gave and of who had your number stays for 3 years, without your name or number.",
        ],
      });
    },
  };
  const deps: DeleteDeps = {
    request: () =>
      Promise.resolve({
        schema: "plinth.account_delete_request/1",
        request_id: REQUEST_ID,
        status: "requested",
        requested_at: "2026-10-18T12:00:00+05:30",
        due_at: "2026-11-17T12:00:00+05:30",
        due_line: "We'll erase your account by 17 Nov 2026.",
        lines: [
          "Some records stay where the law requires them, such as proof of the consents you gave.",
        ],
      }),
    erase,
  };
  return { state, deps, erase, logs, failStorage, failIdentity };
}

// ---------------------------------------------------------------------------
// Accept: "delete removes the profile and keeps consent proof rows anonymised."
// ---------------------------------------------------------------------------

Deno.test("Accept: the profile goes, the 5 consent rows stay, and the sign-in behind them names no one", async () => {
  const w = world();
  const { status, body } = await deleteAccount(w.deps, "app", w.erase.log);
  assertEquals(status, 200);
  assertEquals(w.state.profiles.has(ROHAN), false, "the profile is removed");
  assertEquals(w.state.consents.map((c) => c.ref), REFS, "the consent proof rows are kept");
  assertEquals(
    w.state.identities.get(ROHAN),
    { phone: null, sessions: 0 },
    "the identity is anonymised, its sessions ended",
  );
  assertEquals(w.state.files.size, 0, "his uploads and export ZIP are removed");
  assertEquals(w.state.calls, [
    "run:app",
    "remove:exports",
    "remove:uploads",
    "identity",
    "complete:true:true",
  ]);
  assertEquals(body.request.request_id, REQUEST_ID);
  assertEquals(body.erasure?.status, "erased");
  assertEquals(body.erasure?.status_line, "Your account was erased on 18 Oct 2026.");
});

Deno.test("files that fail to go keep the sign-in (the person can try again); 202 with the record", async () => {
  const w = world();
  w.failStorage.on = true;
  const { status, body } = await deleteAccount(w.deps, "web", w.erase.log);
  assertEquals(status, 202);
  assert(!w.state.calls.includes("identity"), "no sign-in deletion before the files are gone");
  assertEquals(w.state.calls.at(-1), "complete:false:false");
  assertEquals(w.state.identities.get(ROHAN)?.phone, "919900000318");
  assertEquals(body.erasure?.status, "erasing");
  assertEquals(body.request.due_line, "We'll erase your account by 17 Nov 2026.");
});

Deno.test("a failed sign-in deletion is recorded as not done; the sweep finishes it", async () => {
  const w = world();
  w.failIdentity.on = true;
  const first = await deleteAccount(w.deps, "app", w.erase.log);
  assertEquals(first.status, 202);
  assertEquals(w.state.calls.at(-1), "complete:true:false");

  w.failIdentity.on = false;
  const outcome = await finishErasure(w.erase, REQUEST_ID, "web");
  assertEquals(outcome.completed, true);
  assertEquals(w.state.identities.get(ROHAN)?.phone, null);
});

Deno.test("an erasure already completed returns its record and touches nothing", async () => {
  const w = world();
  await deleteAccount(w.deps, "app", w.erase.log);
  w.state.calls.length = 0;
  const outcome = await finishErasure(w.erase, REQUEST_ID, "app");
  assertEquals(outcome, {
    completed: true,
    record: { schema: "plinth.account_erasure/1", status: "erased" },
  });
  assertEquals(w.state.calls, ["run:app"]);
});

Deno.test("when the erasure itself throws, the request record still answers (202, erasure null)", async () => {
  const w = world();
  const deps: DeleteDeps = {
    ...w.deps,
    erase: { ...w.erase, run: () => Promise.reject(new Error("db down")) },
  };
  const { status, body } = await deleteAccount(deps, "app", w.erase.log);
  assertEquals(status, 202);
  assertEquals(body.erasure, null);
  assertEquals(body.request.status, "requested");
  assertEquals(
    w.logs.find("erasure did not finish; retention-sweep retries it")?.request_id,
    REQUEST_ID,
  );
});

Deno.test("no erasure without a request record from the buyer's own JWT", async () => {
  const w = world();
  const deps: DeleteDeps = { ...w.deps, request: () => Promise.resolve({ schema: "something/1" }) };
  await assertRejects(() => deleteAccount(deps, "app", w.erase.log));
  assertEquals(w.state.calls, []);
});

Deno.test("parseErasureRun: refuses shapes it does not know", () => {
  assert(
    parseErasureRun({
      request_id: "r",
      user_id: null,
      status: "erased",
      storage_objects: [],
      record: {},
    }),
  );
  for (
    const bad of [null, {}, { request_id: "r", status: "gone", storage_objects: [], record: {} }, {
      request_id: "r",
      status: "erasing",
      storage_objects: [{ bucket: "uploads" }],
      record: {},
    }]
  ) {
    let threw = false;
    try {
      parseErasureRun(bad);
    } catch {
      threw = true;
    }
    assert(threw, JSON.stringify(bad));
  }
});

// ---------------------------------------------------------------------------
// The deployed handler.
// ---------------------------------------------------------------------------

function handler(w = world()) {
  const logs = captureLogs();
  const fn = makeDeleteAccount({
    env: testEnv(),
    clock: frozenClock(),
    sink: logs.sink,
    deps: (_ctx, _token) => w.deps,
  });
  return { fn, logs, w };
}

Deno.test("POST /delete-account: a bearer token is required", async () => {
  const { fn, w } = handler();
  await assertApiError(
    await fn(fakeRequest("delete-account", { method: "POST" })),
    "auth_required",
  );
  assertEquals(w.state.calls, []);
});

Deno.test("POST /delete-account: the body is empty or { channel: web | app }", async () => {
  const { fn, w } = handler();
  await assertApiError(
    await fn(fakeRequest("delete-account", { json: { channel: "whatsapp" }, bearer: "t" })),
    "invalid_input",
  );
  await assertApiError(
    await fn(fakeRequest("delete-account", { json: { user_id: ROHAN }, bearer: "t" })),
    "invalid_input",
  );
  assertEquals(w.state.calls, []);
  const res = await fn(fakeRequest("delete-account", { json: { channel: "web" }, bearer: "t" }));
  assertEquals(res.status, 200);
  assertEquals(w.state.calls[0], "run:web");
});

Deno.test("POST /delete-account: 200 with both records; logs carry no user id", async () => {
  const { fn, logs } = handler();
  const res = await fn(fakeRequest("delete-account", { method: "POST", bearer: "t" }));
  const body = await readBody<{ request: { request_id: string }; erasure: { status: string } }>(
    res,
  );
  assertEquals(res.status, 200);
  assertEquals(body.request.request_id, REQUEST_ID);
  assertEquals(body.erasure.status, "erased");
  assertEquals(logs.find("account erasure")?.erasure, "erased");
  assert(!logs.text().includes(ROHAN), "the user id never reaches a log line");
  assert(!logs.text().includes("919900000318"), "nor the number");
});
