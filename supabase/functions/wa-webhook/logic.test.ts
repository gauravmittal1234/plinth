// wa-webhook on T03b's recorded payloads (packages/fixtures/recorded/wa). No network: the store is
// the in-memory twin (_shared/wa/mock.ts), Graph runs in mock mode, api.suggest is a fake RPC.
// Secrets are random per run. Run: npx --yes deno@2 task test (in supabase/functions).
import { Secret } from "../_shared/core/env.ts";
import { flagsReader } from "../_shared/core/flags.ts";
import { hmacSha256, toBase64 } from "../_shared/core/crypto.ts";
import {
  assert,
  assertApiError,
  assertEquals,
  assertExists,
  assertFalse,
  captureLogs,
  fakeRequest,
  fakeRpc,
  frozenClock,
  MINUTE,
  readBody,
  testEnv,
} from "../_shared/testing/mod.ts";
import { createGraphClient, replyButtons } from "../_shared/wa/graph.ts";
import { memoryWaStore, sequentialIds } from "../_shared/wa/mock.ts";
import { decodeJwtPayload, metaSignature } from "../_shared/wa/verify.ts";
import type { WaDeps, WaEnv } from "./logic.ts";
import { assertSessionWindow, makeWaWebhook } from "./logic.ts";
import type { HandlerInput, HandlerName, HandlerResult, HandlerTools, WaHandler } from "./router.ts";
import { HANDLER_NAMES, suggestProjectFinder } from "./router.ts";

const FIXTURES = new URL("../../../packages/fixtures/", import.meta.url);
const readFixture = (path: string) => Deno.readTextFile(new URL(path, FIXTURES));

interface IndexEntry {
  file: string;
  wa_message_id: string;
  from: string | null;
  kind: string;
  route: string;
  expect: Record<string, unknown>;
}
const INDEX = JSON.parse(await readFixture("recorded/wa/_index.json")) as { payloads: IndexEntry[] };
const PAYLOADS = new Map<string, string>();
for (const p of INDEX.payloads) PAYLOADS.set(p.file, await readFixture(`recorded/wa/${p.file}`));
const payload = (file: string) => PAYLOADS.get(file)!;

const PEOPLE = JSON.parse(await readFixture("canonical/people.json")) as {
  people: { key: string; id: string; wa_id: string }[];
};
const rohan = PEOPLE.people.find((p) => p.key === "rohan")!;

const CATALOGUE = JSON.parse(await readFixture("canonical/catalogue.json")) as {
  phases: { slug: string; name: string }[];
};

const APP_SECRET = `app-${crypto.randomUUID()}`;
const VERIFY_TOKEN = `verify-${crypto.randomUUID()}`;
const JWT_SECRET = `jwt-${crypto.randomUUID()}`;
const DISPATCH_SECRET = `dispatch-${crypto.randomUUID()}`;
const WA: WaEnv = {
  appSecret: new Secret(APP_SECRET),
  verifyToken: new Secret(VERIFY_TOKEN),
  phoneNumberId: "100000000000001",
  accessToken: null,
  jwtSecret: new Secret(JWT_SECRET),
};

/** api.suggest over the fixture catalogue: phases whose name contains the query, in order. */
const fakeSuggest = fakeRpc({
  suggest: ({ args }) => {
    const q = String(args.p_q).toLowerCase();
    const items = CATALOGUE.phases
      .filter((p) => p.name.toLowerCase().includes(q))
      .map((p) => ({ kind: "phase", slug: p.slug, label: p.name, matched_on: "name" }));
    return { data: { schema: "plinth.suggest/1", q, items }, error: null };
  },
});

interface Call {
  name: HandlerName;
  input: HandlerInput;
}

interface HarnessOptions {
  flags?: Record<string, boolean>;
  handlers?: Partial<Record<HandlerName, WaHandler>>;
}

function harness(opts: HarnessOptions = {}) {
  const clock = frozenClock();
  const logs = captureLogs();
  const store = memoryWaStore(clock);
  const calls: Call[] = [];
  const recording = {} as Record<HandlerName, WaHandler>;
  for (const name of HANDLER_NAMES) {
    recording[name] = (input: HandlerInput): Promise<HandlerResult> => {
      calls.push({ name, input });
      return Promise.resolve({ outcome: "recorded" });
    };
  }
  const tokens: string[] = [];
  const tasks: Promise<unknown>[] = [];
  const deps: WaDeps = {
    store,
    flags: flagsReader(() =>
      Promise.resolve({
        schema: "plinth.flags/1",
        flags: { wa_inbound: true, wa_outbound: true, ...opts.flags },
      })
    ),
    graph: createGraphClient({
      mode: "mock",
      plinthEnv: "test",
      record: store.recordOutbound,
      mockId: sequentialIds(),
    }),
    findProject: suggestProjectFinder(fakeSuggest),
    handlers: { ...recording, ...opts.handlers },
    service: fakeRpc({}),
    asUser: (token) => {
      tokens.push(token);
      return fakeRpc({});
    },
  };
  const fn = makeWaWebhook({
    env: testEnv({ PLINTH_DISPATCH_SECRET: DISPATCH_SECRET }),
    sink: logs.sink,
    clock,
    wa: WA,
    deps: () => deps,
    defer: (task) => {
      tasks.push(task);
    },
  });
  const settle = async () => {
    while (tasks.length) await Promise.all(tasks.splice(0));
  };
  return { fn, store, calls, tokens, logs, clock, settle };
}

async function signed(body: string, header?: string | null): Promise<Request> {
  const sig = header === undefined ? await metaSignature(APP_SECRET, body) : header;
  return fakeRequest("wa-webhook", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...(sig ? { "x-hub-signature-256": sig } : {}) },
  });
}

async function post(h: ReturnType<typeof harness>, file: string): Promise<Response> {
  const res = await h.fn(await signed(payload(file)));
  await h.settle();
  return res;
}

const inbound = (h: ReturnType<typeof harness>) => h.store.messages.filter((m) => m.direction === "in");

// ---------------------------------------------------------------------------------------------
// Acceptance
// ---------------------------------------------------------------------------------------------

Deno.test("a bad signature returns 403 and nothing is stored or routed", async () => {
  const h = harness();
  const body = payload("text-aurelia.json");
  const cases: [string, Request][] = [
    ["wrong secret", await signed(body, await metaSignature("not-the-app-secret", body))],
    ["tampered body", await signed(body.replace("aurelia", "aurelia "), await metaSignature(APP_SECRET, body))],
    ["no header", await signed(body, null)],
    ["not hex", await signed(body, "sha256=xyz")],
  ];
  for (const [what, req] of cases) {
    const res = await h.fn(req);
    assertEquals(res.status, 403, what);
    await assertApiError(res, "forbidden");
  }
  await h.settle();
  assertEquals(h.store.messages.length, 0);
  assertEquals(h.store.contacts.size, 0);
  assertEquals(h.calls.length, 0);
});

Deno.test("a duplicate message id is processed once", async () => {
  const h = harness();
  const first = await post(h, "text-aurelia.json");
  const again = await post(h, "text-aurelia.json");
  assertEquals([first.status, again.status], [200, 200]);
  assertEquals(await readBody(again), { ok: true });
  assertEquals(inbound(h).length, 1);
  assertEquals(h.calls.length, 1);
  assertEquals(h.logs.lines.filter((l) => l.msg === "wa inbound").map((l) => l.duplicates), [0, 1]);
});

Deno.test('"JOIN AH2-7KQ" routes to family_join with the code', async () => {
  const h = harness();
  await post(h, "text-join-ah2-7kq.json");
  assertEquals(h.calls.map((c) => c.name), ["family_join"]);
  assertEquals(h.calls[0]!.input.route.args.code, "AH2-7KQ");
});

Deno.test('"aurelia" routes to risk_card for Aurelia Heights, Phase 2', async () => {
  const h = harness();
  await post(h, "text-aurelia.json");
  assertEquals(h.calls.map((c) => c.name), ["risk_card"]);
  const { route } = h.calls[0]!.input;
  assertEquals(route.rule, "project_name");
  assertEquals(route.args.slug, "aurelia-heights-phase-2");
});

Deno.test('"STOP" routes to prefs (stop_all)', async () => {
  const h = harness();
  await post(h, "text-stop.json");
  assertEquals(h.calls.map((c) => [c.name, c.input.route.action]), [["prefs", "stop_all"]]);
});

Deno.test("every recorded payload routes as the fixture index expects for M2", async () => {
  // M3+ routes fall back in M2: images go to card_changed (pHash first), documents and audio to
  // ask_fallback with the later route named in `deferred`.
  const m2: Record<string, [HandlerName, Record<string, unknown>]> = {
    risk_card: ["risk_card", {}],
    family_join: ["family_join", {}],
    prefs: ["prefs", {}],
    digest: ["digest", {}],
    card_changed: ["card_changed", {}],
    claims: ["card_changed", {}],
    pay_as_built: ["ask_fallback", { deferred: "doc_check" }],
    visit_recap: ["ask_fallback", { deferred: "transcribe" }],
  };
  for (const p of INDEX.payloads.filter((x) => x.from !== null)) {
    const h = harness();
    const res = await post(h, p.file);
    assertEquals(res.status, 200, p.file);
    const [handler, args] = m2[p.route]!;
    assertEquals(h.calls.map((c) => c.name), [handler], p.file);
    const route = h.calls[0]!.input.route;
    for (const [k, v] of Object.entries(args)) assertEquals(route.args[k], v, `${p.file} ${k}`);
    if (typeof p.expect.action === "string") {
      assertEquals(route.action, p.expect.action, p.file);
    }
    if (p.route === "risk_card" && p.kind === "text" && p.file !== "text-rera-number.json") {
      assertEquals(route.args.slug, p.expect.slug, p.file);
    }
    if (p.file === "text-rera-number.json") assertEquals(route.args.rera, "GGM/673/405/2022/117");
    assertEquals(h.calls[0]!.input.message.waMessageId, p.wa_message_id, p.file);
  }
});

// ---------------------------------------------------------------------------------------------
// Contacts, statuses, handshake, kill switch
// ---------------------------------------------------------------------------------------------

Deno.test("the sender's contact is upserted with last_inbound_at from Meta's timestamp", async () => {
  const h = harness();
  await post(h, "text-aurelia.json");
  await post(h, "text-stop.json");
  assertEquals(h.store.contacts.size, 1);
  const contact = h.store.contacts.get(rohan.wa_id)!;
  assertEquals(contact.lastInboundAt, "2026-10-18T06:30:00.000Z");
  assertFalse(JSON.stringify(inbound(h).map((m) => m.payload)).includes(rohan.wa_id));
});

Deno.test("a delivered status moves the outbound message forward and routes nothing", async () => {
  const h = harness();
  await h.store.recordOutbound({
    contactId: null,
    waMessageId: "wamid.fixture.4511eca3-adb4-5497-b864-34d6edde159f",
    type: "template",
    payload: {},
    status: "sent",
    templateCode: "weekly_digest",
  });
  const res = await post(h, "status-delivered.json");
  assertEquals(res.status, 200);
  assertEquals(h.store.messages[0]!.status, "delivered");
  assertEquals(h.calls.length, 0);
  assertEquals(h.logs.find("wa inbound")?.statuses_matched, 1);
});

Deno.test("GET answers Meta's verify handshake only for the right token", async () => {
  const h = harness();
  const get = (token: string, mode = "subscribe") =>
    h.fn(fakeRequest("wa-webhook", {
      query: { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": "1158201444" },
    }));
  const good = await get(VERIFY_TOKEN);
  assertEquals(good.status, 200);
  assertEquals(await good.text(), "1158201444");
  await assertApiError(await get("wrong-token"), "forbidden");
  await assertApiError(await get(VERIFY_TOKEN, "unsubscribe"), "forbidden");
});

Deno.test("wa_inbound off → 503 after the signature check, and nothing is stored", async () => {
  const h = harness({ flags: { wa_inbound: false } });
  await assertApiError(await h.fn(await signed(payload("text-stop.json"))), "flag_off");
  await assertApiError(await h.fn(await signed(payload("text-stop.json"), null)), "forbidden");
  assertEquals(h.store.messages.length, 0);
});

// ---------------------------------------------------------------------------------------------
// Sweeper
// ---------------------------------------------------------------------------------------------

Deno.test("a failed route is retried by the sweeper a minute later", async () => {
  let fail = true;
  const seen: number[] = [];
  const h = harness({
    handlers: {
      prefs: () => {
        seen.push(1);
        if (fail) throw new Error("database blip");
        return Promise.resolve({ outcome: "stopped" });
      },
    },
  });
  await post(h, "text-stop.json");
  assertEquals(inbound(h)[0]!.routeError, "internal");
  assertEquals(inbound(h)[0]!.routedAt, null);

  const sweep = (secret?: string) =>
    h.fn(fakeRequest("wa-webhook/sweep", {
      method: "POST",
      body: "{}",
      headers: secret ? { "x-plinth-dispatch-secret": secret } : {},
    }));
  await assertApiError(await sweep(), "auth_required");
  await assertApiError(await sweep("wrong"), "forbidden");

  fail = false;
  h.clock.advance(MINUTE + 1000);
  const res = await sweep(DISPATCH_SECRET);
  assertEquals(await readBody(res), { ok: true, claimed: 1, routed: 1, failed: 0 });
  assertEquals(seen.length, 2);
  assertExists(inbound(h)[0]!.routedAt);
  assertEquals(inbound(h)[0]!.routeAttempts, 2);
  assertEquals(await readBody(await sweep(DISPATCH_SECRET)), { ok: true, claimed: 0, routed: 0, failed: 0 });
});

// ---------------------------------------------------------------------------------------------
// Handler tools: reply, session, act as the user
// ---------------------------------------------------------------------------------------------

const cardButtons = replyButtons({
  body: "Aurelia Heights, Phase 2",
  buttons: [
    { id: "why_this_band", title: "Why this band" },
    { id: "follow_project", title: "Follow project" },
    { id: "ask", title: "Ask" },
  ],
});

Deno.test("reply records the request body as mock_sent (snapshot) and sets the session", async () => {
  const h = harness({
    handlers: {
      risk_card: async (input: HandlerInput, tools: HandlerTools) => {
        await tools.reply(cardButtons);
        return { outcome: "card_sent", session: { type: "card_sent", slug: String(input.route.args.slug) } };
      },
    },
  });
  await post(h, "text-aurelia.json");
  assertEquals(h.store.outbound, [{
    contactId: h.store.contacts.get(rohan.wa_id)!.id,
    waMessageId: "wamid.mock.0001",
    type: "interactive",
    payload: {
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: "Aurelia Heights, Phase 2" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "why_this_band", title: "Why this band" } },
            { type: "reply", reply: { id: "follow_project", title: "Follow project" } },
            { type: "reply", reply: { id: "ask", title: "Ask" } },
          ],
        },
      },
    },
    status: "mock_sent",
    templateCode: null,
  }]);
  const session = h.store.sessions.get(h.store.contacts.get(rohan.wa_id)!.id)!;
  assertEquals([session.state, session.context.slug], ["card_shown", "aurelia-heights-phase-2"]);
  assertEquals(session.expires_at, "2026-10-19T06:30:00.000Z");
});

Deno.test("reply sends nothing when wa_outbound is off, and a limit breach fails the route", async () => {
  const replies: unknown[] = [];
  const off = harness({
    flags: { wa_outbound: false },
    handlers: { prefs: async (_i, t) => (replies.push(await t.reply(cardButtons)), { outcome: "x" }) },
  });
  await post(off, "text-stop.json");
  assertEquals(replies, [null]);
  assertEquals(off.store.outbound.length, 0);

  const tooMany = harness({
    handlers: {
      prefs: async (_i, t) => {
        await t.reply(replyButtons({
          body: "Which alerts?",
          buttons: ["a", "b", "c", "d"].map((id) => ({ id, title: id })),
        }));
        return { outcome: "x" };
      },
    },
  });
  await post(tooMany, "text-stop.json");
  assertEquals(tooMany.store.outbound.length, 0);
  assertEquals(inbound(tooMany)[0]!.routeError, "invalid_input");
});

Deno.test("the session window closes 24 hours after the last inbound message", () => {
  const at = new Date("2026-10-19T06:30:00.000Z");
  assertSessionWindow("2026-10-18T06:30:00.000Z", at);
  let threw = false;
  try {
    assertSessionWindow("2026-10-18T06:29:59.000Z", at);
  } catch {
    threw = true;
  }
  assert(threw);
});

Deno.test('"Ask" opens the session; the next text is a question about that project', async () => {
  const h = harness({
    handlers: {
      risk_card: (input) => {
        if (input.route.action === "ask") {
          return Promise.resolve({ outcome: "ask_open", session: { type: "ask_opened" } });
        }
        return Promise.resolve({
          outcome: "card_sent",
          session: { type: "card_sent", slug: String(input.route.args.slug) },
        });
      },
    },
  });
  await post(h, "text-aurelia.json");
  const askTap = payload("interactive-why-this-band.json")
    .replace("why_this_band", "ask").replace("Why this band", "Ask")
    .replace("wamid.fixture.03296aa6", "wamid.fixture.t44-ask");
  await h.fn(await signed(askTap));
  await h.settle();
  const question = payload("text-aurelia.json")
    .replace('"aurelia"', '"When is possession due?"')
    .replace("wamid.fixture.dbc14e44", "wamid.fixture.t44-question");
  await h.fn(await signed(question));
  await h.settle();
  const last = h.calls.at(-1)!;
  assertEquals([last.name, last.input.route.rule], ["ask_fallback", "ask_session"]);
  assertEquals(last.input.route.args, { slug: "aurelia-heights-phase-2", question: "When is possession due?" });
});

async function hs256(token: string, secret: string): Promise<boolean> {
  const [h, p, s] = token.split(".");
  const sig = toBase64(await hmacSha256(secret, `${h}.${p}`))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return sig === s;
}

Deno.test("a tap from a linked number acts as that user with a ≤ 60 s whatsapp_tap JWT", async () => {
  const h = harness({
    handlers: {
      risk_card: async (_input, tools) => {
        await tools.actAsUser();
        return { outcome: "acted" };
      },
    },
  });
  h.store.link(rohan.wa_id, rohan.id);
  await post(h, "interactive-follow-project.json");
  assertEquals(h.tokens.length, 1);
  const token = h.tokens[0]!;
  assert(await hs256(token, JWT_SECRET), "HS256 with the project JWT secret");
  const claims = decodeJwtPayload(token);
  assertEquals(claims.role, "authenticated");
  assertEquals(claims.aud, "authenticated");
  assertEquals(claims.sub, rohan.id);
  assertEquals(claims.amr, [{ method: "whatsapp_tap", timestamp: claims.iat }]);
  assertEquals(claims.wa_message_id, "wamid.fixture.5348e8da-449b-5d63-bfd2-781ab1d04d13");
  assert((claims.exp as number) - (claims.iat as number) <= 60);
  assertFalse(h.logs.text().includes(token), "the token never reaches the logs");
  assertFalse(h.logs.text().includes(rohan.wa_id), "the number never reaches the logs");
});

Deno.test("no user JWT for an unlinked number or for typed text", async () => {
  const actor: WaHandler = async (_input, tools) => {
    await tools.actAsUser();
    return { outcome: "acted" };
  };
  const unlinked = harness({ handlers: { risk_card: actor } });
  await post(unlinked, "interactive-follow-project.json");
  assertEquals(unlinked.tokens.length, 0);
  assertEquals(inbound(unlinked)[0]!.routeError, "auth_required");

  const typed = harness({ handlers: { risk_card: actor } });
  typed.store.link(rohan.wa_id, rohan.id);
  await post(typed, "text-aurelia.json");
  assertEquals(typed.tokens.length, 0);
  assertEquals(inbound(typed)[0]!.routeError, "forbidden");
});
