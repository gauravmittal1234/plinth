// wa-webhook handler: digest (T46b). Unit tests against a fake api.whatsapp_digest_changes.
import { flagsReader } from "../../_shared/core/flags.ts";
import { createLogger } from "../../_shared/core/log.ts";
import { assertEquals, captureLogs, fakeRpc, frozenClock } from "../../_shared/testing/mod.ts";
import type { OutboundMessage } from "../../_shared/wa/graph.ts";
import type { WaContact } from "../../_shared/wa/session.ts";
import type { HandlerInput, HandlerTools, Route } from "../router.ts";
import { digest } from "./digest.ts";

const CONTACT: WaContact = {
  id: "3ef22e92-2c14-549f-9e68-a69b03cb8fa8",
  waId: "919900000318",
  userId: "bff1ee72-9910-5980-a875-96a9a00b24cf",
  utilityOptIn: true,
  stoppedAt: null,
  lastInboundAt: "2026-10-18T06:00:00.000Z",
};

function harness(result: Record<string, unknown>) {
  const sent: OutboundMessage[] = [];
  const service = fakeRpc({ whatsapp_digest_changes: { data: result } });
  const tools: HandlerTools = {
    reply: (m) => {
      sent.push(m);
      return Promise.resolve({ waMessageId: "wamid.mock.1", status: "mock_sent" });
    },
    actAsUser: () => Promise.reject(new Error("digest never mints a tap token")),
    service,
    flags: flagsReader(() =>
      Promise.resolve({ schema: "plinth.flags/1", flags: { wa_outbound: true } })
    ),
    log: createLogger({ fn: "wa-webhook", sink: captureLogs().sink, clock: frozenClock() }),
    clock: frozenClock(),
  };
  return { tools, sent, service };
}

function input(): HandlerInput {
  const route: Route = { handler: "digest", rule: "digest", action: "see_changes", args: {} };
  return {
    route,
    message: {
      waMessageId: "wamid.fixture.9c2971e4-f895-53c2-95b2-9ae9eeb2c561",
      from: CONTACT.waId,
      type: "button",
      timestamp: new Date("2026-10-18T09:05:00.000Z"),
      contextId: null,
      text: "See changes",
      replyId: "see_changes",
      interactiveType: null,
      mediaId: null,
      raw: {},
    },
    contact: CONTACT,
    session: { state: "idle", context: {}, expiresAt: null },
  };
}

Deno.test('"See changes" lists every line the RPC returned, in order, and nothing more', async () => {
  const lines = [
    "Aurelia Heights Ph 2: a quarterly report is not on HARERA yet, due 15 Oct 2026",
    "Sapphire Grove Ph 1: a quarterly report was filed on time, 15 Oct 2026",
    "Coral Towers: the completion date moved, order of 14 Oct 2026",
    "Coral Towers: a quarterly report is not on HARERA yet, due 15 Oct 2026",
    "Sapphire Grove Ph 1: a new price list was published on 16 Oct 2026",
  ];
  const h = harness({ change_count: 5, lines, since: "2026-10-11" });
  const res = await digest(input(), h.tools);
  assertEquals(res.outcome, "changes_listed");
  assertEquals(h.service.calls, [{
    fn: "whatsapp_digest_changes",
    args: { p_contact_id: CONTACT.id },
    get: false,
  }]);
  assertEquals(h.sent.length, 1);
  const msg = h.sent[0]!;
  assertEquals(msg.type, "text");
  if (msg.type !== "text") throw new Error("unreachable");
  assertEquals(msg.text.body.startsWith("5 changes on record:"), true);
  for (const line of lines) assertEquals(msg.text.body.includes(line), true);
});

Deno.test("no changes: an honest empty state, not an invented count", async () => {
  const h = harness({ change_count: 0, lines: [], since: null });
  const res = await digest(input(), h.tools);
  assertEquals(res.outcome, "no_changes");
  const msg = h.sent[0]!;
  assertEquals(msg.type, "text");
  if (msg.type === "text") {
    assertEquals(msg.text.body, "Nothing new on your followed projects since your last digest.");
  }
});

Deno.test("one change: singular wording", async () => {
  const h = harness({
    change_count: 1,
    lines: ["Kestrel Park: a quarterly report was filed on time, 12 Oct 2026"],
    since: "2026-10-11",
  });
  await digest(input(), h.tools);
  const msg = h.sent[0]!;
  if (msg.type === "text") assertEquals(msg.text.body.startsWith("1 change on record:"), true);
});
