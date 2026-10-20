// _shared/wa/mock: in-memory WhatsApp doubles for Deno tests (T44). No network, no database.
//
//   const store = memoryWaStore();                      the api.wa_* semantics in memory
//   const graph = createGraphClient({ mode: "mock", plinthEnv: "test", record: store.recordOutbound,
//                                     mockId: sequentialIds() });
//   store.outbound                                      what would have been sent (mock_sent)
//
// memoryWaStore mirrors migration 20261114000200: one contact per number with last_inbound_at
// moving forward only, one row per wa_message_id, statuses moving forward only, claims for the
// sweeper. supabase/tests/wa/001 checks the SQL; logic.test.ts checks the edge against this twin.
// The sweeper's "older than a minute" rule uses the clock passed in (tests advance it).

import type { Clock } from "../core/clock.ts";
import { systemClock } from "../core/clock.ts";
import type { OutboundRecord } from "./graph.ts";
import type {
  ClaimedMessage,
  ClaimOptions,
  StatusResult,
  StoredSession,
  WaContact,
  WaSession,
  WaStore,
} from "./session.ts";
import { messageFromStored } from "./session.ts";
import type { InboundMessage, StatusEvent } from "./verify.ts";
import { redactMessage } from "./verify.ts";

export interface MemoryMessage {
  id: string;
  contactId: string;
  direction: "in" | "out";
  waMessageId: string;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  templateCode: string | null;
  route: string | null;
  routeAttempts: number;
  routeClaimedAt: number | null;
  routedAt: number | null;
  routeError: string | null;
  createdAt: number;
}

export interface MemoryWaStore extends WaStore {
  contacts: Map<string, WaContact>;
  messages: MemoryMessage[];
  sessions: Map<string, StoredSession>;
  /** Outbound records in order (mock_sent snapshots). */
  outbound: OutboundRecord[];
  /** Links a number to an account, as "Bring them here" will. */
  link(waId: string, userId: string): void;
}

const RANK: Record<string, number> = { mock_sent: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

/** Stable ids for snapshots: wamid.mock.0001, wamid.mock.0002, … */
export function sequentialIds(prefix = "wamid.mock."): () => string {
  let n = 0;
  return () => `${prefix}${String(++n).padStart(4, "0")}`;
}

export function memoryWaStore(clock: Clock = systemClock): MemoryWaStore {
  const contacts = new Map<string, WaContact>();
  const messages: MemoryMessage[] = [];
  const sessions = new Map<string, StoredSession>();
  const outbound: OutboundRecord[] = [];
  let seq = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;
  const now = () => clock.now().getTime();

  const contactFor = (waId: string, at: Date | null): WaContact => {
    const existing = contacts.get(waId);
    const atIso = (at ?? clock.now()).toISOString();
    if (!existing) {
      const c: WaContact = {
        id: uuid(),
        waId,
        userId: null,
        utilityOptIn: false,
        stoppedAt: null,
        lastInboundAt: atIso,
      };
      contacts.set(waId, c);
      return c;
    }
    if (!existing.lastInboundAt || existing.lastInboundAt < atIso) existing.lastInboundAt = atIso;
    return existing;
  };

  const store: MemoryWaStore = {
    contacts,
    messages,
    sessions,
    outbound,
    link(waId, userId) {
      const c = contacts.get(waId) ?? contactFor(waId, null);
      c.userId = userId;
    },
    ingest(msg: InboundMessage) {
      const contact = contactFor(msg.from, msg.timestamp);
      if (messages.some((m) => m.waMessageId === msg.waMessageId)) {
        return Promise.resolve({ duplicate: true, messageId: null, contact: { ...contact } });
      }
      const row: MemoryMessage = {
        id: uuid(),
        contactId: contact.id,
        direction: "in",
        waMessageId: msg.waMessageId,
        type: msg.type,
        payload: redactMessage(msg.raw),
        status: "received",
        templateCode: null,
        route: null,
        routeAttempts: 1,
        routeClaimedAt: now(),
        routedAt: null,
        routeError: null,
        createdAt: now(),
      };
      messages.push(row);
      return Promise.resolve({ duplicate: false, messageId: row.id, contact: { ...contact } });
    },
    applyStatus(s: StatusEvent): Promise<StatusResult> {
      let n = 0;
      for (const m of messages) {
        if (m.waMessageId !== s.waMessageId || m.direction !== "out") continue;
        if ((RANK[s.status] ?? -1) > (RANK[m.status] ?? -1)) {
          m.status = s.status;
          n++;
        }
      }
      return Promise.resolve({ messages: n, outbox: null });
    },
    markRouted(messageId, route, error = null) {
      const m = messages.find((x) => x.id === messageId && x.direction === "in" && !x.routedAt);
      if (m) {
        m.route = route ?? m.route;
        m.routeError = error;
        if (error === null) m.routedAt = now();
        else m.routeClaimedAt = null;
      }
      return Promise.resolve();
    },
    claimUnrouted(opts: ClaimOptions = {}): Promise<ClaimedMessage[]> {
      const limit = opts.limit ?? 25;
      const maxAttempts = opts.maxAttempts ?? 5;
      const staleMs = (opts.staleSeconds ?? 60) * 1000;
      const out: ClaimedMessage[] = [];
      for (const m of messages) {
        if (out.length >= limit) break;
        if (m.direction !== "in" || m.routedAt !== null || m.routeAttempts >= maxAttempts) continue;
        if (m.routeClaimedAt !== null && m.routeClaimedAt >= now() - staleMs) continue;
        const contact = [...contacts.values()].find((c) => c.id === m.contactId);
        const message = contact ? messageFromStored(m.payload, contact.waId) : null;
        if (!contact || !message) continue;
        m.routeAttempts++;
        m.routeClaimedAt = now();
        out.push({ messageId: m.id, message, attempt: m.routeAttempts, contact: { ...contact } });
      }
      return Promise.resolve(out);
    },
    getSession(contactId) {
      return Promise.resolve(sessions.get(contactId) ?? null);
    },
    putSession(contactId, s: WaSession) {
      sessions.set(contactId, {
        state: s.state,
        context: { ...s.context },
        expires_at: s.expiresAt?.toISOString() ?? null,
      });
      return Promise.resolve();
    },
    recordOutbound(rec) {
      if (!messages.some((m) => m.waMessageId === rec.waMessageId)) {
        outbound.push(rec);
        messages.push({
          id: uuid(),
          contactId: rec.contactId ?? "",
          direction: "out",
          waMessageId: rec.waMessageId,
          type: rec.type,
          payload: rec.payload,
          status: rec.status,
          templateCode: rec.templateCode,
          route: null,
          routeAttempts: 0,
          routeClaimedAt: null,
          routedAt: null,
          routeError: null,
          createdAt: now(),
        });
      }
      return Promise.resolve();
    },
  };
  return store;
}
