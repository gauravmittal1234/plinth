// Request and response helpers (T29; API_CONTRACTS §1).
//
//   json(body)                 200 JSON, `cache-control: no-store` unless you set one
//   ok()                       { ok: true } (the contract's Ok acknowledgement)
//   errorResponse(err)         { error: { code, message } } with the code's status
//   readText / readJson        a size-capped body read; bad JSON → invalid_input (422)
//   requestIdOf(req)           the caller's x-request-id when well-formed, else a new UUID
//   clientIp(req)              the caller's IP from the platform's forwarding headers
//   bearerToken(req)           the token in `Authorization: Bearer …`, or null
//   corsHeaders / preflight    for functions the web app calls from the browser (ask, doc-check)

import type { EdgeErrorCode } from "./errors.ts";
import { HttpError } from "./errors.ts";

export const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
export const REQUEST_ID_HEADER = "x-request-id";

/** Default body cap for JSON requests. Uploads go to Storage, never through a function body. */
export const DEFAULT_MAX_BODY_BYTES = 64 * 1024;

export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", JSON_CONTENT_TYPE);
  if (!headers.has("cache-control")) headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { ...init, headers });
}

export function ok(init: ResponseInit = {}): Response {
  return json({ ok: true }, init);
}

export function errorResponse(err: HttpError | EdgeErrorCode, message?: string): Response {
  const e = typeof err === "string" ? new HttpError(err, message) : err;
  return json(e.body(), { status: e.status, headers: e.headers });
}

const REQUEST_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

/** The caller's x-request-id when it is a well-formed id (8–128 safe characters), else a new one. */
export function requestIdOf(req: Request): string {
  const given = req.headers.get(REQUEST_ID_HEADER)?.trim();
  return given && REQUEST_ID_RE.test(given) ? given : crypto.randomUUID();
}

/** The caller's IP as the Supabase gateway forwards it, or null (local tests). */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim();
  return ip || null;
}

export function bearerToken(req: Request): string | null {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.get("authorization") ?? "");
  return m?.[1] ?? null;
}

export interface ReadBodyOptions {
  /** Largest body accepted, in bytes (default 64 KiB). */
  maxBytes?: number;
}

/** The raw body as text, refusing anything over maxBytes (invalid_input). */
export async function readText(req: Request, opts: ReadBodyOptions = {}): Promise<string> {
  const max = opts.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
  const tooBig = () => new HttpError("invalid_input", `The request body is over ${max} bytes.`);
  const declared = Number(req.headers.get("content-length") ?? "NaN");
  if (Number.isFinite(declared) && declared > max) {
    await req.body?.cancel();
    throw tooBig();
  }
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
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
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(all);
  } catch {
    throw new HttpError("invalid_input", "The request body is not UTF-8 text.");
  }
}

export interface ReadJsonOptions extends ReadBodyOptions {
  /** Require `content-type: application/json` (default true). */
  requireJsonType?: boolean;
}

/** The body parsed as JSON. Wrong content type, bad JSON or an oversized body → invalid_input. */
export async function readJson(req: Request, opts: ReadJsonOptions = {}): Promise<unknown> {
  if (opts.requireJsonType !== false) {
    const type = req.headers.get("content-type") ?? "";
    if (!/^application\/(?:[\w.+-]+\+)?json\b/i.test(type)) {
      await req.body?.cancel();
      throw new HttpError("invalid_input", "Send the body as application/json.");
    }
  }
  return parseJson(await readText(req, opts));
}

/** JSON.parse that fails as invalid_input instead of a SyntaxError. */
export function parseJson(text: string): unknown {
  if (text.trim() === "") throw new HttpError("invalid_input", "The request body is empty.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError("invalid_input", "The request body is not valid JSON.");
  }
}

export interface CorsOptions {
  /** Allowed origins, exact (scheme://host[:port]). "*" allows any origin (public reads only). */
  origins: readonly string[] | "*";
  methods?: readonly string[];
  /** Extra request headers to allow on top of the supabase-js defaults. */
  headers?: readonly string[];
  maxAgeSeconds?: number;
}

const BASE_ALLOWED_HEADERS = [
  "authorization",
  "apikey",
  "content-type",
  "x-client-info",
  REQUEST_ID_HEADER,
];

/** CORS headers for this request's Origin, or null when the origin is not allowed. */
export function corsHeaders(req: Request, opts: CorsOptions): Headers | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const allowed = opts.origins === "*" || opts.origins.includes(origin);
  if (!allowed) return null;
  const h = new Headers();
  h.set("access-control-allow-origin", opts.origins === "*" ? "*" : origin);
  h.set("access-control-allow-methods", (opts.methods ?? ["POST", "OPTIONS"]).join(", "));
  h.set(
    "access-control-allow-headers",
    [...BASE_ALLOWED_HEADERS, ...(opts.headers ?? [])].join(", "),
  );
  h.set("access-control-expose-headers", REQUEST_ID_HEADER);
  h.set("access-control-max-age", String(opts.maxAgeSeconds ?? 600));
  if (opts.origins !== "*") h.set("vary", "Origin");
  return h;
}

/** The answer to a CORS preflight: 204 with the CORS headers (or without, when not allowed). */
export function preflight(req: Request, opts: CorsOptions): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req, opts) ?? undefined });
}
