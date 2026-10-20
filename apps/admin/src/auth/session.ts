// Reads the operator's session for this request (API_CONTRACTS §5.4: the access-token
// hook adds plinth_roles[] and aal to the JWT claims). Fixture mode never touches
// Supabase (AGENTS.md "Fixture mode must work without Supabase"): it answers with the
// already-elevated fixture admin so /ops and the shell render with no project configured.
//
// This reads cookies() (through sessionClient()), so every caller must sit inside a
// <Suspense> boundary — reading a runtime request API outside one is a build error
// under this app's cacheComponents setting (node_modules/next/dist/docs/01-app/
// 02-guides/authentication-with-cache-components.md).
import "server-only";
import { dataMode } from "@/src/data/mode";
import { sessionClient } from "@/src/lib/supabase/server";
import { FIXTURE_ADMIN_SESSION } from "./fixture";
import type { AdminSession } from "./types";

const SIGNED_OUT: AdminSession = { email: null, roles: [], aal: null };

export async function getAdminSession(): Promise<AdminSession> {
  if (dataMode() === "fixtures") return FIXTURE_ADMIN_SESSION;

  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return SIGNED_OUT;

  const { claims } = data;
  const roles = Array.isArray(claims.plinth_roles)
    ? claims.plinth_roles.filter((r): r is string => typeof r === "string")
    : [];
  const aalClaim: string = claims.aal;
  const aal = aalClaim === "aal2" ? "aal2" : aalClaim === "aal1" ? "aal1" : null;
  return { email: typeof claims.email === "string" ? claims.email : null, roles, aal };
}
