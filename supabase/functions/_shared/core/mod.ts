// _shared/core: the edge foundation every function builds on (T29). Owner: T29.
//
//   Functions take createHandler, HttpError and json from _shared/core/mod.ts, and parseBody from
//   _shared/core/validate.ts (kept separate: it loads the contract validators). Never write an
//   import statement in a comment here: the Supabase CLI's import scanner follows it and fails.
//
// Pattern (pet_app): <fn>/index.ts is a thin Deno.serve wiring with a header contract comment;
// the decisions live in <fn>/logic.ts and are tested in <fn>/logic.test.ts with the helpers in
// _shared/testing (fake requests, a frozen clock, fake env, captured logs, fake fetch). Tests run
// without network permission, so no test can reach a real provider.
//
//   env.ts        readCoreEnv, readVar/requireVar/readSecret, Secret, the mode defaults
//   clock.ts      Clock, systemClock, fixedClock, businessClock (frozen in the fixture world)
//   log.ts        JSON-lines logger with request_id, redaction and scrubbing
//   errors.ts     contract error codes and statuses, HttpError, fromRpcError
//   http.ts       json/ok/errorResponse, readJson (size-capped), request id, client IP, CORS
//   handler.ts    createHandler: request id, context, method guard, errors, access log
//   crypto.ts     sha256, HMAC, constant-time compare, pseudonym
//   auth.ts       dispatch secret (pg_net → edge), bearer token
//   webhooks.ts   Standard Webhooks (Supabase Auth hooks)
//   supabase.ts   anon / user / secret clients bound to the api schema, callRpc
//   ratelimit.ts  fixed-window limits keyed by a pseudonym (ops.rate_limits)
//   flags.ts      api.flags() reader and kill-switch guard
//   validate.ts   ajv: contract validators and runtime-compiled edge schemas (not re-exported here)

export * from "./auth.ts";
export * from "./clock.ts";
export * from "./crypto.ts";
export * from "./env.ts";
export * from "./errors.ts";
export * from "./flags.ts";
export * from "./handler.ts";
export * from "./http.ts";
export * from "./log.ts";
export * from "./ratelimit.ts";
export * from "./supabase.ts";
export * from "./webhooks.ts";
