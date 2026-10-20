// Next 16's proxy (the renamed middleware.js; see node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/proxy.md). @supabase/ssr needs one place that
// can write cookies on every request, so an expired access token is refreshed before
// a Server Component reads it. Fixture mode has no sessions: it passes the request
// through (AGENTS.md "Fixture mode must work without Supabase").
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dataMode } from "@/src/data/mode";
import { supabaseConfig } from "@/src/lib/supabase/config";

export async function proxy(request: NextRequest): Promise<NextResponse> {
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
  // Verifies the access token and refreshes it when it has expired. Without auth
  // cookies it returns at once, with no network call.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
