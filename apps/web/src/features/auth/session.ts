"use server";

// Live phone sign-in (PLINTH_DATA=supabase; M2 gate gap 2). Supabase Auth's
// phone OTP through the server-side client (src/lib/supabase/server.ts), so the
// session lands in this request's cookies (@supabase/ssr) and the browser
// never holds a key beyond the publishable one. Delivery is Auth's business:
// the Send-SMS hook on deployed projects (auth-sms-hook: WhatsApp first, then
// SMS), the fixed [auth.sms.test_otp] codes on a local or CI stack. The app
// asks the same way (apps/mobile/lib/data/auth.dart), with no channel.
//
// Fixture mode never calls Supabase Auth (AGENTS.md "Fixture mode uses fake
// sessions…"): sign-in-flow.tsx doesn't call these there, and they refuse.
// Each answer is only what Auth returned; `signedIn` is true only when Auth
// handed back a session, whose cookies are then set (AGENTS.md rule 9).
import { dataMode } from "@/src/data/mode";
import { sessionClient } from "@/src/lib/supabase/server";

export type SendCodeResult = { readonly sent: boolean };
export type VerifyCodeResult = { readonly signedIn: boolean };

// Untrusted input from the browser: an E.164 number and a 6-digit code.
const E164 = /^\+[1-9]\d{6,14}$/;
const CODE = /^\d{6}$/;

function failure(step: string, error: unknown): void {
  // Never the number or the code: only what kind of failure it was.
  const e = error as { status?: unknown; code?: unknown; name?: unknown } | null;
  console.warn(`sign-in: ${step} failed`, {
    status: typeof e?.status === "number" ? e.status : null,
    code: typeof e?.code === "string" ? e.code : null,
    name: typeof e?.name === "string" ? e.name : null,
  });
}

/** Asks Supabase Auth to send a sign-in code to the number. */
export async function sendSignInCode(phoneE164: string): Promise<SendCodeResult> {
  if (dataMode() !== "supabase" || typeof phoneE164 !== "string" || !E164.test(phoneE164)) {
    return { sent: false };
  }
  try {
    const supabase = await sessionClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: phoneE164 });
    if (error) {
      failure("send code", error);
      return { sent: false };
    }
    return { sent: true };
  } catch (e) {
    failure("send code", e);
    return { sent: false };
  }
}

/** Checks the code with Supabase Auth; on success its session cookies are set. */
export async function verifySignInCode(phoneE164: string, code: string): Promise<VerifyCodeResult> {
  if (
    dataMode() !== "supabase" ||
    typeof phoneE164 !== "string" ||
    typeof code !== "string" ||
    !E164.test(phoneE164) ||
    !CODE.test(code)
  ) {
    return { signedIn: false };
  }
  try {
    const supabase = await sessionClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phoneE164,
      token: code,
      type: "sms",
    });
    if (error || !data.session?.access_token || !data.user) {
      failure("verify code", error);
      return { signedIn: false };
    }
    return { signedIn: true };
  } catch (e) {
    failure("verify code", e);
    return { signedIn: false };
  }
}
