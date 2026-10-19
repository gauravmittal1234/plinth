// Supabase settings for the web (AGENTS.md §6, /.env.example). Only the two
// public values: the project URL and the publishable key. The web never holds
// a key that bypasses RLS; every read and write goes through api.* functions.

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
