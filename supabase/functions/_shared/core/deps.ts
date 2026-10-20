// Third-party runtime dependencies of the edge functions, in one place (T29).
//
// Specifiers are inline and exact (`npm:pkg@x.y.z`), as in pet_app, so they resolve the same way
// under `deno test`, `supabase functions serve` and `supabase functions deploy`, with or without
// an import map (deno.json turns off lint's no-import-prefix for this reason). Bump a version here,
// never in a function. supabase-js matches the repo pin (package-lock.json, AGENTS.md §3).
//
// The one exception is ajv: validate.ts imports it lazily with literal specifiers
// (npm:ajv@8.20.0, npm:ajv-formats@3.0.1), so only a function that compiles an edge-local schema
// pays for it, and the bundler still sees the import. The contract validators are ajv standalone
// code with no runtime import at all.

export { createClient } from "npm:@supabase/supabase-js@2.109.0";
export type { SupabaseClient } from "npm:@supabase/supabase-js@2.109.0";
