// The supabase adapter (PLINTH_DATA=supabase): api.admin_* via the operator's own
// session (sessionClient — never a service key; AGENTS.md §6 "no service key in any
// client bundle"). ops.has_role('admin') inside each function is the real gate; a
// PostgREST error becomes a plain Error here, since this app has no DataError type
// of its own (one RPC family, not the full contract layer in apps/web/src/data).
import "server-only";
import { sessionClient } from "@/src/lib/supabase/server";
import type { AdminFlag, AdminFlags, AdminOutbox, AdminSourceFreshness } from "../types";

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const supabase = await sessionClient();
  const { data, error } = await supabase.schema("api").rpc(name, args);
  if (error) throw new Error(`api.${name} failed: ${error.message} (${error.code ?? "unknown"})`);
  return data as T;
}

export const supabaseAdminOutbox = (): Promise<AdminOutbox> => rpc<AdminOutbox>("admin_outbox");

export const supabaseAdminSourceFreshness = (): Promise<AdminSourceFreshness> =>
  rpc<AdminSourceFreshness>("admin_source_freshness");

export const supabaseAdminFlags = (): Promise<AdminFlags> => rpc<AdminFlags>("admin_flags");

export const supabaseAdminFlagSet = (key: string, enabled: boolean): Promise<AdminFlag> =>
  rpc<AdminFlag>("admin_flag_set", { p_key: key, p_enabled: enabled });
