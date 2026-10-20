"use server";
// Sign-out is a Server Action so it can clear the session cookies (the publishable
// key alone can't do that reliably from a Client Component navigation). Fixture mode
// has no session to clear; it just sends the operator back to /sign-in.
import { redirect } from "next/navigation";
import { dataMode } from "@/src/data/mode";
import { sessionClient } from "@/src/lib/supabase/server";

export async function signOutAction(): Promise<void> {
  if (dataMode() === "supabase") {
    const supabase = await sessionClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
