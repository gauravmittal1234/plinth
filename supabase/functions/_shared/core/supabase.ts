// Supabase client factory for edge functions (T29; BUILD_PLAN §5.4, §12.1, §12.5).
//
// Only the `api` schema is exposed to PostgREST, so every client is bound to it. Three variants:
//   anonClient(cfg)            publishable key: public reads (api.flags, api.risk_summary …)
//   userClient(cfg, jwt)       publishable key + the caller's JWT: RLS and auth.uid() apply
//   secretClient(cfg)          secret key: only where a function must bypass RLS (webhooks, outbox).
//                              The secret never leaves the edge (ci-guard checks apps/).
// Every client sends x-request-id (BUILD_PLAN §11) and x-client-info "plinth-edge/<fn>".
//
// callRpc(client, "fn", args) returns data or throws the contract HttpError (fromRpcError).
// Service-only RPCs live in `api` with EXECUTE granted to service_role alone.

import type { Secret, SupabaseConfig } from "./env.ts";
import { need } from "./env.ts";
import type { PostgrestErrorLike } from "./errors.ts";
import { fromRpcError } from "./errors.ts";
import { requireBearer } from "./auth.ts";
import { createClient } from "./deps.ts";
import { REQUEST_ID_HEADER } from "./http.ts";

export interface ClientOptions {
  requestId?: string;
  /** The calling function, for x-client-info. */
  fn?: string;
  /** Injected in tests; defaults to the global fetch. */
  fetch?: typeof fetch;
}

function make(url: string, key: string, opts: ClientOptions, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = {
    "x-client-info": `plinth-edge/${opts.fn ?? "unknown"}`,
    ...extra,
  };
  if (opts.requestId) headers[REQUEST_ID_HEADER] = opts.requestId;
  return createClient(url, key, {
    db: { schema: "api" },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers, ...(opts.fetch ? { fetch: opts.fetch } : {}) },
  });
}

export type ApiClient = ReturnType<typeof make>;

export function anonClient(cfg: SupabaseConfig, opts: ClientOptions = {}): ApiClient {
  return make(
    need(cfg.url, "SUPABASE_URL"),
    need(cfg.publishableKey, "SUPABASE_PUBLISHABLE_KEY"),
    opts,
  );
}

/** A client acting as the user whose access token this is. */
export function userClient(
  cfg: SupabaseConfig,
  accessToken: string,
  opts: ClientOptions = {},
): ApiClient {
  return make(
    need(cfg.url, "SUPABASE_URL"),
    need(cfg.publishableKey, "SUPABASE_PUBLISHABLE_KEY"),
    opts,
    { Authorization: `Bearer ${accessToken}` },
  );
}

/** userClient with the bearer token of the incoming request (auth_required when absent). */
export function userClientFromRequest(
  cfg: SupabaseConfig,
  req: Request,
  opts: ClientOptions = {},
): ApiClient {
  return userClient(cfg, requireBearer(req), opts);
}

export function secretClient(cfg: SupabaseConfig, opts: ClientOptions = {}): ApiClient {
  const key: Secret = need(cfg.secretKey, "SUPABASE_SECRET_KEY");
  return make(need(cfg.url, "SUPABASE_URL"), key.reveal(), opts);
}

/** What callRpc needs from a client: supabase-js, or a fake in tests. */
export interface RpcResult {
  data: unknown;
  error: PostgrestErrorLike | null;
}
export interface RpcBuilder extends PromiseLike<RpcResult> {
  abortSignal?(signal: AbortSignal): PromiseLike<RpcResult>;
}
export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>, options?: { get?: boolean }): RpcBuilder;
}

export interface CallRpcOptions {
  signal?: AbortSignal;
  /** Use GET (STABLE functions only; cacheable). */
  get?: boolean;
}

/** Calls api.<fn>; returns its data or throws the contract error. */
export async function callRpc<T = unknown>(
  client: RpcClient,
  fn: string,
  args?: Record<string, unknown>,
  opts: CallRpcOptions = {},
): Promise<T> {
  const builder = client.rpc(fn, args ?? {}, opts.get ? { get: true } : undefined);
  const pending = opts.signal && builder.abortSignal ? builder.abortSignal(opts.signal) : builder;
  const { data, error } = await pending;
  if (error) throw fromRpcError(error);
  return data as T;
}
