// card_changed on T03b's recorded "image-old-card" payload (packages/fixtures/recorded/wa) and the
// golden api.share_card fixture (packages/fixtures/expected/share_card/aurelia-old-card.json): the
// "Changed since this card was sent" line is that payload's own headline_line, never composed here.
// No network: api.* calls go through a fake RpcClient. Run: npx --yes deno@2 task test (in
// supabase/functions).

import { createLogger } from "../../_shared/core/log.ts";
import { flagsReader } from "../../_shared/core/flags.ts";
import type { ShareCard } from "../../_shared/core/contracts.ts";
import { assertEquals, captureLogs, fakeRpc, frozenClock } from "../../_shared/testing/mod.ts";
import type { RpcAnswer, RpcCall } from "../../_shared/testing/rpc.ts";
import { limitProblems, replyButtons } from "../../_shared/wa/graph.ts";
import type { OutboundMessage } from "../../_shared/wa/graph.ts";
import { IDLE } from "../../_shared/wa/session.ts";
import type { WaContact } from "../../_shared/wa/session.ts";
import { parseWebhook } from "../../_shared/wa/verify.ts";
import type { InboundMessage } from "../../_shared/wa/verify.ts";
import { cardChanged } from "./card_changed.ts";
import type { HandlerInput, HandlerTools, Route } from "../router.ts";
import { routeInbound } from "../router.ts";

const ROOT = new URL("../../../../", import.meta.url);
const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await Deno.readTextFile(new URL(path, ROOT))) as T;

const OLD_CARD = await readJson<ShareCard>(
  "packages/fixtures/expected/share_card/aurelia-old-card.json",
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

const IMAGE_SHA256 = "86943a78866659c78793fc2c3fc6dbb5";

async function recordedImageMessage(): Promise<InboundMessage> {
  const raw = await Deno.readTextFile(
    new URL("packages/fixtures/recorded/wa/image-old-card.json", ROOT),
  );
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
      return Promise.reject(new Error("card_changed never acts as the tapper"));
    },
    service,
    flags: flagsReader(() => Promise.resolve({ schema: "plinth.flags/1", flags: {} })),
    log: createLogger({ fn: "test", sink: logs.sink }),
    clock: frozenClock(),
  };
  return { tools, replies, service };
}

// ---------------------------------------------------------------------------------------------

Deno.test("a forwarded old card is matched by its content hash, then the diff is relayed verbatim", async () => {
  const message = await recordedImageMessage();
  const route = await routeInbound(message, {
    session: IDLE,
    findProject: () => Promise.resolve(null),
  });
  assertEquals(route, {
    handler: "card_changed",
    rule: "image",
    action: "match_card",
    args: { media_id: "65015315711583" },
  });

  const h = harness({
    wa_match_share_card: { data: { short_code: "ce57248d" } },
    share_card: { data: OLD_CARD },
  });
  const input: HandlerInput = { route, message, contact: ROHAN, session: IDLE };
  const result = await cardChanged(input, h.tools);

  assertEquals(result, {
    outcome: "changed",
    session: { type: "card_sent", slug: "aurelia-heights-phase-2" },
  });
  assertEquals(h.service.calls.map((c) => c.fn), ["wa_match_share_card", "share_card"]);
  assertEquals(h.service.calls[0]!.args, { p_image_sha256: IMAGE_SHA256 });
  assertEquals(h.service.calls[1]!.args, { p_code: "ce57248d" });

  assertEquals(h.replies, [
    {
      type: "image",
      image: {
        link: OLD_CARD.now.card_url!,
        caption:
          "Changed since this card was sent: band Moderate → Elevated (2 Oct).\nhttps://plinth.in/gurugram/projects/aurelia-heights-phase-2",
      },
    },
    replyButtons({
      body: "Aurelia Heights, Phase 2",
      buttons: [{ id: "open_full_card", title: "Open full card" }],
    }),
  ]);
});

Deno.test("an unchanged match says nothing changed, never inventing a headline", async () => {
  const message = await recordedImageMessage();
  const route: Route = {
    handler: "card_changed",
    rule: "image",
    action: "match_card",
    args: { media_id: "65015315711583" },
  };
  const unchanged: ShareCard = { ...OLD_CARD, changed: false, headline_line: null };
  const h = harness({
    wa_match_share_card: { data: { short_code: "ce57248d" } },
    share_card: { data: unchanged },
  });
  const result = await cardChanged({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result.outcome, "unchanged");
  const image = h.replies[0];
  assertEquals(image?.type, "image");
  assertEquals(
    image?.type === "image" ? image.image.caption : null,
    "Nothing has changed since this card was sent.\nhttps://plinth.in/gurugram/projects/aurelia-heights-phase-2",
  );
});

Deno.test("no phash match gets an honest line, never guessing which card it is", async () => {
  const message = await recordedImageMessage();
  const route: Route = {
    handler: "card_changed",
    rule: "image",
    action: "match_card",
    args: { media_id: "65015315711583" },
  };
  const h = harness({ wa_match_share_card: { data: null } });
  const result = await cardChanged({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "no_match" });
  assertEquals(h.service.calls.map((c) => c.fn), ["wa_match_share_card"]);
  assertEquals(h.replies, [
    {
      type: "text",
      text: {
        body:
          "We can't tell which card this is from the photo alone. Send the project name or its RERA number and we'll show the current band.",
      },
    },
  ]);
});

Deno.test("a missing match RPC (not built yet) is treated the same as no match", async () => {
  const message = await recordedImageMessage();
  const route: Route = {
    handler: "card_changed",
    rule: "image",
    action: "match_card",
    args: { media_id: "65015315711583" },
  };
  const h = harness(); // no answers: fakeRpc returns PGRST202 "could not find the function"
  const result = await cardChanged({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "no_match" });
  assertEquals(h.replies.length, 1);
});

Deno.test("an image with no content hash (no sha256 on the payload) never calls a lookup RPC", async () => {
  const message: InboundMessage = {
    waMessageId: "wamid.fixture.no-sha",
    from: ROHAN.waId,
    type: "image",
    timestamp: new Date("2026-10-18T06:00:00Z"),
    contextId: null,
    text: null,
    replyId: null,
    interactiveType: null,
    mediaId: "65015315711583",
    raw: { id: "65015315711583", type: "image", image: { id: "65015315711583" } },
  };
  const route: Route = {
    handler: "card_changed",
    rule: "image",
    action: "match_card",
    args: { media_id: "65015315711583" },
  };
  const h = harness();
  const result = await cardChanged({ route, message, contact: ROHAN, session: IDLE }, h.tools);

  assertEquals(result, { outcome: "no_match" });
  assertEquals(h.service.calls.length, 0);
});

Deno.test("the changed-card image caption and its button hold WhatsApp's limits", () => {
  const image = {
    type: "image" as const,
    image: {
      link: OLD_CARD.now.card_url!,
      caption: `${OLD_CARD.headline_line}\n${OLD_CARD.live_url}`,
    },
  };
  assertEquals(limitProblems(image), []);
  assertEquals(
    limitProblems(
      replyButtons({
        body: OLD_CARD.phase.name,
        buttons: [{ id: "open_full_card", title: "Open full card" }],
      }),
    ),
    [],
  );
});
