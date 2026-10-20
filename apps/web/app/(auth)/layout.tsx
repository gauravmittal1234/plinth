// Route-group layout (T05; layouts stay T05's). Sign-in: the site shell, as in
// the WebSignIn artboard.
import type { ReactNode } from "react";
import { SiteShell } from "@/src/shell/site-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
