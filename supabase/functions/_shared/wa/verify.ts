// _shared/wa/verify: who is talking to wa-webhook and wa-flows (T44; API_CONTRACTS §5.1, §5.3).
//
//   verifyHandshake(params, token)           GET ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=n
//                                            → n when the token matches, else forbidden (403)
//   readRawBody(req)                         the exact bytes Meta signed (size-capped)
//   verifyMetaSignature(raw, header, secret) X-Hub-Signature-256 = "sha256=" + hex HMAC-SHA256(
//                                            WA_APP_SECRET, raw body), compared in constant time;
//                                            missing or wrong → forbidden (403)
//   metaSignature(secret, raw)               that header value (tests sign recorded payloads)
//   parseWebhook(raw)                        { messages, statuses } from Meta's envelope
//   mintTapToken(input)                      a ≤ 60 s user JWT for a verified tap (below)
//
// Acting as the user (the T40 handoff). app.consents accepts a consent only under the
// principal's own JWT (role authenticated, sub = principal); the service role is rejected. A
// consent tap that starts on WhatsApp therefore runs as the user. After wa-webhook has verified
// Meta's signature and resolved the sender to a linked account (pii.wa_contacts.user_id),
// mintTapToken signs a JWT with the project JWT secret (PLINTH_JWT_SECRET, else
// SUPABASE_JWT_SECRET):
//   { role: "authenticated", aud: "authenticated", sub: <user id>, iat, exp ≤ iat + 60,
//     amr: [{ method: "whatsapp_tap", timestamp: iat }], wa_message_id: <the tap's id>,
//     iss: "plinth/wa-webhook", is_anonymous: false, aal: "aal1" }
// It refuses: no secret (EnvError), an unlinked number (auth_required), a message that is not a
// button or interactive tap, or a tap older than 15 minutes (forbidden), and any TTL over 60 s.
// The consent RPCs (T46a/T46b) call comms.current_wa_tap() (migration 20261114000200), which
// checks the amr method and that wa_message_id is a real inbound tap from the same user's number.

import {
  fromBase64,
  hmacSha256,
  timingSafeEqual,
  timingSafeEqualText,
  toBase64,
  toHex,
  utf8,
} from "../core/crypto.ts";
import type { Bytes } from "../core/crypto.ts";
import type { EnvSource, Secret } from "../core/env.ts";
import { EnvError, readSecret } from "../core/env.ts";
import { HttpError } from "../core/errors.ts";

export const SIGNATURE_HEADER = "x-hub-signature-256";

/** Meta batches up to 1,000 updates; text payloads stay far below this. */
export const MAX_WEBHOOK_BYTES = 1024 * 1024;

// ---------------------------------------------------------------------------------------------
// GET handshake
// ---------------------------------------------------------------------------------------------

/** The challenge to echo when hub.mode is subscribe and the token matches; else forbidden. */
export async function verifyHandshake(
  params: URLSearchParams,
  verifyToken: Secret | null,
): Promise<string> {
  const expected = verifyToken?.reveal();
  if (!expected) throw new EnvError(["WA_VERIFY_TOKEN"], "is not set");
  const mode = params.get("hub.mode");
  const challenge = params.get("hub.challenge") ?? "";
  const tokenOk = await timingSafeEqualText(params.get("hub.verify_token") ?? "", expected);
  if (mode !== "subscribe" || !tokenOk || !/^[A-Za-z0-9_-]{1,128}$/.test(challenge)) {
    throw new HttpError("forbidden", "The verify token does not match.");
  }
  return challenge;
}

// ---------------------------------------------------------------------------------------------
// POST signature
// ---------------------------------------------------------------------------------------------

/** The body's exact bytes, refusing anything over maxBytes (invalid_input). */
export async function readRawBody(req: Request, maxBytes = MAX_WEBHOOK_BYTES): Promise<Bytes> {
  const declared = Number(req.headers.get("content-length") ?? "NaN");
  const tooBig = () =>
    new HttpError("invalid_input", `The request body is over ${maxBytes} bytes.`);
  if (Number.isFinite(declared) && declared > maxBytes) {
    await req.body?.cancel();
    throw tooBig();
  }
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw tooBig();
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    all.set(c, at);
    at += c.byteLength;
  }
  return all;
}

/** "sha256=<hex HMAC-SHA256(appSecret, raw)>", the X-Hub-Signature-256 value. */
export async function metaSignature(appSecret: string, raw: string | Bytes): Promise<string> {
  return `sha256=${toHex(await hmacSha256(appSecret, raw))}`;
}

/** Throws forbidden unless the header is Meta's signature of these exact bytes. */
export async function verifyMetaSignature(
  raw: Bytes,
  header: string | null,
  appSecret: Secret | null,
): Promise<void> {
  const secret = appSecret?.reveal();
  if (!secret) throw new EnvError(["WA_APP_SECRET"], "is not set");
  const m = /^sha256=([0-9a-fA-F]{64})$/.exec(header?.trim() ?? "");
  if (!m) throw new HttpError("forbidden", "The request is not signed by Meta.");
  const given = hexToBytes(m[1]!.toLowerCase());
  const expected = await hmacSha256(secret, raw);
  if (!timingSafeEqual(given, expected)) {
    throw new HttpError("forbidden", "The signature does not match.");
  }
}

function hexToBytes(hex: string): Bytes {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// ---------------------------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------------------------

/** One inbound message, normalised for the router. `raw` is Meta's message object. */
export interface InboundMessage {
  waMessageId: string;
  /** The sender's wa_id: digits, no "+". Never logged. */
  from: string;
  /** Meta's type: text, button, interactive, image, document, audio, video, sticker, … */
  type: string;
  timestamp: Date | null;
  /** The message this one replies to (Meta context.id), e.g. the card a button sat under. */
  contextId: string | null;
  /** text.body, a button's text, an interactive reply's title, or a media caption. */
  text: string | null;
  /** A quick-reply payload (button) or an interactive reply id. */
  replyId: string | null;
  /** button_reply | list_reply | nfm_reply for interactive messages. */
  interactiveType: string | null;
  /** The media id for image, document, audio, video and sticker messages. */
  mediaId: string | null;
  raw: Record<string, unknown>;
}

export type DeliveryStatus = "sent" | "delivered" | "read" | "failed";

export interface StatusEvent {
  waMessageId: string;
  status: DeliveryStatus;
  timestamp: Date | null;
  /** Meta's first error object on failed, else null. */
  error: Record<string, unknown> | null;
}

export interface WebhookEvents {
  messages: InboundMessage[];
  statuses: StatusEvent[];
}

const MEDIA_TYPES = new Set(["image", "document", "audio", "video", "sticker"]);
const STATUSES = new Set<DeliveryStatus>(["sent", "delivered", "read", "failed"]);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

function epoch(v: unknown): Date | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : null;
}

/** Normalises one Meta message object; null when it has no id, sender or type. */
export function normalizeMessage(raw: unknown, from?: string): InboundMessage | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id);
  const sender = str(from) ?? str(raw.from);
  const type = str(raw.type);
  if (!id || !sender || !/^[0-9]{8,15}$/.test(sender) || !type || !/^[a-z_]{1,40}$/.test(type)) {
    return null;
  }
  let text: string | null = null;
  let replyId: string | null = null;
  let interactiveType: string | null = null;
  let mediaId: string | null = null;
  if (type === "text" && isObj(raw.text)) text = str(raw.text.body);
  if (type === "button" && isObj(raw.button)) {
    text = str(raw.button.text);
    replyId = str(raw.button.payload);
  }
  if (type === "interactive" && isObj(raw.interactive)) {
    interactiveType = str(raw.interactive.type);
    const reply = interactiveType ? raw.interactive[interactiveType] : null;
    if (isObj(reply)) {
      replyId = str(reply.id);
      text = str(reply.title) ?? str(reply.body);
    }
  }
  if (MEDIA_TYPES.has(type) && isObj(raw[type])) {
    const media = raw[type] as Obj;
    mediaId = str(media.id);
    text = str(media.caption);
  }
  return {
    waMessageId: id,
    from: sender,
    type,
    timestamp: epoch(raw.timestamp),
    contextId: isObj(raw.context) ? str(raw.context.id) : null,
    text,
    replyId,
    interactiveType,
    mediaId,
    raw,
  };
}

/** The message object as stored in comms.wa_messages.payload: no sender number. */
export function redactMessage(raw: Obj): Obj {
  const { from: _from, ...rest } = raw;
  if (isObj(rest.context)) {
    const { from: _ctxFrom, ...context } = rest.context;
    return { ...rest, context };
  }
  return rest;
}

/** Messages and statuses from Meta's envelope. Profile names in `contacts` are dropped. */
export function parseWebhook(raw: Bytes | string): WebhookEvents {
  let body: unknown;
  try {
    body = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
  } catch {
    throw new HttpError("invalid_input", "The webhook body is not JSON.");
  }
  const events: WebhookEvents = { messages: [], statuses: [] };
  if (!isObj(body) || body.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) {
    return events;
  }
  for (const entry of body.entry) {
    if (!isObj(entry) || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isObj(change) || change.field !== "messages" || !isObj(change.value)) continue;
      const value = change.value;
      for (const m of Array.isArray(value.messages) ? value.messages : []) {
        const msg = normalizeMessage(m);
        if (msg) events.messages.push(msg);
      }
      for (const s of Array.isArray(value.statuses) ? value.statuses : []) {
        if (!isObj(s)) continue;
        const id = str(s.id);
        const status = str(s.status) as DeliveryStatus | null;
        if (!id || !status || !STATUSES.has(status)) continue;
        const firstError = Array.isArray(s.errors) && isObj(s.errors[0]) ? s.errors[0] : null;
        events.statuses.push({
          waMessageId: id,
          status,
          timestamp: epoch(s.timestamp),
          error: firstError,
        });
      }
    }
  }
  return events;
}

// ---------------------------------------------------------------------------------------------
// Tap token: acting as the verified sender (see the header)
// ---------------------------------------------------------------------------------------------

export const TAP_TOKEN_MAX_TTL_S = 60;
export const TAP_MAX_AGE_MS = 15 * 60 * 1000;
export const TAP_AMR_METHOD = "whatsapp_tap";
export const TAP_TOKEN_ISSUER = "plinth/wa-webhook";

/** Message types that are a person's tap (reply button, list row, template quick reply, Flow). */
export function isTap(msg: InboundMessage): boolean {
  if (msg.type === "interactive" && msg.interactiveType === "nfm_reply") return true;
  return (msg.type === "interactive" || msg.type === "button") && msg.replyId !== null;
}

/** PLINTH_JWT_SECRET, else SUPABASE_JWT_SECRET: the HS256 secret PostgREST verifies. */
export function readTapSecret(src: EnvSource): Secret | null {
  return readSecret(src, "PLINTH_JWT_SECRET") ?? readSecret(src, "SUPABASE_JWT_SECRET");
}

export interface TapTokenInput {
  secret: Secret | null;
  /** pii.wa_contacts.user_id of the verified sender. */
  userId: string | null;
  /** The verified inbound tap. */
  message: InboundMessage;
  /** Wall clock (exp is checked by PostgREST against real time). */
  now: Date;
  /** Default and maximum 60. */
  ttlSeconds?: number;
}

export interface TapClaims {
  iss: string;
  aud: "authenticated";
  role: "authenticated";
  sub: string;
  iat: number;
  exp: number;
  amr: { method: string; timestamp: number }[];
  wa_message_id: string;
  is_anonymous: false;
  aal: "aal1";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function base64url(bytes: Bytes): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The claims mintTapToken signs, after every refusal check. */
export function tapClaims(input: TapTokenInput): TapClaims {
  const ttl = input.ttlSeconds ?? TAP_TOKEN_MAX_TTL_S;
  if (!Number.isInteger(ttl) || ttl < 1 || ttl > TAP_TOKEN_MAX_TTL_S) {
    throw new RangeError(`a tap token lives 1–${TAP_TOKEN_MAX_TTL_S} s`);
  }
  if (!input.userId || !UUID_RE.test(input.userId)) {
    throw new HttpError("auth_required", "This WhatsApp number is not linked to an account.");
  }
  if (!isTap(input.message)) {
    throw new HttpError("forbidden", "Only a tap on a WhatsApp button can act for an account.");
  }
  const tappedAt = input.message.timestamp?.getTime();
  const nowMs = input.now.getTime();
  if (tappedAt === undefined || nowMs - tappedAt > TAP_MAX_AGE_MS || tappedAt - nowMs > 60_000) {
    throw new HttpError("forbidden", "That tap is too old to act on. Tap the button again.");
  }
  const iat = Math.floor(nowMs / 1000);
  return {
    iss: TAP_TOKEN_ISSUER,
    aud: "authenticated",
    role: "authenticated",
    sub: input.userId,
    iat,
    exp: iat + ttl,
    amr: [{ method: TAP_AMR_METHOD, timestamp: iat }],
    wa_message_id: input.message.waMessageId,
    is_anonymous: false,
    aal: "aal1",
  };
}

/** An HS256 JWT for tapClaims(input). Never log it (the logger masks "eyJ…" anyway). */
export async function mintTapToken(input: TapTokenInput): Promise<string> {
  const secret = input.secret?.reveal();
  if (!secret) throw new EnvError(["PLINTH_JWT_SECRET"], "is not set");
  const claims = tapClaims(input);
  const header = base64url(utf8(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64url(utf8(JSON.stringify(claims)));
  const signature = base64url(await hmacSha256(secret, `${header}.${payload}`));
  return `${header}.${payload}.${signature}`;
}

/** The payload of a JWT, unverified (tests and logs of claims only). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new Error("not a JWT");
  return JSON.parse(new TextDecoder().decode(fromBase64(part)));
}
