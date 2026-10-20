// health: GET /functions/v1/health (API_CONTRACTS §3.5) · auth: none (T29).
//
// → 200 { "ok": true }      the function runs and api.flags() answered as anon within 2 s
//   500 { "error": { "code": "internal", "message": "The database did not answer." } }
//   404 not_found           any method but GET (Allow: GET)
// Headers: x-request-id (the caller's, or a new one), x-plinth-db-ms, cache-control: no-store.
// Env: SUPABASE_URL and a publishable key (SUPABASE_PUBLISHABLE_KEY, SUPABASE_PUBLISHABLE_KEYS or
// SUPABASE_ANON_KEY; the platform injects them). Never the secret key.
// Deploy without JWT verification (config.toml [functions.health] verify_jwt = false): uptime
// checks carry no token.
// Logic and tests: logic.ts, logic.test.ts.

import { makeHealth } from "./logic.ts";

Deno.serve(makeHealth());
