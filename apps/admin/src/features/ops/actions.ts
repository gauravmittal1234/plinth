"use server";
// The flags editor's one write: api.admin_flag_set via the operator's own session.
// Re-checks admin access here too (not just trusting the client), per Next's own
// guidance for Server Actions — though the real gate is ops.has_role('admin') inside
// the RPC itself, proven forbidden-below-aal2 by pgTAP.
import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/src/auth/require-admin";
import { setAdminFlag } from "@/src/data/admin-api";

export type SetFlagResult = { readonly ok: true; readonly enabled: boolean } | { readonly ok: false; readonly error: string };

export async function setFlagAction(key: string, enabled: boolean): Promise<SetFlagResult> {
  const access = await checkAdminAccess();
  if (!access.ok) return { ok: false, error: "Not authorised." };

  try {
    const flag = await setAdminFlag(key, enabled);
    revalidatePath("/ops");
    return { ok: true, enabled: flag.enabled };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not update the flag." };
  }
}
