// One call per api.admin_* RPC, picking the fixture or Supabase adapter by
// PLINTH_DATA (AGENTS.md "Fixture mode"; apps/web's src/data/invoke.ts pattern,
// scoped down to this app's four RPCs). Server-only: every caller is a Server
// Component or Server Action inside the (admin) route group.
import "server-only";
import { dataMode } from "./mode";
import type { AdminFlag, AdminFlags, AdminOutbox, AdminSourceFreshness } from "./types";

export async function getAdminOutbox(): Promise<AdminOutbox> {
  if (dataMode() === "fixtures") {
    const { fixtureAdminOutbox } = await import("./adapters/fixtures");
    return fixtureAdminOutbox();
  }
  const { supabaseAdminOutbox } = await import("./adapters/supabase");
  return supabaseAdminOutbox();
}

export async function getAdminSourceFreshness(): Promise<AdminSourceFreshness> {
  if (dataMode() === "fixtures") {
    const { fixtureAdminSourceFreshness } = await import("./adapters/fixtures");
    return fixtureAdminSourceFreshness();
  }
  const { supabaseAdminSourceFreshness } = await import("./adapters/supabase");
  return supabaseAdminSourceFreshness();
}

export async function getAdminFlags(): Promise<AdminFlags> {
  if (dataMode() === "fixtures") {
    const { fixtureAdminFlags } = await import("./adapters/fixtures");
    return fixtureAdminFlags();
  }
  const { supabaseAdminFlags } = await import("./adapters/supabase");
  return supabaseAdminFlags();
}

export async function setAdminFlag(key: string, enabled: boolean): Promise<AdminFlag> {
  if (dataMode() === "fixtures") {
    const { fixtureAdminFlagSet } = await import("./adapters/fixtures");
    return fixtureAdminFlagSet(key, enabled);
  }
  const { supabaseAdminFlagSet } = await import("./adapters/supabase");
  return supabaseAdminFlagSet(key, enabled);
}
