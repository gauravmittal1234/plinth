// health: liveness + DB ping (API_CONTRACTS §3.5; BUILD_PLAN §11 uptime). Tested in logic.test.ts.
//
// The database answers when api.flags() returns plinth.flags/1 to the anon role through PostgREST:
// that proves the gateway, PostgREST, the `api` schema grants and Postgres in one cheap call,
// without the secret key.

import type { Handler, HandlerOptions, RequestContext } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import { HttpError } from "../_shared/core/errors.ts";
import { json } from "../_shared/core/http.ts";
import { anonClient, callRpc } from "../_shared/core/supabase.ts";

/** How long the DB ping may take before health fails. */
export const DB_TIMEOUT_MS = 2000;

export type PingDb = (signal: AbortSignal, ctx: RequestContext) => Promise<void>;

/** Throws unless the payload is a plinth.flags/1 envelope. */
export function assertFlagsEnvelope(payload: unknown): void {
  const p = payload as { schema?: unknown; flags?: unknown } | null;
  if (!p || p.schema !== "plinth.flags/1" || !p.flags || typeof p.flags !== "object") {
    throw new Error("api.flags() did not return plinth.flags/1");
  }
}

/** The production ping: api.flags() as anon. `fetch` is injected in tests. */
export function pingApiFlags(fetchImpl?: typeof fetch): PingDb {
  return async (signal, ctx) => {
    const client = anonClient(ctx.env.supabase, {
      requestId: ctx.requestId,
      fn: ctx.fn,
      fetch: fetchImpl,
    });
    assertFlagsEnvelope(await callRpc(client, "flags", undefined, { signal }));
  };
}

/** Runs the ping, rejecting after timeoutMs even if the ping ignores its signal. */
async function withTimeout(ping: PingDb, ctx: RequestContext, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`database ping timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });
  try {
    await Promise.race([ping(controller.signal, ctx), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export interface HealthDeps {
  pingDb: PingDb;
  timeoutMs?: number;
}

export function healthHandler(deps: HealthDeps): Handler {
  return async (_req, ctx) => {
    const started = performance.now();
    try {
      await withTimeout(deps.pingDb, ctx, deps.timeoutMs ?? DB_TIMEOUT_MS);
    } catch (err) {
      if (err instanceof HttpError && err.code !== "internal") throw err;
      throw new HttpError("internal", "The database did not answer.", { cause: err });
    }
    const dbMs = Math.round(performance.now() - started);
    return json({ ok: true }, { headers: { "x-plinth-db-ms": String(dbMs) } });
  };
}

export interface MakeHealthOptions extends Omit<HandlerOptions, "methods"> {
  pingDb?: PingDb;
  timeoutMs?: number;
}

/** The deployed function: GET only, wrapped by createHandler. */
export function makeHealth(opts: MakeHealthOptions = {}): (req: Request) => Promise<Response> {
  const { pingDb, timeoutMs, ...handlerOptions } = opts;
  return createHandler(
    "health",
    healthHandler({ pingDb: pingDb ?? pingApiFlags(), timeoutMs }),
    { ...handlerOptions, methods: ["GET"] },
  );
}
