// _shared/wa/session: the conversation state machine and the api.wa_* store adapter.
import { assertEquals, assertThrows, fakeRpc, frozenClock, HOUR, MINUTE } from "../testing/mod.ts";
import type { SessionEvent, WaSession } from "./session.ts";
import { IDLE, InvalidTransition, nextSession, readSession, rpcWaStore } from "./session.ts";
import { parseWebhook } from "./verify.ts";

const NOW = frozenClock().now();
const SLUG = "aurelia-heights-phase-2";
const at = (s: WaSession) => [s.state, s.context.slug ?? null, s.expiresAt?.toISOString() ?? null];

Deno.test("a card opens card_shown for 24 hours; follow and ask need a card first", () => {
  const card = nextSession(IDLE, { type: "card_sent", slug: SLUG }, NOW);
  assertEquals(at(card), ["card_shown", SLUG, new Date(NOW.getTime() + 24 * HOUR).toISOString()]);
  assertThrows(() => nextSession(IDLE, { type: "follow_offered" }, NOW), InvalidTransition);
  assertThrows(() => nextSession(IDLE, { type: "ask_opened" }, NOW), InvalidTransition);

  const follow = nextSession(card, { type: "follow_offered" }, NOW);
  assertEquals(at(follow), [
    "follow_offer",
    SLUG,
    new Date(NOW.getTime() + 30 * MINUTE).toISOString(),
  ]);
  const ask = nextSession(card, { type: "ask_opened" }, NOW);
  assertEquals(at(ask).slice(0, 2), ["ask_open", SLUG]);
});

Deno.test("done returns to the card; stop always ends in idle", () => {
  const card = nextSession(IDLE, { type: "card_sent", slug: SLUG }, NOW);
  const table: [WaSession, SessionEvent, string][] = [
    [card, { type: "done" }, "idle"],
    [nextSession(card, { type: "ask_opened" }, NOW), { type: "done" }, "card_shown"],
    [nextSession(card, { type: "follow_offered" }, NOW), { type: "done" }, "card_shown"],
    [nextSession(card, { type: "follow_offered" }, NOW), { type: "ask_opened" }, "ask_open"],
    [
      nextSession(card, { type: "ask_opened" }, NOW),
      { type: "card_sent", slug: "kestrel-park" },
      "card_shown",
    ],
  ];
  for (const [from, event, to] of table) assertEquals(nextSession(from, event, NOW).state, to);
  for (const s of ["card_shown", "follow_offer", "ask_open"] as const) {
    const from: WaSession = { state: s, context: { slug: SLUG }, expiresAt: null };
    assertEquals(nextSession(from, { type: "stop" }, NOW), IDLE);
  }
  const switched = nextSession(card, { type: "card_sent", slug: "kestrel-park" }, NOW);
  assertEquals(switched.context.slug, "kestrel-park");
});

Deno.test("readSession: expired, unknown or slug-less sessions read as idle", () => {
  const later = new Date(NOW.getTime() + 25 * HOUR).toISOString();
  const earlier = new Date(NOW.getTime() - 1).toISOString();
  assertEquals(readSession(null, NOW), IDLE);
  assertEquals(
    readSession({ state: "card_shown", context: { slug: SLUG }, expires_at: earlier }, NOW),
    IDLE,
  );
  assertEquals(readSession({ state: "warp", context: {}, expires_at: null }, NOW), IDLE);
  assertEquals(readSession({ state: "ask_open", context: {}, expires_at: later }, NOW), IDLE);
  assertEquals(
    at(readSession({ state: "ask_open", context: { slug: SLUG }, expires_at: later }, NOW)),
    ["ask_open", SLUG, later],
  );
});

Deno.test("rpcWaStore calls the api.wa_* functions with redacted payloads", async () => {
  const contact = { id: "c-1", wa_id: "919900000318", user_id: null, utility_opt_in: true };
  const rpc = fakeRpc({
    wa_ingest_inbound: { data: { duplicate: false, message_id: "m-1", contact } },
    wa_apply_status: { data: { messages: 1, outbox: null } },
    wa_claim_unrouted: {
      data: [{
        message_id: "m-1",
        wa_message_id: "wamid.x",
        type: "text",
        payload: { id: "wamid.x", type: "text", timestamp: "1792305000", text: { body: "STOP" } },
        attempt: 2,
        contact,
      }],
    },
  });
  const store = rpcWaStore(rpc);
  const body = await Deno.readTextFile(
    new URL("../../../../packages/fixtures/recorded/wa/text-stop.json", import.meta.url),
  );
  const [msg] = parseWebhook(body).messages;
  const ingested = await store.ingest(msg!);
  assertEquals(ingested.duplicate, false);
  assertEquals(ingested.contact.waId, "919900000318");
  const args = rpc.calls[0]!.args;
  assertEquals(args.p_wa_id, "919900000318");
  assertEquals("from" in (args.p_payload as Record<string, unknown>), false);
  assertEquals(args.p_received_at, "2026-10-18T06:30:00.000Z");

  const claimed = await store.claimUnrouted();
  assertEquals(claimed.map((c) => [c.messageId, c.attempt, c.message.text, c.message.from]), [
    ["m-1", 2, "STOP", "919900000318"],
  ]);
  assertEquals(rpc.calls.at(-1)!.args, { p_limit: 25, p_max_attempts: 5, p_stale_seconds: 60 });
});
