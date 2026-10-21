// wa-webhook handler: prefs (T46b). Unit tests against a fake api.whatsapp_prefs_stop; no
// network, no database (Deno tests run with no net permission).
import { flagsReader } from "../../_shared/core/flags.ts";
import { createLogger } from "../../_shared/core/log.ts";
import { assertEquals, captureLogs, fakeRpc, frozenClock } from "../../_shared/testing/mod.ts";
import type { OutboundMessage } from "../../_shared/wa/graph.ts";
import type { WaContact } from "../../_shared/wa/session.ts";
import type { HandlerInput, HandlerTools, Route } from "../router.ts";
import { prefs } from "./prefs.ts";

const CONTACT: WaContact = {
  id: "0e6a7e4a-0000-4000-8000-000000000001",
  waId: "919900000318",
  userId: "bff1ee72-9910-5980-a875-96a9a00b24cf",
  utilityOptIn: true,
  stoppedAt: null,
  lastInboundAt: "2026-10-18T06:00:00.000Z",
};

function harness(result: Record<string, unknown>) {
  const sent: OutboundMessage[] = [];
  const service = fakeRpc({ whatsapp_prefs_stop: { data: result } });
  const tools: HandlerTools = {
    reply: (m) => {
      sent.push(m);
      return Promise.resolve({ waMessageId: "wamid.mock.1", status: "mock_sent" });
    },
    actAsUser: () => Promise.reject(new Error("prefs never mints a tap token")),
    service,
    flags: flagsReader(() =>
      Promise.resolve({ schema: "plinth.flags/1", flags: { wa_outbound: true } })
    ),
    log: createLogger({ fn: "wa-webhook", sink: captureLogs().sink, clock: frozenClock() }),
    clock: frozenClock(),
  };
  return { tools, sent, service };
}

function input(action: string): HandlerInput {
  const route: Route = { handler: "prefs", rule: "stop", action, args: {} };
  return {
    route,
    message: {
      waMessageId: "wamid.fixture.stop",
      from: CONTACT.waId,
      type: "text",
      timestamp: new Date("2026-10-18T06:00:00.000Z"),
      contextId: null,
      text: "STOP",
      replyId: null,
      interactiveType: null,
      mediaId: null,
      raw: {},
    },
    contact: CONTACT,
    session: { state: "idle", context: {}, expiresAt: null },
  };
}

Deno.test("stop_all: a plain text confirmation, never mints a tap token", async () => {
  const h = harness({
    action: "stop_all",
    linked: true,
    stopped: true,
    band_change_on: false,
    digest_on: false,
    digest_cadence: null,
  });
  const res = await prefs(input("stop_all"), h.tools);
  assertEquals(res.outcome, "stop_all");
  assertEquals(h.service.calls, [{
    fn: "whatsapp_prefs_stop",
    args: { p_contact_id: CONTACT.id, p_action: "stop_all" },
    get: false,
  }]);
  assertEquals(h.sent.length, 1);
  const msg = h.sent[0]!;
  assertEquals(msg.type, "text");
  if (msg.type === "text") {
    assertEquals(msg.text.body.startsWith("Done. No more WhatsApp alerts"), true);
  }
});

Deno.test('"Stop weekly" while band changes stay on: the reply says so, button offers "Turn weekly on"', async () => {
  const h = harness({
    action: "stop_weekly",
    linked: true,
    stopped: false,
    band_change_on: true,
    digest_on: false,
    digest_cadence: "off",
  });
  await prefs(input("stop_weekly"), h.tools);
  const msg = h.sent[0]!;
  assertEquals(msg.type, "interactive");
  if (msg.type !== "interactive" || msg.interactive.type !== "button") {
    throw new Error("expected reply buttons");
  }
  assertEquals(
    msg.interactive.body.text.includes("Band changes for your projects still reach you"),
    true,
  );
  assertEquals(msg.interactive.action.buttons, [{
    type: "reply",
    reply: { id: "stop_weekly", title: "Turn weekly on" },
  }]);
});

Deno.test('tapping "Turn weekly on" (the same stop_weekly id) confirms it is back on', async () => {
  const h = harness({
    action: "stop_weekly",
    linked: true,
    stopped: false,
    band_change_on: true,
    digest_on: true,
    digest_cadence: "weekly_sun_9am",
  });
  await prefs(input("stop_weekly"), h.tools);
  const msg = h.sent[0]!;
  if (msg.type !== "interactive" || msg.interactive.type !== "button") {
    throw new Error("expected reply buttons");
  }
  assertEquals(msg.interactive.body.text, "Your weekly updates are back on.");
  assertEquals(msg.interactive.action.buttons, [{
    type: "reply",
    reply: { id: "stop_weekly", title: "Stop weekly" },
  }]);
});

Deno.test('"Stop alerts" on an unlinked number: an honest line, no record of a change that never happened', async () => {
  const h = harness({
    action: "stop_alerts",
    linked: false,
    stopped: false,
    band_change_on: false,
    digest_on: false,
    digest_cadence: null,
  });
  await prefs(input("stop_alerts"), h.tools);
  const msg = h.sent[0]!;
  assertEquals(msg.type, "text");
  if (msg.type === "text") {
    assertEquals(msg.text.body, "You don't have project alerts on WhatsApp yet.");
  }
});

Deno.test("an action the router never sends is logged and nothing is sent", async () => {
  const h = harness({});
  const res = await prefs(input("stop_everything"), h.tools);
  assertEquals(res.outcome, "unknown_action");
  assertEquals(h.sent.length, 0);
  assertEquals(h.service.calls.length, 0);
});
