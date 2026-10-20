// export-data logic. Run: npx --yes deno@2 task test (in supabase/functions).
// The payload comes from the §5b fixtures (packages/fixtures/expected/{consent_history,
// who_has_my_number}/rohan.json): the same answers api.consent_history and api.who_has_my_number
// give for Rohan, which api.dpdp_export_payload embeds as they are.
import { sha256Hex } from "../_shared/core/crypto.ts";
import { HttpError } from "../_shared/core/errors.ts";
import { createLogger } from "../_shared/core/log.ts";
import {
  assert,
  assertApiError,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
  captureLogs,
  fakeRequest,
  frozenClock,
  MINUTE,
  readBody,
  testEnv,
} from "../_shared/testing/mod.ts";
import type { BuildDeps, LinkAnswer, LinkDeps } from "./logic.ts";
import {
  exportKey,
  isFreshSignIn,
  jwtRejected,
  lastSignInCodeAt,
  makeExportData,
  openLink,
  parsePending,
  runBuild,
} from "./logic.ts";
import { pdfText } from "./pdf.ts";
import type { ExportPayload } from "./render.ts";
import { fmtDate, fmtDateTime } from "./render.ts";
import { readZip } from "./zip.ts";

const REQUEST_ID = "00000000-0000-4000-8000-0000000053b1";
const NOW = new Date("2026-10-18T12:00:00+05:30");
const DISPATCH_SECRET = `dispatch-${crypto.randomUUID()}`;

async function fixture(name: string): Promise<Record<string, unknown>> {
  const url = new URL(`../../../packages/fixtures/expected/${name}/rohan.json`, import.meta.url);
  return JSON.parse(await Deno.readTextFile(url));
}

/** Rohan's export as api.dpdp_export_payload shapes it, its consent sections from the fixtures. */
async function rohanPayload(requestId = REQUEST_ID): Promise<ExportPayload> {
  return {
    schema: "plinth.data_export/1",
    request_id: requestId,
    generated_at: "2026-10-18T12:00:00+05:30",
    account: null,
    follows: [],
    alerts: [],
    saved_searches: [],
    saved_cost_sheets: [],
    ask_questions: [],
    consent_history: await fixture("consent_history"),
    who_has_my_number: await fixture("who_has_my_number"),
    number_shares: [],
    partner_deletion_requests: [],
    family: { circle: null, memberships: [], notes: [] },
    project_requests: [],
    data_requests: [],
    whatsapp: null,
  };
}

function base64url(value: unknown): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** An unsigned JWT-shaped token (the edge reads it; PostgREST would verify it). */
function token(claims: Record<string, unknown>): string {
  return `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(claims)}.signature`;
}

const SUB = "bff1ee72-9910-5980-a875-96a9a00b24cf";
const seconds = (d: Date) => Math.floor(d.getTime() / 1000);
const freshToken = (at = NOW) =>
  token({ sub: SUB, role: "authenticated", amr: [{ method: "otp", timestamp: seconds(at) - 60 }] });

function buildDeps(over: Partial<BuildDeps> = {}) {
  const uploads: Array<{ bucket: string; key: string; bytes: Uint8Array; type: string }> = [];
  const completes: Array<[string, string, number, string]> = [];
  const removed: string[] = [];
  const logs = captureLogs();
  const deps: BuildDeps = {
    pending: () => Promise.resolve([REQUEST_ID]),
    payload: () => rohanPayload(),
    complete: (id, key, bytes, sha) => {
      completes.push([id, key, bytes, sha]);
      return Promise.resolve({ status: "ready", export_key: key });
    },
    storage: {
      upload: (bucket, key, bytes, type) => {
        uploads.push({ bucket, key, bytes, type });
        return Promise.resolve();
      },
      remove: (bucket, keys) => {
        removed.push(...keys.map((k) => `${bucket}/${k}`));
        return Promise.resolve();
      },
    },
    log: createLogger({ fn: "export-data", sink: logs.sink, minLevel: "debug" }),
    ...over,
  };
  return { deps, uploads, completes, removed, logs };
}

// ---------------------------------------------------------------------------
// Accept: "Rohan's export contains his 5 consent refs."
// ---------------------------------------------------------------------------

Deno.test("Accept: Rohan's export ZIP carries his 5 consent refs, in the JSON and the PDF", async () => {
  const history = await fixture("consent_history");
  const refs = (history.items as Array<{ ref: string }>).map((i) => i.ref);
  assertEquals(refs.length, 5);

  const { deps, uploads, completes } = buildDeps();
  assertEquals(await runBuild(deps), { pending: 1, built: 1, discarded: 0, failed: 0 });
  assertEquals(uploads.length, 1);
  const upload = uploads[0]!;
  assertEquals(upload.bucket, "exports");
  assertEquals(upload.key, `${REQUEST_ID}/plinth-my-data.zip`);
  assertEquals(upload.type, "application/zip");

  const files = readZip(upload.bytes);
  assertEquals([...files.keys()].sort(), ["plinth-my-data.json", "plinth-my-data.pdf"]);
  const json = JSON.parse(new TextDecoder().decode(files.get("plinth-my-data.json")));
  assertEquals(json.schema, "plinth.data_export/1");
  assertEquals(json.request_id, REQUEST_ID);
  assertEquals(
    (json.consent_history.items as Array<{ ref: string }>).map((i) => i.ref),
    refs,
  );

  const text = pdfText(files.get("plinth-my-data.pdf")!).join("\n");
  for (const ref of refs) assertStringIncludes(text, ref);
  for (const item of history.items as Array<{ party: string; notice_version: string }>) {
    assertStringIncludes(text, item.party);
  }
  assertStringIncludes(text, String(history.count_line));

  // The record the database keeps names this file exactly.
  assertEquals(completes, [[
    REQUEST_ID,
    `${REQUEST_ID}/plinth-my-data.zip`,
    upload.bytes.length,
    await sha256Hex(upload.bytes as Uint8Array<ArrayBuffer>),
  ]]);
});

Deno.test("the PDF says plainly when a section is empty, from the payload, not from guesses", async () => {
  const { deps, uploads } = buildDeps();
  await runBuild(deps);
  const text = pdfText(readZip(uploads[0]!.bytes).get("plinth-my-data.pdf")!).join("\n");
  assertStringIncludes(text, "No saved cost sheets.");
  assertStringIncludes(text, "No questions to Ask Plinth.");
  assertStringIncludes(text, "You follow no projects.");
});

Deno.test("runBuild: one failing request never stops the others, and nothing is stored for it", async () => {
  const other = "00000000-0000-4000-8000-0000000053b2";
  const { deps, uploads, completes, logs } = buildDeps({
    pending: () => Promise.resolve([REQUEST_ID, other]),
    payload: (id) => id === REQUEST_ID ? Promise.reject(new Error("boom")) : rohanPayload(other),
  });
  assertEquals(await runBuild(deps), { pending: 2, built: 1, discarded: 0, failed: 1 });
  assertEquals(uploads.map((u) => u.key), [`${other}/plinth-my-data.zip`]);
  assertEquals(completes.map((c) => c[0]), [other]);
  assertEquals(logs.find("export build failed")?.request_id, REQUEST_ID);
});

Deno.test("runBuild: a payload for another request is refused (never stored under this key)", async () => {
  const { deps, uploads } = buildDeps({
    payload: () => rohanPayload("00000000-0000-4000-8000-0000000053b9"),
  });
  assertEquals((await runBuild(deps)).failed, 1);
  assertEquals(uploads.length, 0);
});

Deno.test("runBuild: a failed upload is not recorded as stored", async () => {
  const { deps, completes } = buildDeps({
    storage: {
      upload: () => Promise.reject(new Error("storage down")),
      remove: () => Promise.resolve(),
    },
  });
  assertEquals((await runBuild(deps)).failed, 1);
  assertEquals(completes.length, 0);
});

Deno.test("runBuild: a file the database did not record is removed at once (no stray copy)", async () => {
  // The request was closed meanwhile (an erasure): the completion records no key.
  const closed = buildDeps({
    complete: () => Promise.resolve({ status: "expired", export_key: null }),
  });
  assertEquals(await runBuild(closed.deps), { pending: 1, built: 0, discarded: 1, failed: 0 });
  assertEquals(closed.removed, [`exports/${REQUEST_ID}/plinth-my-data.zip`]);

  // The completion failed: the request stays open for the next run, the file goes now.
  const failed = buildDeps({ complete: () => Promise.reject(new Error("db down")) });
  assertEquals(await runBuild(failed.deps), { pending: 1, built: 0, discarded: 0, failed: 1 });
  assertEquals(failed.removed, [`exports/${REQUEST_ID}/plinth-my-data.zip`]);

  const kept = buildDeps();
  await runBuild(kept.deps);
  assertEquals(kept.removed, [], "a recorded file stays");
});

Deno.test("parsePending and exportKey", () => {
  assertEquals(parsePending([{ request_id: REQUEST_ID }, { request_id: "nope" }, null]), [
    REQUEST_ID,
  ]);
  assertThrows(() => parsePending({}));
  assertEquals(exportKey(REQUEST_ID), `${REQUEST_ID}/plinth-my-data.zip`);
  assertThrows(() => exportKey("../other-user/plinth-my-data"));
});

Deno.test("fmtDate / fmtDateTime: house dates from the payload's strings", () => {
  assertEquals(fmtDate("2026-10-02"), "2 Oct 2026");
  assertEquals(fmtDate("2026-09-02"), "2 Sep 2026");
  assertEquals(fmtDateTime("2026-10-19T12:00:00+05:30"), "19 Oct 2026, 12:00 pm");
  assertEquals(fmtDateTime("2026-10-19T00:05:00+05:30"), "19 Oct 2026, 12:05 am");
});

// ---------------------------------------------------------------------------
// A fresh sign-in code.
// ---------------------------------------------------------------------------

Deno.test("isFreshSignIn: an OTP sign-in in the last 10 minutes, nothing else", () => {
  const at = seconds(NOW);
  assert(isFreshSignIn(token({ amr: [{ method: "otp", timestamp: at - 60 }] }), NOW));
  assert(isFreshSignIn(token({ amr: [{ method: "sms/signup", timestamp: at - 599 }] }), NOW));
  assert(
    !isFreshSignIn(token({ amr: [{ method: "otp", timestamp: at - 3600 }] }), NOW),
    "an hour old",
  );
  assert(
    !isFreshSignIn(token({ amr: [{ method: "token_refresh", timestamp: at }] }), NOW),
    "a refresh",
  );
  assert(
    !isFreshSignIn(token({ amr: [{ method: "password", timestamp: at }] }), NOW),
    "not a code",
  );
  assert(
    !isFreshSignIn(token({ amr: [{ method: "otp", timestamp: at + 3600 }] }), NOW),
    "from the future",
  );
  assert(!isFreshSignIn(token({ sub: SUB }), NOW), "no amr");
  assert(!isFreshSignIn("not-a-jwt", NOW));
  assertEquals(
    lastSignInCodeAt(
      token({ amr: [{ method: "otp", timestamp: 5 }, { method: "otp", timestamp: 9 }] }),
    ),
    9,
  );
});

// ---------------------------------------------------------------------------
// Opening the download.
// ---------------------------------------------------------------------------

function linkDeps(answer: Partial<LinkAnswer>, now = NOW) {
  const signed: Array<{ bucket: string; key: string; ttl: number; name: string }> = [];
  const deps: LinkDeps = {
    now: () => now,
    link: () =>
      Promise.resolve({
        request_id: REQUEST_ID,
        line: "The link works until 25 Oct 2026.",
        export_key: null,
        link_expires_at: null,
        ...answer,
      }),
    storage: {
      signedUrl: (bucket, key, ttl, name) => {
        signed.push({ bucket, key, ttl, name });
        return Promise.resolve(
          `http://supabase.test/storage/v1/object/sign/${bucket}/${key}?token=t`,
        );
      },
    },
  };
  return { deps, signed };
}

const READY: Partial<LinkAnswer> = {
  status: "ready",
  export_key: `${REQUEST_ID}/plinth-my-data.zip`,
  link_expires_at: "2026-10-25T12:00:00+05:30",
};

Deno.test("openLink: ready + a fresh code → a 5-minute signed URL for his own file", async () => {
  const { deps, signed } = linkDeps(READY);
  const res = await openLink(deps, freshToken(), REQUEST_ID);
  assertEquals(signed, [{
    bucket: "exports",
    key: `${REQUEST_ID}/plinth-my-data.zip`,
    ttl: 300,
    name: "plinth-my-data.zip",
  }]);
  assertEquals(res.status, "ready");
  assertEquals(res.link_expires_at, "2026-10-25T12:00:00+05:30");
  assertEquals(res.url_expires_at, new Date(NOW.getTime() + 300_000).toISOString());
  assertEquals(res.line, "The link works until 25 Oct 2026.");
});

Deno.test("openLink: the signed URL never outlives the 7-day link", async () => {
  const late = new Date(new Date("2026-10-25T12:00:00+05:30").getTime() - 2 * MINUTE);
  const { deps, signed } = linkDeps(READY, late);
  await openLink(deps, freshToken(late), REQUEST_ID);
  assertEquals(signed[0]!.ttl, 120);
});

Deno.test("openLink: the database's refusals become contract errors, and nothing is signed", async () => {
  const cases: Array<[Partial<LinkAnswer>, string]> = [
    [{ status: "preparing", line: "Ready by 19 Oct 2026, 12:00 pm." }, "conflict"],
    [
      { status: "expired", line: "This download link has expired. Request a new download." },
      "not_found",
    ],
    [
      { status: "sign_in_required", line: "Enter a fresh sign-in code to open your download." },
      "auth_required",
    ],
  ];
  for (const [answer, code] of cases) {
    const { deps, signed } = linkDeps(answer);
    const err = await assertRejects(() => openLink(deps, freshToken(), REQUEST_ID), HttpError);
    assertEquals(err.code, code);
    assertEquals(err.message, answer.line);
    if (code === "auth_required") {
      assertStringIncludes(
        err.headers.get("www-authenticate") ?? "",
        "insufficient_user_authentication",
      );
    }
    assertEquals(signed.length, 0);
  }
});

Deno.test("openLink: even when the database says ready, a stale code here signs nothing", async () => {
  const { deps, signed } = linkDeps(READY);
  const stale = token({ sub: SUB, amr: [{ method: "otp", timestamp: seconds(NOW) - 3600 }] });
  const err = await assertRejects(() => openLink(deps, stale, REQUEST_ID), HttpError);
  assertEquals(err.code, "auth_required");
  assertEquals(signed.length, 0);
});

Deno.test("openLink: a ready answer naming another key is refused", async () => {
  const { deps, signed } = linkDeps({ ...READY, export_key: "someone-else/plinth-my-data.zip" });
  await assertRejects(() => openLink(deps, freshToken(), REQUEST_ID));
  assertEquals(signed.length, 0);
});

Deno.test("jwtRejected: PostgREST's JWT errors are auth_required; others pass through", () => {
  const bad = new HttpError("internal", undefined, {
    cause: { code: "PGRST301", message: "JWSError" },
  });
  assertEquals((jwtRejected(bad) as HttpError).code, "auth_required");
  const other = new HttpError("internal", undefined, { cause: { code: "42501" } });
  assertEquals(jwtRejected(other), other);
});

// ---------------------------------------------------------------------------
// The deployed handler.
// ---------------------------------------------------------------------------

function handler(over: { build?: Partial<BuildDeps>; link?: Partial<LinkAnswer> } = {}) {
  const logs = captureLogs();
  const built = buildDeps(over.build);
  const linked = linkDeps(over.link ?? READY);
  const clock = frozenClock();
  const fn = makeExportData({
    env: testEnv({ PLINTH_DISPATCH_SECRET: DISPATCH_SECRET }),
    clock,
    sink: logs.sink,
    buildDeps: () => built.deps,
    linkDeps: () => ({ ...linked.deps, now: () => clock.now() }),
  });
  return { fn, logs, built, linked, clock };
}

Deno.test("POST /export-data/build: the dispatch secret only", async () => {
  const { fn, built } = handler();
  const build = (secret?: string) =>
    fn(fakeRequest("export-data/build", {
      method: "POST",
      body: "{}",
      headers: secret ? { "x-plinth-dispatch-secret": secret } : {},
    }));
  await assertApiError(await build(), "auth_required");
  await assertApiError(await build("wrong"), "forbidden");
  assertEquals(built.uploads.length, 0);
  const res = await build(DISPATCH_SECRET);
  assertEquals(await readBody(res), { pending: 1, built: 1, discarded: 0, failed: 0 });
  assertEquals(built.uploads.length, 1);
});

Deno.test("POST /export-data: bearer and { request_id } required; ready → signed URL", async () => {
  const { fn } = handler();
  await assertApiError(
    await fn(fakeRequest("export-data", { json: { request_id: REQUEST_ID } })),
    "auth_required",
  );
  await assertApiError(
    await fn(fakeRequest("export-data", { json: { request_id: "x" }, bearer: freshToken() })),
    "invalid_input",
  );
  await assertApiError(
    await fn(
      fakeRequest("export-data", {
        json: { request_id: REQUEST_ID, user_id: SUB },
        bearer: freshToken(),
      }),
    ),
    "invalid_input",
  );
  const res = await fn(
    fakeRequest("export-data", { json: { request_id: REQUEST_ID }, bearer: freshToken() }),
  );
  assertEquals(res.status, 200);
  const body = await readBody<{ url: string; status: string }>(res);
  assertEquals(body.status, "ready");
  assertStringIncludes(body.url, `/exports/${REQUEST_ID}/plinth-my-data.zip`);
});

Deno.test("POST /export-data: a stale code is a 401 with the step-up header", async () => {
  const { fn } = handler({
    link: { status: "sign_in_required", line: "Enter a fresh sign-in code to open your download." },
  });
  const res = await fn(
    fakeRequest("export-data", { json: { request_id: REQUEST_ID }, bearer: freshToken() }),
  );
  assertStringIncludes(
    res.headers.get("www-authenticate") ?? "",
    "insufficient_user_authentication",
  );
  assertEquals(
    await assertApiError(res, "auth_required"),
    "Enter a fresh sign-in code to open your download.",
  );
});

Deno.test("logs: no token, no user id, no signed URL; the buyer appears only as user_hash", async () => {
  const { fn, logs } = handler();
  const t = freshToken();
  const res = await fn(fakeRequest("export-data", { json: { request_id: REQUEST_ID }, bearer: t }));
  const body = await readBody<{ url: string }>(res);
  const text = logs.text();
  assert(logs.lines.length >= 2, "the handler logged its lines here");
  assert(!text.includes(t.split(".")[1]!), "the bearer token never reaches a log line");
  assert(!text.includes(SUB), "the user id never reaches a log line");
  assert(!text.includes(body.url), "the signed URL never reaches a log line");
  const signed = logs.find("export link signed");
  assertEquals(signed?.request_id, REQUEST_ID);
  assertEquals(typeof signed?.user_hash, "string");
});

Deno.test("an unknown path under the function is not_found", async () => {
  const { fn } = handler();
  await assertApiError(
    await fn(fakeRequest("export-data/other", { json: {}, bearer: freshToken() })),
    "not_found",
  );
});
