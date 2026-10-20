// outbox-dispatch: claims due comms.outbox rows and routes push, WhatsApp and email (mock)
// (WORK_BREAKDOWN T42; BUILD_PLAN §13, §15; API_CONTRACTS §5.2, §5.5). Tested in logic.test.ts.
//
// Pure decisions live here (quiet hours, dedupe, WhatsApp template-vs-session, the FCM payload
// shape, backoff); the side-effecting adapters (DB RPCs, FCM, Graph, email) are injected through
// DispatchDeps so this file never touches the network or a real clock on its own.

import { istDate, istMinuteOfDay } from "../_shared/core/clock.ts";
import type { Clock } from "../_shared/core/clock.ts";
import type { Handler, RequestContext } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import { verifyDispatchSecret } from "../_shared/core/auth.ts";
import { json } from "../_shared/core/http.ts";
import type { CoreEnv } from "../_shared/core/env.ts";
import type { FlagKey } from "../_shared/core/flags.ts";
import type { Logger } from "../_shared/core/log.ts";
import { errorFields } from "../_shared/core/log.ts";
import type { FcmMessage } from "../_shared/outbox/fcm.ts";
import type { RenderedTemplate } from "../_shared/wa/templates/mod.ts";
import {
  renderBandChangeAlert,
  renderDailyDigest,
  renderFamilyRemoved,
  renderFilingAlert,
  renderWeeklyDigest,
  TEMPLATE_REPLY_IDS,
} from "../_shared/wa/templates/mod.ts";

// ---------------------------------------------------------------------------
// Shapes (as api.outbox_claim_due / api.outbox_wa_contact return them).
// ---------------------------------------------------------------------------

export const OUTBOX_CHANNELS = [
  "push",
  "whatsapp_template",
  "whatsapp_session",
  "email",
  "sms",
] as const;
export type OutboxChannel = typeof OUTBOX_CHANNELS[number];

export interface ClaimedTemplate {
  /** comms.templates.code (the renderer key); older claims carry only meta_name, the same value. */
  code?: string;
  meta_name: string;
  category: string;
  language: string;
  header: unknown;
  variables: string[];
  buttons: unknown[];
}

export interface ClaimedRow {
  id: string;
  dedupe_key: string;
  user_id: string | null;
  contact_id: string | null;
  org_member_id: string | null;
  channel: OutboxChannel;
  template_code: string | null;
  payload: Record<string, unknown>;
  basis: string | null;
  attempts: number;
  created_at: string;
  template: ClaimedTemplate | null;
}

export interface WaContact {
  wa_id_e164: string;
  last_inbound_at: string | null;
  utility_opt_in: boolean;
  stopped_at: string | null;
}

/** Narrows an unknown jsonb array (from api.outbox_claim_due) to ClaimedRow[]. */
export function parseClaimed(payload: unknown): ClaimedRow[] {
  if (!Array.isArray(payload)) throw new Error("api.outbox_claim_due did not return an array");
  return payload as ClaimedRow[];
}

// ---------------------------------------------------------------------------
// Quiet hours (API_CONTRACTS §5.2 "quiet hours delay non-urgent sends (not_before)"; DESIGN §5b
// C-32: 22:00–08:00 IST is the documented default). Applies to push and WhatsApp; email and sms
// are not time-sensitive the way a phone buzzing at midnight is.
// ---------------------------------------------------------------------------

export interface QuietHours {
  /** Minutes since IST midnight, 0–1439. */
  fromMinute: number;
  toMinute: number;
}

/** DESIGN §5b C-32: 22:00–08:00 IST. */
export const DEFAULT_QUIET_HOURS: QuietHours = { fromMinute: 22 * 60, toMinute: 8 * 60 };

export const QUIET_HOURS_CHANNELS: ReadonlySet<OutboxChannel> = new Set([
  "push",
  "whatsapp_template",
  "whatsapp_session",
]);

function addDaysToIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * null when `now` is outside quiet hours (send now); otherwise the instant quiet hours end
 * (always the window's `toMinute`, on today's or tomorrow's IST date as the overnight window
 * requires).
 */
export function deferForQuietHours(
  now: Date,
  quiet: QuietHours = DEFAULT_QUIET_HOURS,
): Date | null {
  const minute = istMinuteOfDay(now);
  const overnight = quiet.fromMinute > quiet.toMinute;
  const inQuiet = overnight
    ? minute >= quiet.fromMinute || minute < quiet.toMinute
    : minute >= quiet.fromMinute && minute < quiet.toMinute;
  if (!inQuiet) return null;

  const today = istDate(now);
  const dayOffset = minute >= quiet.fromMinute ? 1 : 0;
  const endDate = addDaysToIsoDate(today, dayOffset);
  const hh = String(Math.floor(quiet.toMinute / 60)).padStart(2, "0");
  const mm = String(quiet.toMinute % 60).padStart(2, "0");
  return new Date(`${endDate}T${hh}:${mm}:00+05:30`);
}

// ---------------------------------------------------------------------------
// Dedupe: a defensive pass over one claimed batch. comms.outbox.dedupe_key is globally unique
// (the table's constraint is the authority); this guards the dispatcher itself against ever
// acting twice on the same dedupe_key inside one poll, e.g. if a bug upstream ever raced two
// inserts past the constraint under the same transaction.
// ---------------------------------------------------------------------------

export interface DedupeResult {
  toProcess: ClaimedRow[];
  suppressed: ClaimedRow[];
}

export function dedupeBatch(rows: readonly ClaimedRow[]): DedupeResult {
  const seen = new Set<string>();
  const toProcess: ClaimedRow[] = [];
  const suppressed: ClaimedRow[] = [];
  for (const row of rows) {
    if (seen.has(row.dedupe_key)) {
      suppressed.push(row);
      continue;
    }
    seen.add(row.dedupe_key);
    toProcess.push(row);
  }
  return { toProcess, suppressed };
}

// ---------------------------------------------------------------------------
// The test block (INTEGRATION_NOTES "T42/T44: outbound SMS and WhatsApp adapters refuse the
// test block +91 99000 003NN in every environment"). These are the fixture phone numbers used
// across the whole product (e.g. Rohan's +919900000318, packages/fixtures/canonical/people.json)
// — a real send to one is always refused, fixture mode included, so a misconfigured deploy can
// never message them for real.
// ---------------------------------------------------------------------------

const TEST_BLOCK_RE = /^(?:91)?99000003\d{2}$/;

/** True for any +91 99000 003NN number, however it is formatted (spaces, dashes, +91 or 91). */
export function isTestBlockNumber(phone: string): boolean {
  return TEST_BLOCK_RE.test(phone.replace(/[^0-9]/g, ""));
}

// ---------------------------------------------------------------------------
// WhatsApp: template vs. session (API_CONTRACTS §5.2 "a session message is sent only if
// last_inbound_at is within 24h; otherwise an approved utility template is sent").
// ---------------------------------------------------------------------------

export const WA_SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;

export function chooseWhatsAppChannel(
  lastInboundAt: string | Date | null,
  now: Date,
): "whatsapp_template" | "whatsapp_session" {
  if (!lastInboundAt) return "whatsapp_template";
  const at = lastInboundAt instanceof Date ? lastInboundAt : new Date(lastInboundAt);
  if (Number.isNaN(at.getTime())) return "whatsapp_template";
  return now.getTime() - at.getTime() < WA_SESSION_WINDOW_MS
    ? "whatsapp_session"
    : "whatsapp_template";
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

/** The template's comms.templates.code: `code` when the claim names it, else meta_name (equal in R1). */
function templateCode(template: ClaimedTemplate | null): string | null {
  return template ? template.code ?? template.meta_name : null;
}

/**
 * Up to 3 quick-reply buttons (API_CONTRACTS §5.2 interactive limits), ≤ 20 chars each. Each
 * button's id is the reply id the template's own quick reply carries (TEMPLATE_REPLY_IDS, T46b's
 * renderers), so a tap inside the 24-hour window routes exactly like a tap on the template
 * (wa-webhook/router.ts). A button with no known reply id is left out: never an unroutable button.
 */
function sessionButtons(
  code: string | null,
  buttons: unknown[],
): Array<{ type: "reply"; reply: { id: string; title: string } }> {
  const ids = (code && TEMPLATE_REPLY_IDS[code]) || [];
  const out: Array<{ type: "reply"; reply: { id: string; title: string } }> = [];
  let quickReply = 0;
  for (const b of buttons) {
    if (out.length >= 3) break;
    if (!b || typeof b !== "object") continue;
    const entry = b as { type?: unknown; text?: unknown };
    if (entry.type !== "quick_reply" || typeof entry.text !== "string") continue;
    const id = ids[quickReply++];
    if (!id) continue;
    out.push({ type: "reply", reply: { id, title: entry.text.slice(0, 20) } });
  }
  return out;
}

/** A payload field a template cannot be sent without (an image header's link). */
function required(payload: Record<string, unknown>, key: string, code: string): string {
  const value = stringify(payload[key]);
  if (value === "") throw new Error(`${code}: the row's payload has no ${key}`);
  return value;
}

/**
 * The approved template, built by T46b's renderer (_shared/wa/templates) from the row's own
 * payload, so its header and quick replies go out with the body: band_change_alert is
 * [header (image), body, button, button], as Meta approved it. null for a template this file has
 * no renderer for (login_code goes out through auth-sms-hook; export_ready's URL button suffix is
 * not in its row yet), which keeps the body-only shape below.
 */
export function renderOutboxTemplate(
  code: string,
  payload: Record<string, unknown>,
): RenderedTemplate | null {
  const text = (key: string) => stringify(payload[key]);
  switch (code) {
    case "band_change_alert":
      return renderBandChangeAlert({
        headerImageUrl: required(payload, "header_image_url", code),
        project: text("project"),
        fromBand: text("from_band"),
        toBand: text("to_band"),
        trigger: text("trigger"),
        date: text("date"),
      });
    case "filing_alert":
      return renderFilingAlert({
        project: text("project"),
        eventLine: text("event_line"),
        date: text("date"),
      });
    case "weekly_digest":
      return renderWeeklyDigest({
        headerImageUrl: required(payload, "header_image_url", code),
        weekRange: text("week_range"),
        changeCount: text("change_count"),
        bandMovingFact: text("band_moving_fact"),
      });
    case "daily_digest":
      return renderDailyDigest({ date: text("date"), changeCount: text("change_count") });
    case "family_removed":
      return renderFamilyRemoved({
        inviterFirstName: text("inviter_first_name"),
        project: text("project"),
      });
    default:
      return null;
  }
}

/** The Graph API `POST /{WA_PHONE_NUMBER_ID}/messages` body (API_CONTRACTS §5.2). */
export function buildWhatsAppRequest(
  to: string,
  channel: "whatsapp_template" | "whatsapp_session",
  template: ClaimedTemplate | null,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const code = templateCode(template);
  if (channel === "whatsapp_template") {
    if (!template || !code) {
      throw new Error("a whatsapp_template send needs its comms.templates row");
    }
    const rendered = renderOutboxTemplate(code, payload);
    if (rendered) return { messaging_product: "whatsapp", to, ...rendered };
    const parameters = template.variables.map((name) => ({
      type: "text",
      text: stringify(payload[name]),
    }));
    return {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template.meta_name,
        language: { code: template.language },
        ...(parameters.length ? { components: [{ type: "body", parameters }] } : {}),
      },
    };
  }
  const text = stringify(payload.session_text);
  const buttons = sessionButtons(code, template?.buttons ?? []);
  if (!buttons.length) {
    return { messaging_product: "whatsapp", to, type: "text", text: { body: text } };
  }
  return {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: { type: "button", body: { text }, action: { buttons } },
  };
}

// ---------------------------------------------------------------------------
// FCM: data-only + deep link (BUILD_PLAN §13, §5.3 "data-only FCM messages carrying a deep
// link"); never a `notification` block, so the app controls what's shown and always opens.
// ---------------------------------------------------------------------------

export function buildFcmMessage(
  row: Pick<ClaimedRow, "dedupe_key" | "template_code" | "payload">,
): FcmMessage {
  const deepLink = row.payload.deep_link;
  if (typeof deepLink !== "string" || deepLink === "") {
    throw new Error("a push row's payload is missing deep_link");
  }
  const data: Record<string, string> = { deep_link: deepLink, dedupe_key: row.dedupe_key };
  if (row.template_code) data.notification_code = row.template_code;
  for (const [key, value] of Object.entries(row.payload)) {
    if (key === "deep_link") continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      data[key] = String(value);
    }
  }
  return { data };
}

// ---------------------------------------------------------------------------
// Retries with backoff. attempts is the row's attempts BEFORE this send attempt (0 on the first
// try); api.outbox_resolve increments it when it writes back a 'failed' outcome.
// ---------------------------------------------------------------------------

export const MAX_ATTEMPTS = 6;
/** Delay before the next try, indexed by the attempt number that just failed (0-based). */
export const BACKOFF_SCHEDULE_MS: readonly number[] = [
  60_000, // 1 min
  5 * 60_000, // 5 min
  30 * 60_000, // 30 min
  2 * 60 * 60_000, // 2 h
  6 * 60 * 60_000, // 6 h
];

export function backoffDelayMs(attempts: number): number {
  const i = Math.min(Math.max(attempts, 0), BACKOFF_SCHEDULE_MS.length - 1);
  return BACKOFF_SCHEDULE_MS[i]!;
}

// ---------------------------------------------------------------------------
// Flags: push_outbound / wa_outbound / email_outbound are kill switches on the channels this
// function sends through (ops.feature_flags seed, T04). sms has no flag: it is not built in R1.
// ---------------------------------------------------------------------------

export function channelFlagKey(channel: OutboxChannel): FlagKey | null {
  switch (channel) {
    case "push":
      return "push_outbound";
    case "whatsapp_template":
    case "whatsapp_session":
      return "wa_outbound";
    case "email":
      return "email_outbound";
    case "sms":
      return null;
  }
}

// ---------------------------------------------------------------------------
// Orchestration. Every side effect is injected so this is testable with fakes (health's pattern).
// ---------------------------------------------------------------------------

export type ResolveOutcome =
  | { outcome: "sent"; channel?: OutboxChannel; providerMessageId?: string }
  | { outcome: "failed"; error: string; notBefore: Date }
  | { outcome: "suppressed"; error: string }
  | { outcome: "deferred"; notBefore: Date };

export interface WhatsAppSendResult {
  ok: boolean;
  providerMessageId: string;
  mock: boolean;
  error?: string;
}

export interface DispatchDeps {
  claimDue(limit: number): Promise<ClaimedRow[]>;
  resolve(id: string, outcome: ResolveOutcome): Promise<void>;
  isChannelEnabled(channel: OutboxChannel): Promise<boolean>;
  getWaContact(contactId: string): Promise<WaContact | null>;
  recordWaSend(args: {
    contactId: string | null;
    waMessageId: string;
    type: string;
    body: Record<string, unknown>;
    templateCode: string | null;
    status: string;
  }): Promise<void>;
  sendWhatsApp(body: Record<string, unknown>): Promise<WhatsAppSendResult>;
  pushTokens(userId: string): Promise<string[]>;
  pushTokenGone(token: string): Promise<void>;
  sendPush(token: string, message: FcmMessage): Promise<"ok" | "gone" | "error" | "not_configured">;
  sendEmail(row: ClaimedRow): Promise<{ ok: boolean; providerMessageId: string }>;
  now(): Date;
  log?: Logger;
  limit?: number;
  quietHours?: QuietHours;
}

export interface DispatchSummary {
  claimed: number;
  sent: number;
  deferred: number;
  suppressed: number;
  failed: number;
}

async function resolveOne(
  deps: DispatchDeps,
  row: ClaimedRow,
  outcome: ResolveOutcome,
): Promise<void> {
  try {
    await deps.resolve(row.id, outcome);
  } catch (err) {
    deps.log?.error("outbox_resolve failed", { id: row.id, ...errorFields(err) });
  }
}

async function dispatchPush(deps: DispatchDeps, row: ClaimedRow): Promise<ResolveOutcome> {
  if (!row.user_id) return { outcome: "suppressed", error: "push row has no user_id" };
  const tokens = await deps.pushTokens(row.user_id);
  if (tokens.length === 0) return { outcome: "suppressed", error: "no registered devices" };

  let message: FcmMessage;
  try {
    message = buildFcmMessage(row);
  } catch (err) {
    return { outcome: "suppressed", error: (err as Error).message };
  }

  let anySent = false;
  let anyTransientError = false;
  for (const token of tokens) {
    const result = await deps.sendPush(token, message);
    if (result === "ok") anySent = true;
    else if (result === "gone") await deps.pushTokenGone(token);
    else anyTransientError = true;
  }
  if (anySent) return { outcome: "sent", channel: "push" };
  if (anyTransientError) {
    return {
      outcome: "failed",
      error: "fcm send failed",
      notBefore: new Date(deps.now().getTime() + backoffDelayMs(row.attempts)),
    };
  }
  return { outcome: "suppressed", error: "every device token was unregistered" };
}

async function dispatchWhatsApp(deps: DispatchDeps, row: ClaimedRow): Promise<ResolveOutcome> {
  if (!row.contact_id) return { outcome: "suppressed", error: "whatsapp row has no contact_id" };
  const contact = await deps.getWaContact(row.contact_id);
  if (!contact) {
    return { outcome: "suppressed", error: "no pii.wa_contacts row for this contact_id" };
  }
  if (contact.stopped_at) return { outcome: "suppressed", error: "contact replied STOP" };
  if (isTestBlockNumber(contact.wa_id_e164)) {
    return { outcome: "suppressed", error: "refused: test block number (+91 99000 003NN)" };
  }

  const channel = chooseWhatsAppChannel(contact.last_inbound_at, deps.now());
  let body: Record<string, unknown>;
  try {
    body = buildWhatsAppRequest(contact.wa_id_e164, channel, row.template, row.payload);
  } catch (err) {
    return { outcome: "suppressed", error: (err as Error).message };
  }

  const result = await deps.sendWhatsApp(body);
  const bodyType = typeof body.type === "string" ? body.type : "unknown";
  await deps.recordWaSend({
    contactId: row.contact_id,
    waMessageId: result.providerMessageId || `failed_${row.id}`,
    type: bodyType,
    body,
    templateCode: channel === "whatsapp_template" ? row.template_code : null,
    status: result.ok ? (result.mock ? "mock_sent" : "sent") : "failed",
  });
  if (!result.ok) {
    return {
      outcome: "failed",
      error: result.error ?? "whatsapp send failed",
      notBefore: new Date(deps.now().getTime() + backoffDelayMs(row.attempts)),
    };
  }
  return { outcome: "sent", channel, providerMessageId: result.providerMessageId };
}

async function dispatchEmail(deps: DispatchDeps, row: ClaimedRow): Promise<ResolveOutcome> {
  const result = await deps.sendEmail(row);
  if (!result.ok) {
    return {
      outcome: "failed",
      error: "email send failed",
      notBefore: new Date(deps.now().getTime() + backoffDelayMs(row.attempts)),
    };
  }
  return { outcome: "sent", channel: "email", providerMessageId: result.providerMessageId };
}

async function dispatchOne(deps: DispatchDeps, row: ClaimedRow): Promise<ResolveOutcome> {
  if (QUIET_HOURS_CHANNELS.has(row.channel)) {
    const until = deferForQuietHours(deps.now(), deps.quietHours);
    if (until) return { outcome: "deferred", notBefore: until };
  }

  const flagKey = channelFlagKey(row.channel);
  if (flagKey === null) {
    return { outcome: "suppressed", error: `channel ${row.channel} is not built in R1` };
  }
  if (!(await deps.isChannelEnabled(row.channel))) {
    return { outcome: "suppressed", error: `${flagKey} is off` };
  }

  switch (row.channel) {
    case "push":
      return dispatchPush(deps, row);
    case "whatsapp_template":
    case "whatsapp_session":
      return dispatchWhatsApp(deps, row);
    case "email":
      return dispatchEmail(deps, row);
    case "sms":
      // Not built in R1 (WORK_BREAKDOWN T42 only routes push, whatsapp and email). When it is,
      // it must call isTestBlockNumber on the destination first (INTEGRATION_NOTES T42/T44).
      return { outcome: "suppressed", error: "sms is not built in R1" };
  }
}

export function dispatchHandler(deps: DispatchDeps): Handler {
  return async (_req, _ctx) => {
    const rows = await deps.claimDue(deps.limit ?? 25);
    const { toProcess, suppressed } = dedupeBatch(rows);

    for (const row of suppressed) {
      await resolveOne(deps, row, {
        outcome: "suppressed",
        error: "duplicate dedupe_key in this batch",
      });
    }

    const summary: DispatchSummary = {
      claimed: rows.length,
      sent: 0,
      deferred: 0,
      suppressed: suppressed.length,
      failed: 0,
    };

    for (const row of toProcess) {
      let outcome: ResolveOutcome;
      try {
        outcome = await dispatchOne(deps, row);
      } catch (err) {
        deps.log?.error("dispatch failed", {
          id: row.id,
          channel: row.channel,
          ...errorFields(err),
        });
        outcome = {
          outcome: "failed",
          error: (err as Error).message,
          notBefore: new Date(deps.now().getTime() + backoffDelayMs(row.attempts)),
        };
      }
      await resolveOne(deps, row, outcome);
      summary[
        outcome.outcome === "sent"
          ? "sent"
          : outcome.outcome === "deferred"
          ? "deferred"
          : outcome.outcome === "suppressed"
          ? "suppressed"
          : "failed"
      ]++;
    }

    return json(summary);
  };
}

export interface MakeOutboxDispatchOptions {
  buildDeps(ctx: RequestContext): DispatchDeps;
  env?: CoreEnv | (() => CoreEnv);
  clock?: Clock;
}

/** The deployed function: POST only, the dispatch secret instead of a JWT. */
export function makeOutboxDispatch(
  opts: MakeOutboxDispatchOptions,
): (req: Request) => Promise<Response> {
  return createHandler(
    "outbox-dispatch",
    async (req, ctx) => {
      await verifyDispatchSecret(req, ctx.env.dispatchSecret);
      await req.body?.cancel();
      return dispatchHandler(opts.buildDeps(ctx))(req, ctx);
    },
    { methods: ["POST"], env: opts.env, clock: opts.clock },
  );
}
