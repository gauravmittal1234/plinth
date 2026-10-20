// Session refresh for apps/web/proxy.ts (Next 16's middleware; the auth tasks
// T41/T47 add the file and its matcher). @supabase/ssr needs one place that
// can write cookies on every request, so an expired access token is refreshed
// before Server Components read it. Fixture mode has no sessions: it passes
// the request through.
//
//   // apps/web/proxy.ts
//   import { refreshSession } from "@/src/lib/supabase/proxy";
//   export const proxy = refreshSession;
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dataMode } from "@/src/data/mode";
import { supabaseConfig } from "./config";

export async function refreshSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  if (dataMode() !== "supabase") return response;

  const { url, publishableKey } = supabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  // Verifies the access token and refreshes it when it has expired. Without
  // auth cookies it returns at once, with no network call.
  await supabase.auth.getClaims();
  return response;
}
