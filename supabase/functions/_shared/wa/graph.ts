// _shared/wa/graph: the WhatsApp Cloud API client, with a mock mode (T44; API_CONTRACTS §5.2).
//
//   const graph = createGraphClient({ mode: env.metaMode, plinthEnv: env.plinthEnv, … });
//   await graph.send({ to: contact.waId, contactId: contact.id, message: replyButtons({ … }) });
//
// Every send:
//   1. checks the interactive limits (whatsapp.md "limits audit"): ≤ 3 reply buttons of ≤ 20
//      chars; one CTA URL button of ≤ 20 chars; a list of ≤ 10 rows with titles ≤ 24 chars.
//      A breach throws WaLimitError (invalid_input) before anything is recorded or sent;
//   2. mock mode (META_MODE=mock, the default): records the request body in comms.wa_messages
//      with status mock_sent through `record` and returns a wamid.mock.<uuid> id. No network;
//   3. live mode: refuses the fixture test block +91 99000 003NN in every environment
//      (TestNumberRefused, before any network call; DESIGN §5b C-31), refuses any PLINTH_ENV but
//      prod (C-31: adapters run in mock mode outside prod), then POSTs
//      /{WA_PHONE_NUMBER_ID}/messages and records status sent.
// So no environment can deliver to a fixture number: outside prod nothing leaves, and in prod the
// block is refused. Mock records still capture replies to fixture people for snapshot tests.
// Sending policy (24-hour window, wa_outbound, quiet hours) is the caller's: wa-webhook's reply
// tool and T42's outbox-dispatch.

import type { MetaMode, PlinthEnv, Secret } from "../core/env.ts";
import { EnvError } from "../core/env.ts";
import { HttpError } from "../core/errors.ts";

export const GRAPH_BASE_URL = "https://graph.facebook.com";
export const GRAPH_API_VERSION = "v23.0";

/** Meta's limits for session messages (Cloud API reference; whatsapp.md limits audit). */
export const WA_LIMITS = {
  replyButtons: 3,
  buttonTitle: 20,
  buttonId: 256,
  ctaLabel: 20,
  listRows: 10,
  listSections: 10,
  listButton: 20,
  rowTitle: 24,
  rowDescription: 72,
  sectionTitle: 24,
  rowId: 200,
  interactiveBody: 1024,
  headerText: 60,
  footerText: 60,
  textBody: 4096,
  caption: 1024,
} as const;

// ---------------------------------------------------------------------------------------------
// Messages (the Graph body without messaging_product and to)
// ---------------------------------------------------------------------------------------------

export interface ReplyButton {
  id: string;
  title: string;
}
export interface ListRow {
  id: string;
  title: string;
  description?: string;
}
export interface ListSection {
  title?: string;
  rows: ListRow[];
}
type TextHeader = { type: "text"; text: string };
type ImageHeader = { type: "image"; image: { link: string } };

export type Interactive =
  | {
    type: "button";
    header?: TextHeader | ImageHeader;
    body: { text: string };
    footer?: { text: string };
    action: { buttons: { type: "reply"; reply: ReplyButton }[] };
  }
  | {
    type: "list";
    header?: TextHeader;
    body: { text: string };
    footer?: { text: string };
    action: { button: string; sections: ListSection[] };
  }
  | {
    type: "cta_url";
    header?: TextHeader | ImageHeader;
    body: { text: string };
    footer?: { text: string };
    action: { name: "cta_url"; parameters: { display_text: string; url: string } };
  };

export type OutboundMessage =
  | { type: "text"; text: { body: string; preview_url?: boolean } }
  | { type: "image"; image: { link: string; caption?: string } }
  | { type: "interactive"; interactive: Interactive }
  | {
    type: "template";
    template: { name: string; language: { code: string }; components?: unknown[] };
  };

export function textMessage(body: string): OutboundMessage {
  return { type: "text", text: { body } };
}

export function imageMessage(link: string, caption?: string): OutboundMessage {
  return { type: "image", image: caption === undefined ? { link } : { link, caption } };
}

export function replyButtons(
  opts: { body: string; buttons: ReplyButton[]; header?: string; footer?: string },
): OutboundMessage {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      ...(opts.header ? { header: { type: "text", text: opts.header } } : {}),
      body: { text: opts.body },
      ...(opts.footer ? { footer: { text: opts.footer } } : {}),
      action: { buttons: opts.buttons.map((reply) => ({ type: "reply", reply })) },
    },
  };
}

export function ctaUrl(
  opts: { body: string; label: string; url: string; footer?: string },
): OutboundMessage {
  return {
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: { text: opts.body },
      ...(opts.footer ? { footer: { text: opts.footer } } : {}),
      action: { name: "cta_url", parameters: { display_text: opts.label, url: opts.url } },
    },
  };
}

export function listMessage(
  opts: { body: string; button: string; sections: ListSection[]; footer?: string },
): OutboundMessage {
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: opts.body },
      ...(opts.footer ? { footer: { text: opts.footer } } : {}),
      action: { button: opts.button, sections: opts.sections },
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------------------------

/** Characters as WhatsApp counts them (code points, so "₹" is one). */
export const charCount = (s: string): number => [...s].length;

export class WaLimitError extends HttpError {
  readonly problems: readonly string[];
  constructor(problems: readonly string[]) {
    super("invalid_input", `WhatsApp limits: ${problems.join("; ")}`);
    this.name = "WaLimitError";
    this.problems = problems;
  }
}

function within(problems: string[], what: string, text: string | undefined, max: number) {
  if (text === undefined) return;
  const n = charCount(text);
  if (n === 0) problems.push(`${what} is empty`);
  else if (n > max) problems.push(`${what} is ${n} chars (max ${max})`);
}

/** Every limit breach in the message; empty when it can be sent. */
export function limitProblems(msg: OutboundMessage): string[] {
  const p: string[] = [];
  if (msg.type === "text") within(p, "text body", msg.text.body, WA_LIMITS.textBody);
  if (msg.type === "image") {
    if (!/^https:\/\//.test(msg.image.link)) p.push("image link is not https");
    within(p, "caption", msg.image.caption, WA_LIMITS.caption);
  }
  if (msg.type !== "interactive") return p;
  const i = msg.interactive;
  within(p, "body", i.body.text, WA_LIMITS.interactiveBody);
  within(p, "footer", i.footer?.text, WA_LIMITS.footerText);
  if (i.header?.type === "text") within(p, "header", i.header.text, WA_LIMITS.headerText);
  if (i.type === "button") {
    const buttons = i.action.buttons;
    if (buttons.length < 1 || buttons.length > WA_LIMITS.replyButtons) {
      p.push(`${buttons.length} reply buttons (1–${WA_LIMITS.replyButtons})`);
    }
    for (const b of buttons) {
      within(p, `button "${b.reply.title}"`, b.reply.title, WA_LIMITS.buttonTitle);
      within(p, `button id "${b.reply.id}"`, b.reply.id, WA_LIMITS.buttonId);
    }
    const ids = buttons.map((b) => b.reply.id);
    const titles = buttons.map((b) => b.reply.title);
    if (new Set(ids).size !== ids.length) p.push("reply button ids repeat");
    if (new Set(titles).size !== titles.length) p.push("reply button titles repeat");
  }
  if (i.type === "cta_url") {
    within(p, "CTA label", i.action.parameters.display_text, WA_LIMITS.ctaLabel);
    if (!/^https:\/\//.test(i.action.parameters.url)) p.push("CTA url is not https");
  }
  if (i.type === "list") {
    within(p, "list button", i.action.button, WA_LIMITS.listButton);
    const sections = i.action.sections;
    if (sections.length < 1 || sections.length > WA_LIMITS.listSections) {
      p.push(`${sections.length} list sections (1–${WA_LIMITS.listSections})`);
    }
    const rows = sections.flatMap((s) => s.rows);
    if (rows.length < 1 || rows.length > WA_LIMITS.listRows) {
      p.push(`${rows.length} list rows (1–${WA_LIMITS.listRows})`);
    }
    for (const s of sections) {
      within(p, `section "${s.title}"`, s.title, WA_LIMITS.sectionTitle);
      if (sections.length > 1 && !s.title) p.push("a multi-section list needs section titles");
    }
    for (const r of rows) {
      within(p, `row "${r.title}"`, r.title, WA_LIMITS.rowTitle);
      within(p, `row "${r.title}" description`, r.description, WA_LIMITS.rowDescription);
      within(p, `row id "${r.id}"`, r.id, WA_LIMITS.rowId);
    }
    if (new Set(rows.map((r) => r.id)).size !== rows.length) p.push("list row ids repeat");
  }
  return p;
}

/** Throws WaLimitError when the message breaks a WhatsApp limit. */
export function assertWithinLimits(msg: OutboundMessage): void {
  const problems = limitProblems(msg);
  if (problems.length) throw new WaLimitError(problems);
}

// ---------------------------------------------------------------------------------------------
// The fixture test block
// ---------------------------------------------------------------------------------------------

/** True for +91 99000 003NN in any spelling (wa_id digits, E.164, spaces, 0091…). */
export function isTestBlockNumber(number: string): boolean {
  const digits = number.replace(/\D/g, "").replace(/^00/, "");
  return /^9199000003\d{2}$/.test(digits);
}

export class TestNumberRefused extends HttpError {
  constructor() {
    super("forbidden", "Fixture test numbers never receive WhatsApp messages.");
    this.name = "TestNumberRefused";
  }
}

// ---------------------------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------------------------

export type OutboundStatus = "sent" | "mock_sent" | "failed";

/** What reaches comms.wa_messages (api.wa_record_outbound). No phone number in it. */
export interface OutboundRecord {
  contactId: string | null;
  waMessageId: string;
  type: OutboundMessage["type"];
  payload: Record<string, unknown>;
  status: OutboundStatus;
  templateCode: string | null;
}

export type OutboundRecorder = (record: OutboundRecord) => Promise<void>;

export interface SendInput {
  /** wa_id or E.164. */
  to: string;
  contactId?: string | null;
  message: OutboundMessage;
  templateCode?: string | null;
}

export interface SendResult {
  waMessageId: string;
  status: Exclude<OutboundStatus, "failed">;
}

export interface GraphClient {
  readonly mode: MetaMode;
  send(input: SendInput): Promise<SendResult>;
}

export interface GraphClientOptions {
  mode: MetaMode;
  plinthEnv: PlinthEnv;
  phoneNumberId?: string | null;
  accessToken?: Secret | null;
  /** Records every send (mock_sent or sent). Without it, sends are not recorded. */
  record?: OutboundRecorder;
  fetch?: typeof fetch;
  apiVersion?: string;
  /** Id source for mock sends (tests pass a counter for stable snapshots). */
  mockId?: () => string;
}

/** A Graph API failure. The response body goes to the log through `cause`, never the caller. */
export class GraphError extends HttpError {
  readonly graphStatus: number;
  readonly graphCode: number | null;
  constructor(status: number, code: number | null, cause: unknown) {
    super("internal", "WhatsApp did not accept the message.", { cause });
    this.name = "GraphError";
    this.graphStatus = status;
    this.graphCode = code;
  }
}

export function createGraphClient(opts: GraphClientOptions): GraphClient {
  const record = opts.record ?? (() => Promise.resolve());
  const mockId = opts.mockId ?? (() => `wamid.mock.${crypto.randomUUID()}`);
  const doFetch = opts.fetch ?? fetch;

  return {
    mode: opts.mode,
    async send(input) {
      assertWithinLimits(input.message);
      const payload = { ...input.message } as Record<string, unknown>;
      const base = {
        contactId: input.contactId ?? null,
        type: input.message.type,
        payload,
        templateCode: input.templateCode ?? null,
      };

      if (opts.mode === "mock") {
        const waMessageId = mockId();
        await record({ ...base, waMessageId, status: "mock_sent" });
        return { waMessageId, status: "mock_sent" };
      }

      if (isTestBlockNumber(input.to)) throw new TestNumberRefused();
      if (opts.plinthEnv !== "prod") {
        throw new EnvError(
          ["META_MODE"],
          "can be live only when PLINTH_ENV=prod (DESIGN §5b C-31)",
        );
      }
      const phoneNumberId = opts.phoneNumberId;
      const token = opts.accessToken?.reveal();
      if (!phoneNumberId) throw new EnvError(["WA_PHONE_NUMBER_ID"], "is not set");
      if (!token) throw new EnvError(["WA_ACCESS_TOKEN"], "is not set");

      const url = `${GRAPH_BASE_URL}/${opts.apiVersion ?? GRAPH_API_VERSION}/${
        encodeURIComponent(phoneNumberId)
      }/messages`;
      const res = await doFetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.to.replace(/\D/g, ""),
          ...input.message,
        }),
      });
      const body = await res.json().catch(() => null) as
        | { messages?: { id?: string }[]; error?: { code?: number } }
        | null;
      const id = body?.messages?.[0]?.id;
      if (!res.ok || typeof id !== "string") {
        throw new GraphError(res.status, body?.error?.code ?? null, body?.error ?? null);
      }
      await record({ ...base, waMessageId: id, status: "sent" });
      return { waMessageId: id, status: "sent" };
    },
  };
}
