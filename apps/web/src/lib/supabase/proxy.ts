// Session refresh for apps/web/proxy.ts (Next 16's middleware; the auth tasks
// T41/T47 add the file and its matcher). @supabase/ssr needs one place that
// can write cookies on every request, so an expired access token is refreshed
// before Server Components read it. Fixture mode has no sessions: it passes
// the request through.
//
//   // apps/web/proxy.ts
//   import { refreshSession } from "@/src/lib/supabase/proxy";
//   export const proxy = refreshSession;
//
// M2 gate gap B: a signed-out reader on an account route (today /following
// and /privacy; proxy.ts's matcher names every path this guards, so a later
// account page joins both lists) is sent to /sign-in?next=<path> here,
// before any Server Component runs — never the `auth_required` the page's
// own buyer read would otherwise throw into Next's generic error render.
// The public pages (project, developer, search, trust) carry no session at
// all and stay outside proxy.ts's matcher, so they're untouched.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dataMode } from "@/src/data/mode";
import { supabaseConfig } from "./config";

const ACCOUNT_PATHS = ["/following", "/privacy"] as const;

function isAccountPath(pathname: string): boolean {
  return ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

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
  // auth cookies it returns at once, with no network call. `data` carries
  // the verified claims only once a real session answered; no claims (no
  // session, or one that failed to verify) is never distinguished from
  // "signed out" here — the account guard below treats both the same.
  const { data } = await supabase.auth.getClaims();

  if (!data && isAccountPath(request.nextUrl.pathname)) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signIn);
  }

  return response;
}
