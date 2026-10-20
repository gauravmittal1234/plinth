// risk_card on T03b's recorded payloads (packages/fixtures/recorded/wa) and the golden
// api.risk_summary fixture (packages/fixtures/expected/risk_summary/aurelia-heights-phase-2.json):
// every word in a reply is that payload's own field, never composed here. No network: the router's
// own parser reads the recorded body, and api.* calls go through a fake RpcClient. Run:
// npx --yes deno@2 task test (in supabase/functions).

import { createLogger } from "../../_shared/core/log.ts";
import { flagsReader } from "../../_shared/core/flags.ts";
import type { RiskSummary } from "../../_shared/core/contracts.ts";
import {
  assert,
  assertEquals,
  captureLogs,
  fakeRpc,
  frozenClock,
} from "../../_shared/testing/mod.ts";
import type { RpcAnswer, RpcCall } from "../../_shared/testing/rpc.ts";
import { limitProblems, replyButtons } from "../../_shared/wa/graph.ts";
import type { OutboundMessage } from "../../_shared/wa/graph.ts";
import { IDLE } from "../../_shared/wa/session.ts";
import type { WaContact, WaSession } from "../../_shared/wa/session.ts";
import { parseWebhook } from "../../_shared/wa/verify.ts";
import type { InboundMessage } from "../../_shared/wa/verify.ts";
import { riskCard } from "./risk_card.ts";
import type { HandlerInput, HandlerTools, ProjectFinder, Route } from "../router.ts";
import { routeInbound } from "../router.ts";

const ROOT = new URL("../../../../", import.meta.url);
const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await Deno.readTextFile(new URL(path, ROOT))) as T;

const AURELIA_RISK = await readJson<RiskSummary>(
  "packages/fixtures/expected/risk_summary/aurelia-heights-phase-2.json",
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
  const raw = await Deno.readTextFile(new URL(`packages/fixtures/recorded/wa/${file}`, ROOT));
  const events = parseWebhook(raw);
  return events.messages[0]!;
}

const findAurelia: ProjectFinder = (text) =>
  Promise.resolve(
    text.toLowerCase().includes("aurelia")
      ? { slug: "aurelia-heights-phase-2", label: "Aurelia Heights, Phase 2", matchedOn: "name" }
      : null,
  );

async function routeFor(
  file: string,
  session: WaSession,
  findProject: ProjectFinder = () => Promise.resolve(null),
): Promise<{ route: Route; message: InboundMessage }> {
  const message = await recordedMessage(file);
  const route = await routeInbound(message, { session, findProject });
  return { route, message };
}

interface Harness {
  tools: HandlerTools;
  replies: OutboundMessage[];
  service: { calls: RpcCall[] };
  user: { calls: RpcCall[] };
  acted: number;
}

function harness(
  opts: {
    serviceAnswers?: Record<string, RpcAnswer>;
    userAnswers?: Record<string, RpcAnswer>;
    actAsUserError?: Error;
  } = {},
): Harness {
  const replies: OutboundMessage[] = [];
  const service = fakeRpc(opts.serviceAnswers ?? {});
  const user = fakeRpc(opts.userAnswers ?? {});
  const logs = captureLogs();
  let acted = 0;
  const tools: HandlerTools = {
    reply(message) {
      replies.push(message);
      return Promise.resolve({ waMessageId: `wamid.mock.${replies.length}`, status: "mock_sent" });
    },
    actAsUser() {
      acted++;
      if (opts.actAsUserError) return Promise.reject(opts.actAsUserError);
      return Promise.resolve(user);
    },
    service,
    flags: flagsReader(() => Promise.resolve({ schema: "plinth.flags/1", flags: {} })),
    log: createLogger({ fn: "test", sink: logs.sink }),
    clock: frozenClock(),
  };
  return {
    tools,
    replies,
    service,
    user,
    get acted() {
      return acted;
    },
  };
}

function inputFor(route: Route, message: InboundMessage, session: WaSession): HandlerInput {
  return { route, message, contact: ROHAN, session };
}

function cardShown(slug: string): WaSession {
  return { state: "card_shown", context: { slug }, expiresAt: null };
}

function expectedCaption(risk: RiskSummary): string {
  return [...risk.share.lines, risk.share.source_line, risk.share.caption].join("\n");
}

function expectedButtons(risk: RiskSummary): OutboundMessage {
  return replyButtons({
    body: `${risk.phase.name}\n${risk.meta.live_url}`,
    buttons: [
      { id: "why_this_band", title: "Why this band" },
      { id: "follow_project", title: "Follow project" },
      { id: "ask", title: "Ask" },
    ],
  });
}

// ---------------------------------------------------------------------------------------------
// A project name or a RERA number resolves, then sends share.card_url + caption + the 3 buttons
// ---------------------------------------------------------------------------------------------

Deno.test("a project-name match sends the risk card image, caption and the 3 buttons", async () => {
  const { route, message } = await routeFor("text-aurelia.json", IDLE, findAurelia);
  const h = harness({ serviceAnswers: { risk_summary: { data: AURELIA_RISK } } });
  const result = await riskCard(inputFor(route, message, IDLE), h.tools);

  assertEquals(result, {
    outcome: "card_sent",
    session: { type: "card_sent", slug: "aurelia-heights-phase-2" },
  });
  assertEquals(h.replies, [
    {
      type: "image",
      image: { link: AURELIA_RISK.share.card_url, caption: expectedCaption(AURELIA_RISK) },
    },
    expectedButtons(AURELIA_RISK),
  ]);
  assertEquals(h.service.calls.map((c) => c.fn), ["risk_summary"]);
  assertEquals(h.service.calls[0]!.args, { p_slug: "aurelia-heights-phase-2" });
});

Deno.test("a RERA number resolves through api.suggest, then sends the same card", async () => {
  const { route, message } = await routeFor("text-rera-number.json", IDLE);
  assertEquals(route.args.rera, "GGM/673/405/2022/117");
  const h = harness({
    serviceAnswers: {
      suggest: {
        data: {
          schema: "plinth.suggest/1",
          q: "GGM/673/405/2022/117",
          items: [{
            kind: "phase",
            slug: "aurelia-heights-phase-2",
            label: "Aurelia Heights, Phase 2",
            detail_line: null,
            matched_on: "rera_number",
          }],
        },
      },
      risk_summary: { data: AURELIA_RISK },
    },
  });
  const result = await riskCard(inputFor(route, message, IDLE), h.tools);

  assertEquals(result.outcome, "card_sent");
  assertEquals(h.service.calls.map((c) => c.fn), ["suggest", "risk_summary"]);
  assertEquals(h.service.calls[0]!.args, { p_q: "GGM/673/405/2022/117" });
  assertEquals(h.replies.length, 2);
});

Deno.test("a RERA number api.suggest can't match gets the honest not-found line, no card", async () => {
  const { route, message } = await routeFor("text-rera-number.json", IDLE);
  const h = harness({
    serviceAnswers: {
      suggest: { data: { schema: "plinth.suggest/1", q: "x", items: [] } },
    },
  });
  const result = await riskCard(inputFor(route, message, IDLE), h.tools);

  assertEquals(result, { outcome: "not_found" });
  assertEquals(h.replies.length, 1);
  assertEquals(h.replies[0], {
    type: "text",
    text: {
      body:
        "We don't have a project at that address. Send its name or RERA number and we'll show the current band.",
    },
  });
});

Deno.test("a short link code (no resolver RPC yet) gets the same honest not-found line", async () => {
  const session = IDLE;
  const route: Route = {
    handler: "risk_card",
    rule: "link",
    action: "card",
    args: { short_code: "AH2" },
  };
  const message = await recordedMessage("text-aurelia.json");
  const h = harness();
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result, { outcome: "not_found" });
  assertEquals(h.service.calls.length, 0);
});

// ---------------------------------------------------------------------------------------------
// Card buttons: why this band, follow project, ask, yes/not now, open full card
// ---------------------------------------------------------------------------------------------

Deno.test('"Why this band" sends the reasons text with sources, nothing composed', async () => {
  const session = cardShown("aurelia-heights-phase-2");
  const { route, message } = await routeFor("interactive-why-this-band.json", session);
  assertEquals(route.action, "why_this_band");
  const h = harness({ serviceAnswers: { risk_summary: { data: AURELIA_RISK } } });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result, { outcome: "why_this_band" });
  assertEquals(h.replies.length, 1);
  const reply = h.replies[0] as { type: "text"; text: { body: string } };
  assertEquals(reply.type, "text");
  assert(reply.text.body.startsWith("Why Elevated? The 4 reasons:"));
  for (const r of AURELIA_RISK.reasons) {
    assert(reply.text.body.includes(r.text), `missing reason: ${r.text}`);
    for (const s of r.sources) {
      assert(reply.text.body.includes(s.label), `missing source: ${s.label}`);
    }
  }
  assert(reply.text.body.includes(AURELIA_RISK.what_would_change!));
  assert(reply.text.body.includes(AURELIA_RISK.meta.live_url));
});

Deno.test('"Follow project" sends the opt-in buttons and opens follow_offer', async () => {
  const session = cardShown("aurelia-heights-phase-2");
  const { route, message } = await routeFor("interactive-follow-project.json", session);
  assertEquals(route.action, "follow_project");
  const h = harness({ serviceAnswers: { risk_summary: { data: AURELIA_RISK } } });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result, {
    outcome: "follow_offered",
    session: { type: "follow_offered", slug: "aurelia-heights-phase-2" },
  });
  assertEquals(h.replies, [
    replyButtons({
      body:
        "Get alerts here when this project's band changes, its date is extended, or it files or misses a QPR? At most 1 message a day. Reply STOP anytime.",
      buttons: [
        { id: "yes_alert_me", title: "Yes, alert me" },
        { id: "not_now", title: "Not now" },
      ],
    }),
  ]);
});

Deno.test('"Yes, alert me" confirms only after api.follow (acted as the tapper) succeeds', async () => {
  const route: Route = {
    handler: "risk_card",
    rule: "card_button",
    action: "yes_alert_me",
    args: { slug: "aurelia-heights-phase-2" },
  };
  const message = await recordedMessage("interactive-follow-project.json");
  const session: WaSession = {
    state: "follow_offer",
    context: { slug: "aurelia-heights-phase-2" },
    expiresAt: null,
  };
  const h = harness({
    serviceAnswers: { risk_summary: { data: AURELIA_RISK } },
    userAnswers: { follow: { data: { schema: "plinth.follow/1" } } },
  });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(h.acted, 1);
  assertEquals(h.user.calls[0]!.fn, "follow");
  assertEquals(h.user.calls[0]!.args.p_slug, "aurelia-heights-phase-2");
  assertEquals(result, { outcome: "followed", session: { type: "done" } });
  assertEquals(h.replies, [
    {
      type: "text",
      text: {
        body:
          "Done. You will get alerts for Aurelia Heights, Phase 2. Manage them at plinth.in/you.",
      },
    },
  ]);
});

Deno.test('"Yes, alert me" never confirms a follow that api.follow did not record', async () => {
  const route: Route = {
    handler: "risk_card",
    rule: "card_button",
    action: "yes_alert_me",
    args: { slug: "aurelia-heights-phase-2" },
  };
  const message = await recordedMessage("interactive-follow-project.json");
  const session: WaSession = {
    state: "follow_offer",
    context: { slug: "aurelia-heights-phase-2" },
    expiresAt: null,
  };
  const h = harness({
    serviceAnswers: { risk_summary: { data: AURELIA_RISK } },
    userAnswers: {
      follow: { error: { code: "PGRST202", message: "Could not find the function" } },
    },
  });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result, { outcome: "follow_failed", session: { type: "done" } });
  assertEquals(h.replies, [
    {
      type: "text",
      text: {
        body: "We couldn't turn on alerts just now. Try again in a minute, or follow from the app.",
      },
    },
  ]);
});

Deno.test('"Not now" declines without ever calling actAsUser or a follow RPC', async () => {
  const route: Route = {
    handler: "risk_card",
    rule: "card_button",
    action: "not_now",
    args: { slug: "aurelia-heights-phase-2" },
  };
  const message = await recordedMessage("interactive-follow-project.json");
  const session: WaSession = {
    state: "follow_offer",
    context: { slug: "aurelia-heights-phase-2" },
    expiresAt: null,
  };
  const h = harness({ serviceAnswers: { risk_summary: { data: AURELIA_RISK } } });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result, { outcome: "follow_declined", session: { type: "done" } });
  assertEquals(h.acted, 0);
  assertEquals(h.replies, [
    { type: "text", text: { body: "No problem. Type follow anytime to turn alerts on." } },
  ]);
});

Deno.test('"Ask" opens the ask session for this project', async () => {
  const route: Route = {
    handler: "risk_card",
    rule: "card_button",
    action: "ask",
    args: { slug: "aurelia-heights-phase-2" },
  };
  const message = await recordedMessage("interactive-follow-project.json");
  const session = cardShown("aurelia-heights-phase-2");
  const h = harness({ serviceAnswers: { risk_summary: { data: AURELIA_RISK } } });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result, {
    outcome: "ask_opened",
    session: { type: "ask_opened", slug: "aurelia-heights-phase-2" },
  });
  assertEquals(h.replies, [
    { type: "text", text: { body: "Type your question about Aurelia Heights, Phase 2." } },
  ]);
});

Deno.test('"Open full card" re-sends the live card for the session\'s own slug', async () => {
  const route: Route = {
    handler: "risk_card",
    rule: "card_button",
    action: "open_full_card",
    args: { slug: "aurelia-heights-phase-2" },
  };
  const message = await recordedMessage("interactive-follow-project.json");
  const session = cardShown("aurelia-heights-phase-2");
  const h = harness({ serviceAnswers: { risk_summary: { data: AURELIA_RISK } } });
  const result = await riskCard(inputFor(route, message, session), h.tools);

  assertEquals(result.outcome, "card_sent");
  assertEquals(h.replies.length, 2);
});

// ---------------------------------------------------------------------------------------------
// WhatsApp limits (Accept: "caption and button limits hold")
// ---------------------------------------------------------------------------------------------

Deno.test("the card image caption and the reply buttons hold WhatsApp's limits", () => {
  const image = {
    type: "image" as const,
    image: { link: AURELIA_RISK.share.card_url, caption: expectedCaption(AURELIA_RISK) },
  };
  assertEquals(limitProblems(image), []);
  assertEquals(limitProblems(expectedButtons(AURELIA_RISK)), []);
  assertEquals(
    limitProblems(replyButtons({
      body:
        "Get alerts here when this project's band changes, its date is extended, or it files or misses a QPR? At most 1 message a day. Reply STOP anytime.",
      buttons: [
        { id: "yes_alert_me", title: "Yes, alert me" },
        { id: "not_now", title: "Not now" },
      ],
    })),
    [],
  );
});
