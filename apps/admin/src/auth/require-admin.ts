// Deny by default (AGENTS.md, this task's brief): every /(admin) route calls this
// before rendering anything else. Three outcomes, never a fourth — there is no path
// that renders protected content without both the admin role and aal2.
import { getAdminSession } from "./session";
import { isAdmin } from "./types";
import type { AdminSession } from "./types";

export type AdminAccess =
  | { readonly ok: true; readonly session: AdminSession }
  | { readonly ok: false; readonly reason: "signed_out" | "forbidden"; readonly session: AdminSession };

export async function checkAdminAccess(): Promise<AdminAccess> {
  const session = await getAdminSession();
  if (!session.email) return { ok: false, reason: "signed_out", session };
  if (!isAdmin(session)) return { ok: false, reason: "forbidden", session };
  return { ok: true, session };
}
