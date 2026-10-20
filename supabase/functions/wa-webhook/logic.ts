// wa-webhook: Meta's WhatsApp webhook (API_CONTRACTS §5.1). Tested in logic.test.ts.
//
// GET  /wa-webhook         the verify handshake (verify.ts verifyHandshake).
// POST /wa-webhook         1. verify X-Hub-Signature-256 over the raw body (403 when missing or
//                             wrong; nothing is read or stored first);
//                          2. flags.require("wa_inbound") (503 flag_off: Meta redelivers later);
//                          3. per message: api.wa_ingest_inbound upserts the contact
//                             (last_inbound_at) and inserts the message once. A redelivered
//                             wa_message_id is a duplicate and is not routed again;
//                          4. statuses (sent | delivered | read | failed) → api.wa_apply_status;
//                          5. answer 200 { ok: true } at once and route the new messages in
//                             waitUntil (router.ts, first match wins → handlers/*).
// POST /wa-webhook/sweep   the 1-minute sweeper (pg_cron, x-plinth-dispatch-secret): claims
//                          messages no router finished (api.wa_claim_unrouted) and routes them.
//
// Routing one message: read the session (expired → idle), route, run the handler with tools,
// apply its session event, then api.wa_mark_routed. A failure is logged with an error code (never
// message text) and releases the claim, so the sweeper retries it (up to 5 attempts).
// Handler tools: reply() sends a session message through the Graph client (limits enforced;
// mock_sent in mock mode) only when wa_outbound is on and the sender wrote within 24 h;
// actAsUser() mints the ≤ 60 s tap JWT (verify.ts) and returns a client acting as the sender.

import type { RequestContext } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import type { HandlerOptions } from "../_shared/core/handler.ts";
import { verifyDispatchSecret } from "../_shared/core/auth.ts";
import type { EnvSource, Secret } from "../_shared/core/env.ts";
import { processEnv, readSecret, readVar } from "../_shared/core/env.ts";
import { HttpError } from "../_shared/core/errors.ts";
import type { FlagsReader } from "../_shared/core/flags.ts";
import { flagsReader, rpcFlagsLoader } from "../_shared/core/flags.ts";
import { json, ok } from "../_shared/core/http.ts";
import { errorFields } from "../_shared/core/log.ts";
import type { RpcClient } from "../_shared/core/supabase.ts";
import { anonClient, secretClient, userClient } from "../_shared/core/supabase.ts";
import type { GraphClient, OutboundMessage } from "../_shared/wa/graph.ts";
import { createGraphClient } from "../_shared/wa/graph.ts";
import type { ClaimedMessage, WaContact, WaStore } from "../_shared/wa/session.ts";
import { InvalidTransition, nextSession, readSession, rpcWaStore } from "../_shared/wa/session.ts";
import {
  mintTapToken,
  parseWebhook,
  readRawBody,
  readTapSecret,
  SIGNATURE_HEADER,
  verifyHandshake,
  verifyMetaSignature,
} from "../_shared/wa/verify.ts";
import type { HandlerName, HandlerTools, ProjectFinder, WaHandler } from "./router.ts";
import { HANDLERS, routeInbound, suggestProjectFinder } from "./router.ts";

export const FN = "wa-webhook";
/** Meta's 24-hour customer service window (API_CONTRACTS §5.2). */
export const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const SWEEP = { limit: 25, maxAttempts: 5, staleSeconds: 60 } as const;

/** The WhatsApp variables (.env.example). Secrets stay wrapped. */
export interface WaEnv {
  appSecret: Secret | null;
  verifyToken: Secret | null;
  phoneNumberId: string | null;
  accessToken: Secret | null;
  jwtSecret: Secret | null;
}

export function readWaEnv(src: EnvSource = processEnv): WaEnv {
  return {
    appSecret: readSecret(src, "WA_APP_SECRET"),
    verifyToken: readSecret(src, "WA_VERIFY_TOKEN"),
    phoneNumberId: readVar(src, "WA_PHONE_NUMBER_ID") ?? null,
    accessToken: readSecret(src, "WA_ACCESS_TOKEN"),
    jwtSecret: readTapSecret(src),
  };
}

export interface WaDeps {
  store: WaStore;
  flags: FlagsReader;
  graph: GraphClient;
  findProject: ProjectFinder;
  handlers: Readonly<Record<HandlerName, WaHandler>>;
  /** The secret-key client handlers use for service RPCs. */
  service: RpcClient;
  /** A client acting as the holder of this access token (the tap JWT). */
  asUser(token: string): RpcClient;
}

export interface MakeWaWebhookOptions extends Omit<HandlerOptions, "methods"> {
  /** WhatsApp variables; default readWaEnv() once per isolate. */
  wa?: WaEnv;
  /** Dependencies; default: api.wa_* with the secret key, api.suggest as anon, the Graph API. */
  deps?: (ctx: RequestContext, wa: WaEnv) => WaDeps;
  /** Where background routing goes; default ctx.waitUntil (EdgeRuntime.waitUntil). */
  defer?: (task: Promise<unknown>, ctx: RequestContext) => void;
}

let isolateFlags: FlagsReader | null = null;

/** Production dependencies, built per request; the flag cache lives for the isolate. */
export function defaultDeps(ctx: RequestContext, wa: WaEnv): WaDeps {
  const opts = { requestId: ctx.requestId, fn: ctx.fn };
  const service = secretClient(ctx.env.supabase, opts);
  const store = rpcWaStore(service);
  isolateFlags ??= flagsReader(rpcFlagsLoader(service), { log: ctx.log });
  return {
    store,
    flags: isolateFlags,
    graph: createGraphClient({
      mode: ctx.env.metaMode,
      plinthEnv: ctx.env.plinthEnv,
      phoneNumberId: wa.phoneNumberId,
      accessToken: wa.accessToken,
      record: (rec) => store.recordOutbound(rec),
    }),
    findProject: suggestProjectFinder(anonClient(ctx.env.supabase, opts)),
    handlers: HANDLERS,
    service,
    asUser: (token) => userClient(ctx.env.supabase, token, opts),
  };
}

/** A routing failure's code for comms.wa_messages.route_error (never message text). */
export function errorCode(err: unknown): string {
  if (err instanceof HttpError) return err.code;
  if (err instanceof InvalidTransition) return "invalid_transition";
  if (err instanceof Error && err.name === "EnvError") return "config";
  return "internal";
}

/** Throws forbidden unless the sender wrote within the last 24 hours. */
export function assertSessionWindow(lastInboundAt: string | null, now: Date): void {
  const last = lastInboundAt ? Date.parse(lastInboundAt) : NaN;
  if (!Number.isFinite(last) || now.getTime() - last > SESSION_WINDOW_MS) {
    throw new HttpError("forbidden", "The 24-hour WhatsApp window is closed; use a template.");
  }
}

type Routable = Pick<ClaimedMessage, "messageId" | "message" | "contact" | "attempt">;

function toolsFor(item: Routable, ctx: RequestContext, deps: WaDeps, wa: WaEnv): HandlerTools {
  const contact: WaContact = item.contact;
  return {
    async reply(message: OutboundMessage) {
      if (!(await deps.flags.isOn("wa_outbound"))) {
        ctx.log.warn("wa_outbound is off; reply not sent", { message_type: message.type });
        return null;
      }
      assertSessionWindow(contact.lastInboundAt, ctx.clock.now());
      return await deps.graph.send({ to: contact.waId, contactId: contact.id, message });
    },
    async actAsUser() {
      const token = await mintTapToken({
        secret: wa.jwtSecret,
        userId: contact.userId,
        message: item.message,
        now: ctx.clock.now(),
      });
      return deps.asUser(token);
    },
    service: deps.service,
    flags: deps.flags,
    log: ctx.log,
    clock: ctx.clock,
  };
}

/** Routes one stored message. Returns the handler name, or "error" (the sweeper retries). */
export async function routeOne(
  item: Routable,
  ctx: RequestContext,
  deps: WaDeps,
  wa: WaEnv,
): Promise<HandlerName | "error"> {
  let handler: HandlerName | null = null;
  try {
    const now = ctx.clock.now();
    const session = readSession(await deps.store.getSession(item.contact.id), now);
    const route = await routeInbound(item.message, { session, findProject: deps.findProject });
    handler = route.handler;
    const result = await deps.handlers[route.handler](
      { route, message: item.message, contact: item.contact, session },
      toolsFor(item, ctx, deps, wa),
    );
    if (result.session) {
      await deps.store.putSession(item.contact.id, nextSession(session, result.session, now));
    }
    await deps.store.markRouted(item.messageId, route.handler, null);
    ctx.log.info("wa routed", {
      handler: route.handler,
      rule: route.rule,
      action: route.action,
      outcome: result.outcome,
      attempt: item.attempt,
    });
    return route.handler;
  } catch (err) {
    ctx.log.error("wa route failed", { handler, attempt: item.attempt, ...errorFields(err) });
    try {
      await deps.store.markRouted(item.messageId, handler, errorCode(err));
    } catch (markErr) {
      ctx.log.error("wa mark_routed failed", errorFields(markErr));
    }
    return "error";
  }
}

async function routeAll(items: Routable[], ctx: RequestContext, deps: WaDeps, wa: WaEnv) {
  const out: (HandlerName | "error")[] = [];
  for (const it of items) out.push(await routeOne(it, ctx, deps, wa));
  return out;
}

async function receive(
  req: Request,
  ctx: RequestContext,
  deps: WaDeps,
  wa: WaEnv,
  defer: (task: Promise<unknown>) => void,
): Promise<Response> {
  const raw = await readRawBody(req);
  await verifyMetaSignature(raw, req.headers.get(SIGNATURE_HEADER), wa.appSecret);
  await deps.flags.require("wa_inbound");

  const events = parseWebhook(raw);
  const fresh: Routable[] = [];
  let duplicates = 0;
  for (const message of events.messages) {
    const r = await deps.store.ingest(message);
    if (r.duplicate || !r.messageId) {
      duplicates++;
      continue;
    }
    fresh.push({ messageId: r.messageId, message, contact: r.contact, attempt: 1 });
  }
  let statusesMatched = 0;
  for (const status of events.statuses) {
    statusesMatched += (await deps.store.applyStatus(status)).messages;
  }
  ctx.log.info("wa inbound", {
    messages: events.messages.length,
    duplicates,
    statuses: events.statuses.length,
    statuses_matched: statusesMatched,
  });
  if (fresh.length) defer(routeAll(fresh, ctx, deps, wa));
  return ok();
}

async function sweep(req: Request, ctx: RequestContext, deps: WaDeps, wa: WaEnv) {
  await verifyDispatchSecret(req, ctx.env.dispatchSecret);
  await req.body?.cancel();
  await deps.flags.require("wa_inbound");
  const claimed = await deps.store.claimUnrouted(SWEEP);
  const results = await routeAll(claimed, ctx, deps, wa);
  const failed = results.filter((r) => r === "error").length;
  ctx.log.info("wa sweep", { claimed: claimed.length, failed });
  return json({ ok: true, claimed: claimed.length, routed: claimed.length - failed, failed });
}

let isolateWa: WaEnv | null = null;

/** The deployed function. */
export function makeWaWebhook(
  opts: MakeWaWebhookOptions = {},
): (req: Request) => Promise<Response> {
  const { wa: waOption, deps: depsOption, defer: deferOption, ...handlerOptions } = opts;
  return createHandler(
    FN,
    async (req, ctx) => {
      const wa = waOption ?? (isolateWa ??= readWaEnv());
      const deps = (depsOption ?? defaultDeps)(ctx, wa);
      const defer = (task: Promise<unknown>) =>
        deferOption ? deferOption(task, ctx) : ctx.waitUntil(task);
      if (req.method === "GET") {
        const challenge = await verifyHandshake(new URL(req.url).searchParams, wa.verifyToken);
        return new Response(challenge, {
          headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
        });
      }
      if (new URL(req.url).pathname.replace(/\/+$/, "").endsWith(`/${FN}/sweep`)) {
        return await sweep(req, ctx, deps, wa);
      }
      return await receive(req, ctx, deps, wa, defer);
    },
    { ...handlerOptions, methods: ["GET", "POST"] },
  );
}
