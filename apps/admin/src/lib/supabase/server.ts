// The admin app's one server-side Supabase client: the signed-in operator's session,
// from this request's cookies, via @supabase/ssr (BUILD_PLAN §5.2, apps/web's
// src/lib/supabase/server.ts pattern). There is no anonymous/public client here —
// every admin_* RPC requires a session (ops.has_role('admin') reads the JWT claims),
// so a fresh sessionClient() per request is the only client this app needs.
// Server Components cannot write cookies; proxy.ts refreshes the session.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

const lateFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

/** A client carrying the operator's session (the cookies of this request). */
export async function sessionClient(): Promise<SupabaseClient> {
  const { url, publishableKey } = supabaseConfig();
  const store = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, which cannot set cookies. proxy.ts
          // writes refreshed tokens on the next request.
        }
      },
    },
    global: { fetch: lateFetch },
  });
}
