// Supabase settings for the admin app (AGENTS.md §6, /.env.example). Only the two
// public values: the project URL and the publishable key, the same ones apps/web
// uses. The admin app never holds a key that bypasses RLS — every read and write
// goes through api.admin_* functions, gated by ops.has_role('admin') (aal2).

export type SupabaseConfig = { readonly url: string; readonly publishableKey: string };

export function supabaseConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SupabaseConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error(
      "PLINTH_DATA=supabase needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (names in /.env.example).",
    );
  }
  return { url, publishableKey };
}
