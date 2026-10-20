// Fake requests for handler tests: a Request as the Supabase gateway would pass it on.

export const FUNCTIONS_BASE = "http://localhost:54321/functions/v1/";

export interface FakeRequestOptions {
  method?: string;
  /** Sent as the body with content-type application/json (method defaults to POST). */
  json?: unknown;
  /** A raw body (method defaults to POST). */
  body?: string;
  headers?: HeadersInit;
  /** Sets Authorization: Bearer <token>. */
  bearer?: string;
  /** Sets x-forwarded-for, as the gateway does. */
  ip?: string;
  requestId?: string;
  /** Query parameters for the URL. */
  query?: Record<string, string>;
}

/** A Request for /functions/v1/<path>. */
export function fakeRequest(path: string, opts: FakeRequestOptions = {}): Request {
  const url = new URL(path.replace(/^\/+/, ""), FUNCTIONS_BASE);
  for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);
  const headers = new Headers(opts.headers);
  let body: string | undefined = opts.body;
  if (opts.json !== undefined) {
    body = JSON.stringify(opts.json);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
  }
  if (opts.bearer) headers.set("authorization", `Bearer ${opts.bearer}`);
  if (opts.ip) headers.set("x-forwarded-for", opts.ip);
  if (opts.requestId) headers.set("x-request-id", opts.requestId);
  const method = opts.method ?? (body === undefined ? "GET" : "POST");
  return new Request(url, { method, headers, body });
}
