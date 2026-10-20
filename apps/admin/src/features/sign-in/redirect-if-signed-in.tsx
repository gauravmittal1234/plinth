// A visit to /sign-in while already an admin at aal2 goes straight to /ops. Reads
// cookies (through checkAdminAccess), so the page wraps this in its own <Suspense>.
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/src/auth/require-admin";

export async function RedirectIfSignedIn() {
  const access = await checkAdminAccess();
  if (access.ok) redirect("/ops");
  return null;
}
