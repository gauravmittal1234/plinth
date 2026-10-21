// wa-webhook handler: family_join (T46b). Unit tests against a fake api.whatsapp_family_join; the
// RPC itself is proved end to end against a real database by T45a's pgTAP test
// (supabase/tests/buyer_api/003_family.test.sql, "JOIN <code> from WhatsApp joins the circle").
import { flagsReader } from "../../_shared/core/flags.ts";
import { createLogger } from "../../_shared/core/log.ts";
import { assertEquals, captureLogs, fakeRpc, frozenClock } from "../../_shared/testing/mod.ts";
import type { OutboundMessage } from "../../_shared/wa/graph.ts";
import type { WaContact } from "../../_shared/wa/session.ts";
import type { HandlerInput, HandlerTools, Route } from "../router.ts";
import { familyJoin } from "./family_join.ts";

const CONTACT: WaContact = {
  id: "1245595c-5be3-5825-8197-945fc4a3ef1e",
  waId: "919900000320",
  userId: null,
  utilityOptIn: false,
  stoppedAt: null,
  lastInboundAt: "2026-10-18T06:00:00.000Z",
};

function harness(
  answer: { data: unknown } | { error: { code: string; message: string; details?: string } },
) {
  const sent: OutboundMessage[] = [];
  const service = fakeRpc({ whatsapp_family_join: answer });
  const tools: HandlerTools = {
    reply: (m) => {
      sent.push(m);
      return Promise.resolve({ waMessageId: "wamid.mock.1", status: "mock_sent" });
    },
    actAsUser: () => Promise.reject(new Error("family_join never mints a tap token")),
    service,
    flags: flagsReader(() =>
      Promise.resolve({ schema: "plinth.flags/1", flags: { wa_outbound: true } })
    ),
    log: createLogger({ fn: "wa-webhook", sink: captureLogs().sink, clock: frozenClock() }),
    clock: frozenClock(),
  };
  return { tools, sent, service };
}

function input(code: unknown): HandlerInput {
  const route: Route = { handler: "family_join", rule: "join", action: "join", args: { code } };
  return {
    route,
    message: {
      waMessageId: "wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f",
      from: CONTACT.waId,
      type: "text",
      timestamp: new Date("2026-10-18T06:00:00.000Z"),
      contextId: null,
      text: `JOIN ${code}`,
      replyId: null,
      interactiveType: null,
      mediaId: null,
      raw: {},
    },
    contact: CONTACT,
    session: { state: "idle", context: {}, expiresAt: null },
  };
}

Deno.test("JOIN AH2-7KQ: calls the RPC with the contact, code and inbound message id", async () => {
  const h = harness({
    data: {
      member_id: "0209e42c-7fec-5e5b-bfa8-525bb990232b",
      inviter_first_name: "Rohan",
      scope_line: "Aurelia Heights, Phase 2",
      joined_line: "You'll get the same alerts as Rohan for Aurelia Heights, Phase 2.",
      number_line: "Rohan sees that you joined, never your number.",
    },
  });
  const res = await familyJoin(input("AH2-7KQ"), h.tools);
  assertEquals(res.outcome, "joined");
  assertEquals(h.service.calls, [{
    fn: "whatsapp_family_join",
    args: {
      p_contact_id: CONTACT.id,
      p_code: "AH2-7KQ",
      p_wa_message_id: "wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f",
    },
    get: false,
  }]);
  assertEquals(h.sent.length, 1);
  const msg = h.sent[0]!;
  assertEquals(msg.type, "text");
  if (msg.type === "text") {
    assertEquals(
      msg.text.body,
      "You'll get the same alerts as Rohan for Aurelia Heights, Phase 2. Rohan sees that you joined, never your number.",
    );
  }
});

Deno.test("a used or unknown code: the RPC's own neutral sentence is the reply, not retried", async () => {
  const h = harness({
    error: {
      code: "PT404",
      message: "not_found",
      details: "This invite link isn't valid any more. Ask for a new one.",
    },
  });
  const res = await familyJoin(input("ZZZ-999"), h.tools);
  assertEquals(res.outcome, "join_refused_not_found");
  assertEquals(h.sent.length, 1);
  const msg = h.sent[0]!;
  assertEquals(msg.type, "text");
  if (msg.type === "text") {
    assertEquals(msg.text.body, "This invite link isn't valid any more. Ask for a new one.");
  }
});

Deno.test("no code on the route: nothing is sent", async () => {
  const h = harness({ data: {} });
  const res = await familyJoin(input(undefined), h.tools);
  assertEquals(res.outcome, "no_code");
  assertEquals(h.sent.length, 0);
  assertEquals(h.service.calls.length, 0);
});

Deno.test("an unexpected failure (not a refusal) is left for the sweeper to retry", async () => {
  const h = harness({ error: { code: "PT500", message: "internal" } });
  let threw = false;
  try {
    await familyJoin(input("AH2-7KQ"), h.tools);
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
  assertEquals(h.sent.length, 0);
});
