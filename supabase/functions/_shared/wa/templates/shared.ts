// _shared/wa/templates/shared: the WhatsApp template renderers' shared shape (T46b;
// API_CONTRACTS §5.2 template catalogue, packages/contracts/catalogues/wa_templates.json).
//
// A renderer is a pure function from a template's own ordered variables to the Graph API
// "template" message outbox-dispatch sends outside the 24-hour session window. It never reads
// the database: whatever varies (a project name, a count, a date) arrives already rendered,
// server-side (AGENTS.md rule 10, "never composed in code"). Meta fixes a quick-reply or
// copy-code button's visible text at approval time — only its payload (or, for a copy-code
// button, the code itself) is ever sent.
//
// Each renderer file also carries a literal mirror of its own catalogue row (code, category,
// header, variables, buttons); templates.test.ts cross-checks every mirror against the JSON
// catalogue itself, the same convention T41's _shared/otp/whatsapp.ts set for login_code, so a
// changed catalogue fails CI instead of silently drifting.

import type { OutboundMessage } from "../graph.ts";

export type TemplateCategory = "UTILITY" | "AUTHENTICATION";

/**
 * A rendered template message: structurally an OutboundMessage (graph.ts types a template's
 * `components` as `unknown[]`, provider-agnostic), but kept exact here so a renderer's own test
 * can inspect the components it built without re-asserting every field's shape first.
 */
export interface RenderedTemplate {
  type: "template";
  template: { name: string; language: { code: string }; components: TemplateComponent[] };
}

export interface TemplateButtonSpec {
  type: "quick_reply" | "copy_code" | "cta_url";
  /** The approved template's own button text (≤ 20 chars); null when Meta fills it at send time. */
  text: string | null;
}

/** A literal mirror of one packages/contracts/catalogues/wa_templates.json row. */
export interface TemplateMirror {
  code: string;
  metaName: string;
  category: TemplateCategory;
  language: string;
  variables: readonly string[];
  buttons: readonly TemplateButtonSpec[];
}

type HeaderComponent =
  | { type: "header"; parameters: [{ type: "image"; image: { link: string } }] }
  | { type: "header"; parameters: [{ type: "text"; text: string }] };
type BodyComponent = { type: "body"; parameters: { type: "text"; text: string }[] };
type ButtonComponent =
  | {
    type: "button";
    sub_type: "quick_reply";
    index: string;
    parameters: [{ type: "payload"; payload: string }];
  }
  | {
    type: "button";
    sub_type: "url";
    index: string;
    parameters: [{ type: "text"; text: string }];
  };

export type TemplateComponent = HeaderComponent | BodyComponent | ButtonComponent;

/** The Graph API template message: name, language and ordered components (graph.ts OutboundMessage). */
export function templateMessage(
  meta: Pick<TemplateMirror, "metaName" | "language">,
  components: TemplateComponent[],
): RenderedTemplate {
  return {
    type: "template",
    template: { name: meta.metaName, language: { code: meta.language }, components },
  };
}

/** The body component: one text parameter per variable, in the catalogue's order. */
export function bodyComponent(...values: string[]): BodyComponent {
  return { type: "body", parameters: values.map((text) => ({ type: "text", text })) };
}

export function imageHeader(link: string): HeaderComponent {
  return { type: "header", parameters: [{ type: "image", image: { link } }] };
}

/** A quick-reply button's payload (router.ts's STOP_ACTIONS/DIGEST_ACTIONS/CARD_BUTTONS ids). */
export function quickReplyButton(index: number, payload: string): ButtonComponent {
  return {
    type: "button",
    sub_type: "quick_reply",
    index: String(index),
    parameters: [{ type: "payload", payload }],
  };
}

/** A copy-code or CTA-URL button's one dynamic parameter (Meta sends it as a "url" sub_type). */
export function urlButton(index: number, text: string): ButtonComponent {
  return {
    type: "button",
    sub_type: "url",
    index: String(index),
    parameters: [{ type: "text", text }],
  };
}

/** Widens a rendered template to graph.ts's OutboundMessage, for graph.send() (outbox-dispatch). */
export function asOutboundMessage(msg: RenderedTemplate): OutboundMessage {
  return msg;
}
