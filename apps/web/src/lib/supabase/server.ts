// Server-side Supabase clients (BUILD_PLAN §5.2). Two kinds:
//
// - publicClient(): the publishable key, no session. Public reads (anon,
//   cacheable): it never touches cookies, so it can run inside "use cache".
// - sessionClient(): the buyer's session from cookies via @supabase/ssr. Buyer
//   API calls only. A fresh client per request, as @supabase/ssr requires.
//   Server Components cannot write cookies; the proxy refreshes the session
//   (proxy.ts, wired by the auth tasks).
//
// Both resolve `fetch` at call time, so Next's fetch and test doubles apply.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

const lateFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

let shared: { key: string; client: SupabaseClient } | null = null;

/** The anonymous client (publishable key, no session), shared per URL and key. */
export function publicClient(): SupabaseClient {
  const { url, publishableKey } = supabaseConfig();
  const key = `${url}\n${publishableKey}`;
  if (shared?.key !== key) {
    shared = {
      key,
      client: createClient(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { fetch: lateFetch },
      }),
    };
  }
  return shared.client;
}

/** A client carrying the buyer's session (the cookies of this request). */
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
          // Called from a Server Component, which cannot set cookies. The proxy
          // writes refreshed tokens on the next request.
        }
      },
    },
    global: { fetch: lateFetch },
  });
}
