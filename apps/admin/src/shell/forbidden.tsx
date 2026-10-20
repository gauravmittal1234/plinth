// Shown to a signed-in operator who lacks the admin role or hasn't done TOTP yet
// (deny by default: this renders instead of the page, never alongside it). Mirrors
// the pgTAP-proven server rule in supabase/migrations/20261126000100_t54_admin_ops_
// rpcs.sql ("every admin RPC returns forbidden" below aal2) in the UI.
import { Button } from "@plinth/web-ui";
import { signOutAction } from "@/src/auth/actions";
import type { AdminSession } from "@/src/auth/types";

export function Forbidden({ session }: { readonly session: AdminSession }) {
  const needsTotp = session.roles.includes("admin") && session.aal !== "aal2";
  return (
    <div className="mx-auto max-w-prose py-16 text-center">
      <h1 className="text-h2 font-display font-semibold">
        {needsTotp ? "Finish signing in" : "Not an admin account"}
      </h1>
      <p className="mt-4 text-body">
        {needsTotp
          ? "This account has the admin role, but this session hasn't completed the authenticator (TOTP) step. Sign in again to finish it."
          : `${session.email ?? "This account"} does not have the admin role on Plinth. Ask the founder to add it, or sign in with an admin account.`}
      </p>
      <form action={signOutAction} className="mt-6 inline-block">
        <Button type="submit" variant="primary" size="md">
          Sign out
        </Button>
      </form>
    </div>
  );
}
