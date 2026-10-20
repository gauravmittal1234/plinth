// _shared/wa/session: the WhatsApp conversation state machine and its store (T44; DATA_MODEL §9).
//
// States (comms.wa_sessions.state):
//   idle          nothing pending
//   card_shown    a risk card was sent; its buttons ("Why this band" · "Follow project" · "Ask")
//                 act on context.slug. Lives 24 h (the session window)
//   follow_offer  "Follow project" was tapped; waiting for "Yes, alert me" / "Not now" (30 min)
//   ask_open      "Ask" was tapped; the next typed text is a question about context.slug (30 min)
//
// Handlers return an event; nextSession() applies it (first match wins in the router, the state
// only refines it). An expired session reads as idle.
//
//   event            idle        card_shown    follow_offer  ask_open
//   card_sent        card_shown  card_shown    card_shown    card_shown
//   follow_offered   ✗           follow_offer  follow_offer  follow_offer
//   ask_opened       ✗           ask_open      ask_open      ask_open
//   done             idle        idle          card_shown    card_shown
//   stop             idle        idle          idle          idle
// ✗ = InvalidTransition: a follow or a question needs a card first.
//
// WaStore is everything wa-webhook persists: rpcWaStore calls the service-only api.wa_* functions
// (migration 20261114000200); _shared/wa/mock.ts has an in-memory twin for tests.

import type { RpcClient } from "../core/supabase.ts";
import { callRpc } from "../core/supabase.ts";
import type { OutboundRecord } from "./graph.ts";
import type { InboundMessage, StatusEvent } from "./verify.ts";
import { normalizeMessage, redactMessage } from "./verify.ts";

export const SESSION_STATES = ["idle", "card_shown", "follow_offer", "ask_open"] as const;
export type SessionState = typeof SESSION_STATES[number];

export interface WaSession {
  state: SessionState;
  /** card_shown, follow_offer and ask_open carry { slug }. */
  context: Readonly<Record<string, unknown>>;
  expiresAt: Date | null;
}

export type SessionEvent =
  | { type: "card_sent"; slug: string }
  | { type: "follow_offered"; slug?: string }
  | { type: "ask_opened"; slug?: string }
  | { type: "done" }
  | { type: "stop" };

const MINUTE = 60_000;
export const SESSION_TTL_MS: Readonly<Record<SessionState, number | null>> = {
  idle: null,
  card_shown: 24 * 60 * MINUTE,
  follow_offer: 30 * MINUTE,
  ask_open: 30 * MINUTE,
};

export const IDLE: WaSession = Object.freeze({ state: "idle", context: {}, expiresAt: null });

export class InvalidTransition extends Error {
  constructor(from: SessionState, event: SessionEvent["type"]) {
    super(`no WhatsApp session transition from ${from} on ${event}`);
    this.name = "InvalidTransition";
  }
}

const TRANSITIONS: Readonly<
  Record<SessionState, Partial<Record<SessionEvent["type"], SessionState>>>
> = {
  idle: { card_sent: "card_shown", done: "idle", stop: "idle" },
  card_shown: {
    card_sent: "card_shown",
    follow_offered: "follow_offer",
    ask_opened: "ask_open",
    done: "idle",
    stop: "idle",
  },
  follow_offer: {
    card_sent: "card_shown",
    follow_offered: "follow_offer",
    ask_opened: "ask_open",
    done: "card_shown",
    stop: "idle",
  },
  ask_open: {
    card_sent: "card_shown",
    follow_offered: "follow_offer",
    ask_opened: "ask_open",
    done: "card_shown",
    stop: "idle",
  },
};

export function isSessionState(v: unknown): v is SessionState {
  return typeof v === "string" && (SESSION_STATES as readonly string[]).includes(v);
}

/** The session as of `now`: unknown or expired sessions read as idle. */
export function readSession(stored: StoredSession | null, now: Date): WaSession {
  if (!stored || !isSessionState(stored.state)) return IDLE;
  const expiresAt = stored.expires_at ? new Date(stored.expires_at) : null;
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return IDLE;
  if (stored.state !== "idle" && typeof stored.context?.slug !== "string") return IDLE;
  return { state: stored.state, context: stored.context ?? {}, expiresAt };
}

/** Applies an event. Throws InvalidTransition where the table has ✗. */
export function nextSession(current: WaSession, event: SessionEvent, now: Date): WaSession {
  const to = TRANSITIONS[current.state][event.type];
  if (!to) throw new InvalidTransition(current.state, event.type);
  if (to === "idle") return IDLE;
  const eventSlug = "slug" in event ? event.slug : undefined;
  const slug = eventSlug ?? current.context.slug;
  if (typeof slug !== "string" || slug === "") {
    throw new InvalidTransition(current.state, event.type);
  }
  const ttl = SESSION_TTL_MS[to];
  return {
    state: to,
    context: { slug },
    expiresAt: ttl === null ? null : new Date(now.getTime() + ttl),
  };
}

// ---------------------------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------------------------

/** pii.wa_contacts as the edge reads it (comms.wa_contact_json). */
export interface WaContact {
  id: string;
  /** wa_id digits. Never logged. */
  waId: string;
  userId: string | null;
  utilityOptIn: boolean;
  stoppedAt: string | null;
  lastInboundAt: string | null;
}

export interface IngestResult {
  duplicate: boolean;
  messageId: string | null;
  contact: WaContact;
}

export interface ClaimedMessage {
  messageId: string;
  message: InboundMessage;
  attempt: number;
  contact: WaContact;
}

/** comms.wa_sessions as api.wa_session_get returns it. */
export interface StoredSession {
  state: string;
  context: Record<string, unknown>;
  expires_at: string | null;
  updated_at?: string | null;
}

export interface ClaimOptions {
  limit?: number;
  maxAttempts?: number;
  staleSeconds?: number;
}

export interface StatusResult {
  messages: number;
  outbox: number | null;
}

export interface WaStore {
  /** Upsert the sender (last_inbound_at) and insert the message once. */
  ingest(msg: InboundMessage): Promise<IngestResult>;
  applyStatus(status: StatusEvent): Promise<StatusResult>;
  /** A handler finished (error null) or failed (error set: the sweeper retries). */
  markRouted(messageId: string, route: string | null, error?: string | null): Promise<void>;
  claimUnrouted(opts?: ClaimOptions): Promise<ClaimedMessage[]>;
  getSession(contactId: string): Promise<StoredSession | null>;
  putSession(contactId: string, session: WaSession): Promise<void>;
  recordOutbound(record: OutboundRecord): Promise<void>;
}

type Obj = Record<string, unknown>;

export function contactFromJson(v: unknown): WaContact {
  const o = (v ?? {}) as Obj;
  if (typeof o.id !== "string" || typeof o.wa_id !== "string") {
    throw new Error("api.wa_*: the contact has no id or wa_id");
  }
  return {
    id: o.id,
    waId: o.wa_id,
    userId: typeof o.user_id === "string" ? o.user_id : null,
    utilityOptIn: o.utility_opt_in === true,
    stoppedAt: typeof o.stopped_at === "string" ? o.stopped_at : null,
    lastInboundAt: typeof o.last_inbound_at === "string" ? o.last_inbound_at : null,
  };
}

/** Rebuilds the message from a stored (redacted) payload and the contact's number. */
export function messageFromStored(payload: Obj, waId: string): InboundMessage | null {
  return normalizeMessage(payload, waId);
}

/** The production store: api.wa_* through a secret-key client. */
export function rpcWaStore(client: RpcClient): WaStore {
  return {
    async ingest(msg) {
      const out = await callRpc<Obj>(client, "wa_ingest_inbound", {
        p_wa_id: msg.from,
        p_wa_message_id: msg.waMessageId,
        p_type: msg.type,
        p_payload: redactMessage(msg.raw),
        p_received_at: msg.timestamp?.toISOString() ?? null,
        p_context_wa_message_id: msg.contextId,
      });
      return {
        duplicate: out.duplicate === true,
        messageId: typeof out.message_id === "string" ? out.message_id : null,
        contact: contactFromJson(out.contact),
      };
    },
    async applyStatus(s) {
      const out = await callRpc<Obj>(client, "wa_apply_status", {
        p_wa_message_id: s.waMessageId,
        p_status: s.status,
        p_at: s.timestamp?.toISOString() ?? null,
        p_error: s.error,
      });
      return {
        messages: typeof out.messages === "number" ? out.messages : 0,
        outbox: typeof out.outbox === "number" ? out.outbox : null,
      };
    },
    async markRouted(messageId, route, error = null) {
      await callRpc(client, "wa_mark_routed", {
        p_message_id: messageId,
        p_route: route,
        p_error: error,
      });
    },
    async claimUnrouted(opts = {}) {
      const rows = await callRpc<Obj[]>(client, "wa_claim_unrouted", {
        p_limit: opts.limit ?? 25,
        p_max_attempts: opts.maxAttempts ?? 5,
        p_stale_seconds: opts.staleSeconds ?? 60,
      });
      const out: ClaimedMessage[] = [];
      for (const r of rows ?? []) {
        const contact = contactFromJson(r.contact);
        const message = messageFromStored((r.payload ?? {}) as Obj, contact.waId);
        if (!message || typeof r.message_id !== "string") continue;
        out.push({ messageId: r.message_id, message, attempt: Number(r.attempt) || 1, contact });
      }
      return out;
    },
    async getSession(contactId) {
      return await callRpc<StoredSession | null>(client, "wa_session_get", {
        p_contact_id: contactId,
      });
    },
    async putSession(contactId, session) {
      await callRpc(client, "wa_session_put", {
        p_contact_id: contactId,
        p_state: session.state,
        p_context: session.context,
        p_expires_at: session.expiresAt?.toISOString() ?? null,
      });
    },
    async recordOutbound(rec) {
      await callRpc(client, "wa_record_outbound", {
        p_contact_id: rec.contactId,
        p_wa_message_id: rec.waMessageId,
        p_type: rec.type,
        p_payload: rec.payload,
        p_status: rec.status,
        p_template_code: rec.templateCode,
      });
    },
  };
}
