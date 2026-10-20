// The request wrapper every edge function uses (T29; BUILD_PLAN §11, API_CONTRACTS §1).
//
//   Deno.serve(createHandler("ask", async (req, ctx) => { … return json(answer); }, { methods: ["POST"] }));
//
// For each request it:
//   1. takes the caller's x-request-id (or makes one) and echoes it on the response;
//   2. gives the handler a context: env (read once per isolate), wall clock, client IP, a JSON
//      logger bound to fn + request_id, identify(userId) for the user_hash, waitUntil(task);
//   3. answers CORS preflights when `cors` is set, and refuses other methods (not_found + Allow);
//   4. turns a thrown HttpError into its contract body; anything else becomes `internal` (500),
//      with the cause in the log and never in the response;
//   5. writes one access line: method, path (never the query string), status, latency_ms.

import type { Clock } from "./clock.ts";
import { systemClock } from "./clock.ts";
import { pseudonym } from "./crypto.ts";
import type { CoreEnv } from "./env.ts";
import { EnvError, isDevEnv, readCoreEnv } from "./env.ts";
import { HttpError } from "./errors.ts";
import type { CorsOptions } from "./http.ts";
import {
  clientIp,
  corsHeaders,
  errorResponse,
  preflight,
  REQUEST_ID_HEADER,
  requestIdOf,
} from "./http.ts";
import type { Logger, LogLevel, LogSink } from "./log.ts";
import { createLogger, errorFields } from "./log.ts";

export interface RequestContext {
  /** The function's name, as deployed. */
  readonly fn: string;
  readonly requestId: string;
  readonly env: CoreEnv;
  /** Wall clock (latency, timeouts, signature tolerance). Business dates: clock.ts businessClock. */
  readonly clock: Clock;
  readonly ip: string | null;
  /** The request's logger; carries user_hash once identify() has run. */
  readonly log: Logger;
  /** Adds user_hash (a salted pseudonym of the user id) to every later log line. */
  identify(userId: string): Promise<string>;
  /** Runs a task after the response is sent (EdgeRuntime.waitUntil); failures are logged. */
  waitUntil(task: Promise<unknown>): void;
}

export type Handler = (req: Request, ctx: RequestContext) => Response | Promise<Response>;

export interface HandlerOptions {
  /** Methods the function answers, e.g. ["POST"]. Others get not_found with an Allow header. */
  methods: readonly string[];
  cors?: CorsOptions;
  /** Fixed env for tests, or a reader. Default: readCoreEnv() once per isolate. */
  env?: CoreEnv | (() => CoreEnv);
  sink?: LogSink;
  clock?: Clock;
  /** Default: debug in local and test, info elsewhere. */
  logLevel?: LogLevel;
}

let isolateEnv: CoreEnv | null = null;

/** readCoreEnv(), cached for the isolate once it succeeds. */
export function isolateCoreEnv(): CoreEnv {
  isolateEnv ??= readCoreEnv();
  return isolateEnv;
}

/** A public salt used only when PLINTH_HASH_SALT is unset (local, tests). */
const FALLBACK_SALT = "plinth-unsalted";
let warnedNoSalt = false;

interface EdgeRuntimeLike {
  waitUntil(task: Promise<unknown>): void;
}

/** EdgeRuntime.waitUntil when running on Supabase; elsewhere the task simply runs on. */
export function waitUntil(task: Promise<unknown>, log?: Logger): void {
  const guarded = task.catch((err) => log?.error("background task failed", errorFields(err)));
  const runtime = (globalThis as { EdgeRuntime?: EdgeRuntimeLike }).EdgeRuntime;
  if (typeof runtime?.waitUntil === "function") runtime.waitUntil(guarded);
}

function resolveEnv(option: HandlerOptions["env"]): CoreEnv {
  if (option === undefined) return isolateCoreEnv();
  return typeof option === "function" ? option() : option;
}

function render(err: unknown, log: Logger): Response {
  if (err instanceof HttpError) {
    if (err.status >= 500) log.error(err.message, errorFields(err));
    return errorResponse(err);
  }
  if (err instanceof EnvError) {
    log.error("configuration error", { missing_or_invalid: err.names });
    return errorResponse("internal");
  }
  log.error("unhandled error", errorFields(err));
  return errorResponse("internal");
}

export function createHandler(
  fn: string,
  handler: Handler,
  options: HandlerOptions,
): (req: Request) => Promise<Response> {
  const methods = options.methods.map((m) => m.toUpperCase());
  const clock = options.clock ?? systemClock;

  return async (req: Request): Promise<Response> => {
    const started = performance.now();
    const requestId = requestIdOf(req);
    const path = new URL(req.url).pathname;

    let env: CoreEnv | null = null;
    let envError: unknown = null;
    try {
      env = resolveEnv(options.env);
    } catch (e) {
      envError = e;
    }
    const minLevel = options.logLevel ?? (env && isDevEnv(env.plinthEnv) ? "debug" : "info");
    let log = createLogger({ fn, requestId, sink: options.sink, minLevel, clock });

    const ctx: RequestContext = {
      fn,
      requestId,
      get env(): CoreEnv {
        if (!env) throw envError;
        return env;
      },
      clock,
      ip: clientIp(req),
      get log() {
        return log;
      },
      identify: async (userId: string) => {
        const salt = env?.hashSalt?.reveal();
        if (!salt && env && !isDevEnv(env.plinthEnv) && !warnedNoSalt) {
          warnedNoSalt = true;
          log.warn("PLINTH_HASH_SALT is not set; user_hash uses a public salt");
        }
        const userHash = (await pseudonym(userId, salt ?? FALLBACK_SALT)).slice(0, 16);
        log = log.child({ user_hash: userHash });
        return userHash;
      },
      waitUntil: (task) => waitUntil(task, log),
    };

    let res: Response;
    try {
      if (envError) throw envError;
      if (req.method === "OPTIONS" && options.cors) {
        res = preflight(req, options.cors);
      } else if (!methods.includes(req.method)) {
        await req.body?.cancel();
        throw new HttpError("not_found", `There is nothing here for ${req.method}.`, {
          headers: { allow: methods.join(", ") },
        });
      } else {
        res = await handler(req, ctx);
      }
    } catch (err) {
      res = render(err, log);
    }

    const headers = new Headers(res.headers);
    headers.set(REQUEST_ID_HEADER, requestId);
    if (options.cors && req.method !== "OPTIONS") {
      corsHeaders(req, options.cors)?.forEach((value, key) => headers.set(key, value));
    }
    const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers });

    const fields = {
      method: req.method,
      path,
      status: out.status,
      latency_ms: Math.round(performance.now() - started),
    };
    if (out.status >= 500) log.error("request", fields);
    else if (out.status >= 400) log.warn("request", fields);
    else log.info("request", fields);
    return out;
  };
}
