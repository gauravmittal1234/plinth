// ask_fallback on T03b's recorded payloads (packages/fixtures/recorded/wa) and the golden
// api.search_projects fixtures (packages/fixtures/expected/search_projects): the outside-coverage
// and unknown-project answers are that payload's own zero_results.line, never composed here. No
// network: api.* calls go through a fake RpcClient. Run: npx --yes deno@2 task test (in
// supabase/functions).

import { createLogger } from "../../_shared/core/log.ts";
import { flagsReader } from "../../_shared/core/flags.ts";
import { assertEquals, captureLogs, fakeRpc, frozenClock } from "../../_shared/testing/mod.ts";
import type { RpcAnswer, RpcCall } from "../../_shared/testing/rpc.ts";
import type { OutboundMessage } from "../../_shared/wa/graph.ts";
import { IDLE } from "../../_shared/wa/session.ts";
import type { WaContact, WaSession } from "../../_shared/wa/session.ts";
import { parseWebhook } from "../../_shared/wa/verify.ts";
import type { InboundMessage } from "../../_shared/wa/verify.ts";
import { askFallback } from "./ask_fallback.ts";
import type { HandlerInput, HandlerTools, Route } from "../router.ts";
import { routeInbound } from "../router.ts";

const ROOT = new URL("../../../../", import.meta.url);
const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await Deno.readTextFile(new URL(path, ROOT))) as T;
const readFixtureText = (path: string) => Deno.readTextFile(new URL(path, ROOT));

const OUTSIDE_COVERAGE = await readJson<{ zero_results: { kind: string; line: string } }>(
  "packages/fixtures/expected/search_projects/outside-coverage.json",
);
const UNKNOWN_PROJECT = await readJson<{ zero_results: { kind: string; line: string } }>(
  "packages/fixtures/expected/search_projects/unknown-project.json",
);
const PEOPLE = await readJson<{ people: { key: string; id: string; wa_id: string }[] }>(
  "packages/fixtures/canonical/people.json",
);
const rohan = PEOPLE.people.find((p) => p.key === "rohan")!;

const ROHAN: WaContact = {
  id: "contact-rohan",
  waId: rohan.wa_id,
  userId: rohan.id,
  utilityOptIn: false,
  stoppedAt: null,
  lastInboundAt: "2026-10-18T06:00:00.000Z",
};

async function recordedMessage(file: string): Promise<InboundMessage> {
  const raw = await readFixtureText(`packages/fixtures/recorded/wa/${file}`);
  const events = parseWebhook(raw);
  return events.messages[0]!;
}

interface Harness {
  tools: HandlerTools;
  replies: OutboundMessage[];
  service: { calls: RpcCall[] };
}

function harness(serviceAnswers: Record<string, RpcAnswer> = {}): Harness {
  const replies: OutboundMessage[] = [];
  const service = fakeRpc(serviceAnswers);
  const logs = captureLogs();
  const tools: HandlerTools = {
    reply(message) {
      replies.push(message);
      return Promise.resolve({ waMessageId: `wamid.mock.${replies.length}`, status: "mock_sent" });
    },
    actAsUser() {
      return Promise.reject(new Error("ask_fallback never acts as the tapper"));
    },
    service,
    flags: flagsReader(() => Promise.resolve({ schema: "plinth.flags/1", flags: {} })),
    log: createLogger({ fn: "test", sink: logs.sink }),
    clock: frozenClock(),
  };
  return { tools, replies, service };
}

function questionMessage(waMessageId: string, text: string): InboundMessage {
  return {
    waMessageId,
    from: ROHAN.waId,
    type: "text",
    timestamp: new Date("2026-10-18T06:30:00Z"),
    contextId: null,
    text,
    replyId: null,
    interactiveType: null,
    mediaId: null,
    raw: { id: waMessageId, from: ROHAN.waId, type: "text", text: { body: text } },
  };
}

async function fallbackRouteFor(text: string, session: WaSession = IDLE) {
  const message = questionMessage(`wamid.fixture.t46a-${text.length}`, text);
  const route = await routeInbound(message, { session, findProject: () => Promise.resolve(null) });
  return { route, message };
}

// ---------------------------------------------------------------------------------------------
// Deferred capabilities named by the router (later milestones)
// ---------------------------------------------------------------------------------------------

Deno.test("a forwarded document gets the honest doc_check 'not yet', never a guessed answer", async () => {
  const message = await recordedMessage("document-demand-letter.json");
  const route = await routeInbound(message, {
    session: IDLE,
    findProject: () => Promise.resolve(null),
  });
  assertEquals(route.args.deferred, "doc_check");
  const h = harness();
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "deferred" });
  assertEquals(h.replies, [
    {
      type: "text",
      text: {
        body:
          "We can't read documents on WhatsApp yet. Send the project name or its RERA number and we'll show the current band.",
      },
    },
  ]);
  assertEquals(h.service.calls.length, 0);
});

Deno.test("a voice note gets the honest transcribe 'not yet'", async () => {
  const message = await recordedMessage("audio-voice-note.json");
  const route = await routeInbound(message, {
    session: IDLE,
    findProject: () => Promise.resolve(null),
  });
  assertEquals(route.args.deferred, "transcribe");
  const h = harness();
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "deferred" });
  assertEquals(h.replies.length, 1);
  assertEquals(
    (h.replies[0] as { text: { body: string } }).text.body.startsWith(
      "We can't listen to voice notes",
    ),
    true,
  );
});

Deno.test("an unsupported media type with no named deferred route gets the generic 'not yet'", async () => {
  const message: InboundMessage = {
    waMessageId: "wamid.fixture.sticker",
    from: ROHAN.waId,
    type: "sticker",
    timestamp: new Date("2026-10-18T06:30:00Z"),
    contextId: null,
    text: null,
    replyId: null,
    interactiveType: null,
    mediaId: "1",
    raw: { id: "wamid.fixture.sticker", type: "sticker", sticker: { id: "1" } },
  };
  const route: Route = {
    handler: "ask_fallback",
    rule: "fallback",
    action: "unsupported",
    args: { slug: null, question: null, deferred: "unsupported_media" },
  };
  const h = harness();
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);
  assertEquals(result, { outcome: "deferred" });
});

// ---------------------------------------------------------------------------------------------
// Questions: outside coverage, unknown project, "should I buy?", and the M2 generic refusal
// ---------------------------------------------------------------------------------------------

Deno.test("a Noida query relays api.search_projects's own outside-coverage line", async () => {
  const { route, message } = await fallbackRouteFor("3 bhk noida");
  assertEquals(route.rule, "fallback");
  assertEquals(route.args.question, "3 bhk noida");
  const h = harness({ search_projects: { data: OUTSIDE_COVERAGE } });
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "answered" });
  assertEquals(h.service.calls[0]!.fn, "search_projects");
  assertEquals(h.service.calls[0]!.args, { p_q: "3 bhk noida" });
  assertEquals(h.replies, [{ type: "text", text: { body: OUTSIDE_COVERAGE.zero_results.line } }]);
});

Deno.test("an unknown project name relays api.search_projects's own unknown-project line", async () => {
  const { route, message } = await fallbackRouteFor("Indigo Terraces");
  const h = harness({ search_projects: { data: UNKNOWN_PROJECT } });
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "answered" });
  assertEquals(h.replies, [{ type: "text", text: { body: UNKNOWN_PROJECT.zero_results.line } }]);
});

Deno.test('"Should I buy?" never answers yes or no', async () => {
  const { route, message } = await fallbackRouteFor("should I buy this flat?");
  const h = harness();
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "answered" });
  assertEquals(h.service.calls.length, 0);
  const body = (h.replies[0] as { text: { body: string } }).text.body;
  assertEquals(body.startsWith("We can't tell you whether to buy."), true);
  assertEquals(body.includes("yes"), false);
});

Deno.test("a question with no zero-result gets the M2 generic refusal, and returns an open ask to the card", async () => {
  const session: WaSession = {
    state: "ask_open",
    context: { slug: "aurelia-heights-phase-2" },
    expiresAt: null,
  };
  const message = questionMessage("wamid.fixture.t46a-ask", "When is possession due?");
  const route = await routeInbound(message, { session, findProject: () => Promise.resolve(null) });
  assertEquals(route.rule, "ask_session");
  const h = harness({
    search_projects: {
      data: {
        schema: "plinth.search_results/1",
        query: "When is possession due?",
        zero_results: null,
      },
    },
  });
  const result = await askFallback({ route, message, contact: ROHAN, session }, h.tools);

  assertEquals(result, { outcome: "answered", session: { type: "done" } });
  assertEquals(h.replies, [
    {
      type: "text",
      text: {
        body:
          "Ask Plinth's full answers are arriving on WhatsApp soon. Send a project name or its RERA number and we'll show the current band, or visit plinth.in to ask in full.",
      },
    },
  ]);
});

Deno.test("search_projects not existing yet degrades to the honest generic refusal, never a crash", async () => {
  const { route, message } = await fallbackRouteFor("will aurelia get possession on time");
  const h = harness(); // no answers configured: fakeRpc answers PGRST202
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "answered" });
  assertEquals(h.replies.length, 1);
});

Deno.test("no question at all (a non-text message nothing else matched) asks for one", async () => {
  const message: InboundMessage = {
    waMessageId: "wamid.fixture.contacts",
    from: ROHAN.waId,
    type: "contacts",
    timestamp: new Date("2026-10-18T06:30:00Z"),
    contextId: null,
    text: null,
    replyId: null,
    interactiveType: null,
    mediaId: null,
    raw: { id: "wamid.fixture.contacts", type: "contacts" },
  };
  const route: Route = {
    handler: "ask_fallback",
    rule: "fallback",
    action: "unsupported",
    args: { slug: null, question: null, deferred: null },
  };
  const h = harness();
  const result = await askFallback({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "no_question" });
  assertEquals(h.replies, [
    {
      type: "text",
      text: { body: "Send a project name, a Gurugram RERA number, or type your question." },
    },
  ]);
  assertEquals(h.service.calls.length, 0);
});
