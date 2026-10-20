// Next 16 Proxy (formerly middleware; node_modules/next/dist/docs/01-app/
// 03-api-reference/03-file-conventions/proxy.md). Keeps a buyer's Supabase
// session fresh on every account and API request, by writing the refreshed
// cookies before a Server Component reads them (src/lib/supabase/proxy.ts,
// T16's refreshSession; src/lib/supabase/server.ts's sessionClient() can't
// write cookies itself). A no-op in fixture mode: refreshSession() returns
// at once when PLINTH_DATA=fixtures (AGENTS.md "Fixture mode uses fake
// sessions and never calls Supabase Auth").
//
// Scoped to account and sign-in routes plus the API, never the canonical
// public pages (/, /gurugram/**, /compare/**, /methodology): those stay
// static/prerendered (BUILD_PLAN perf gate), and Proxy would force every
// request to run on the server, breaking "○ static" in
// `PLINTH_DATA=fixtures npm run build`.
import { refreshSession } from "@/src/lib/supabase/proxy";

export const proxy = refreshSession;

export const config = {
  matcher: [
    "/sign-in",
    "/sign-in/:path*",
    "/following",
    "/following/:path*",
    "/privacy",
    "/privacy/:path*",
    "/api/:path*",
  ],
};
