// Deny by default, in the UI as well as the database: every /(admin) route renders
// through here. Reads the session (cookies), so this must sit inside a <Suspense>
// boundary (the layout does that) — see src/auth/session.ts.
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { checkAdminAccess } from "@/src/auth/require-admin";
import { AdminShell } from "./admin-shell";
import { Forbidden } from "./forbidden";

export async function AdminGate({ children }: { readonly children: ReactNode }) {
  const access = await checkAdminAccess();
  if (!access.ok && access.reason === "signed_out") redirect("/sign-in");
  if (!access.ok) return <Forbidden session={access.session} />;
  return <AdminShell session={access.session}>{children}</AdminShell>;
}
