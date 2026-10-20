import type { Metadata } from "next";
import { Suspense } from "react";
import { RedirectIfSignedIn } from "@/src/features/sign-in/redirect-if-signed-in";
import { SignInForm } from "@/src/features/sign-in/sign-in-form";

export const metadata: Metadata = { title: "Sign in · Plinth admin" };

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <h1 className="text-h2 font-display font-semibold">Plinth admin</h1>
      <p className="text-small">Email code, then your authenticator app (TOTP).</p>
      <SignInForm />
    </main>
  );
}
