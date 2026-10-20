"use client";
// Email OTP + TOTP MFA (this task's brief). Every call here uses the publishable key
// only (AGENTS.md §6) — signInWithOtp, verifyOtp and auth.mfa.* are the Supabase Auth
// calls meant to run in the browser. shouldCreateUser: false, because an admin
// account is provisioned by the founder (app.user_roles, T40), never created from
// this form (deny by default: there is no sign-up path here).
//
// States: email -> otp -> (totp_enroll | totp_verify) -> redirect to /ops, or denied
// (signed in, but not plinth_roles ∋ admin: the account is real, just not staff).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@plinth/web-ui";
import { browserClient } from "@/src/lib/supabase/browser";

type Step =
  | { readonly kind: "email" }
  | { readonly kind: "otp"; readonly email: string }
  | { readonly kind: "totp_enroll"; readonly factorId: string; readonly qrCode: string; readonly secret: string }
  | { readonly kind: "totp_verify"; readonly factorId: string }
  | { readonly kind: "denied"; readonly message: string };

export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Decides from already-fetched claims: both the admin role and aal2, or denied. */
  async function finalizeFromClaims(claims: { aal?: string; plinth_roles?: unknown } | undefined) {
    const roles = Array.isArray(claims?.plinth_roles)
      ? (claims.plinth_roles as unknown[]).filter((r): r is string => typeof r === "string")
      : [];
    if (claims?.aal !== "aal2" || !roles.includes("admin")) {
      await browserClient().auth.signOut();
      setStep({
        kind: "denied",
        message:
          claims?.aal !== "aal2"
            ? "The authenticator step didn't complete. Try signing in again."
            : "This account doesn't have the admin role on Plinth.",
      });
      return;
    }
    router.push("/ops");
    router.refresh();
  }

  /** After mfa.verify() just elevated the session: re-read the claims, since the
   * local session changed, then decide. */
  async function afterVerified() {
    const supabase = browserClient();
    const { data, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !data) {
      setStep({ kind: "denied", message: "Could not confirm your session. Try signing in again." });
      return;
    }
    await finalizeFromClaims(data.claims);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const supabase = browserClient();
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setPending(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setStep({ kind: "otp", email });
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "otp") return;
    setPending(true);
    setError(null);
    const supabase = browserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: step.email,
      token: code,
      type: "email",
    });
    if (verifyError) {
      setPending(false);
      setError(verifyError.message);
      return;
    }
    setCode("");

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claimsData) {
      setPending(false);
      setError(claimsError?.message ?? "Could not read your session.");
      return;
    }
    if (claimsData.claims.aal === "aal2") {
      setPending(false);
      await finalizeFromClaims(claimsData.claims);
      return;
    }

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    setPending(false);
    if (factorsError) {
      setError(factorsError.message);
      return;
    }
    const verifiedTotp = factorsData?.totp.find((f) => f.status === "verified");
    if (verifiedTotp) {
      await startChallenge(verifiedTotp.id);
      return;
    }
    await startEnrollment();
  }

  async function startChallenge(factorId: string) {
    setPending(true);
    setError(null);
    const supabase = browserClient();
    const { error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    setPending(false);
    if (challengeError) {
      setError(challengeError.message);
      return;
    }
    setStep({ kind: "totp_verify", factorId });
  }

  async function startEnrollment() {
    setPending(true);
    setError(null);
    const supabase = browserClient();
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Plinth admin",
    });
    setPending(false);
    if (enrollError) {
      setError(enrollError.message);
      return;
    }
    setStep({
      kind: "totp_enroll",
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "totp_enroll" && step.kind !== "totp_verify") return;
    setPending(true);
    setError(null);
    const supabase = browserClient();

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: step.factorId,
    });
    if (challengeError || !challenge) {
      setPending(false);
      setError(challengeError?.message ?? "Could not start the authenticator check.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: step.factorId,
      challengeId: challenge.id,
      code,
    });
    setPending(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setCode("");
    await afterVerified();
  }

  if (step.kind === "denied") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body" role="alert">
          {step.message}
        </p>
        <Button type="button" variant="secondary" onClick={() => setStep({ kind: "email" })}>
          Try again
        </Button>
      </div>
    );
  }

  if (step.kind === "email") {
    return (
      <form onSubmit={submitEmail} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-small">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 bg-slab px-3 text-body"
          />
        </label>
        {error ? <p className="text-small" role="alert">{error}</p> : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Sending…" : "Send a code"}
        </Button>
      </form>
    );
  }

  if (step.kind === "otp") {
    return (
      <form onSubmit={submitOtp} className="flex flex-col gap-4">
        <p className="text-small">We sent a code to {step.email}.</p>
        <label className="flex flex-col gap-1">
          <span className="text-small">6-digit code</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-11 bg-slab px-3 text-body"
          />
        </label>
        {error ? <p className="text-small" role="alert">{error}</p> : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Checking…" : "Continue"}
        </Button>
      </form>
    );
  }

  if (step.kind === "totp_enroll") {
    return (
      <form onSubmit={submitTotp} className="flex flex-col gap-4">
        <p className="text-small">
          Scan this with your authenticator app, or enter the code by hand: {step.secret}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- an inline data: SVG from Supabase, not an optimizable asset */}
        <img src={step.qrCode} alt="Authenticator QR code" width={200} height={200} />
        <label className="flex flex-col gap-1">
          <span className="text-small">Code from your authenticator app</span>
          <input
            inputMode="numeric"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-11 bg-slab px-3 text-body"
          />
        </label>
        {error ? <p className="text-small" role="alert">{error}</p> : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Checking…" : "Finish setting up"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitTotp} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-small">Code from your authenticator app</span>
        <input
          inputMode="numeric"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-11 bg-slab px-3 text-body"
        />
      </label>
      {error ? <p className="text-small" role="alert">{error}</p> : null}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
