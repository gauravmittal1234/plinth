// The browser Supabase client for the sign-in screen (Client Component). Email OTP
// and TOTP MFA calls (signInWithOtp, verifyOtp, auth.mfa.*) are safe to make directly
// from the browser with the publishable key — the same key that is already public
// in this app's bundle (AGENTS.md §6) — so no server action or secret is involved.
"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

let shared: SupabaseClient | null = null;

export function browserClient(): SupabaseClient {
  shared ??= (() => {
    const { url, publishableKey } = supabaseConfig();
    return createBrowserClient(url, publishableKey);
  })();
  return shared;
}
