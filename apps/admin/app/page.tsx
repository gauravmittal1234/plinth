import { redirect } from "next/navigation";

// /ops decides from there whether to show it, send to /sign-in, or show Forbidden.
export default function AdminHome() {
  redirect("/ops");
}
