// Route-group layout (T05; layouts stay T05's). Signed-in buyer pages
// (Following, Privacy): the site shell. The session check arrives with T47.
import type { ReactNode } from "react";
import { SiteShell } from "@/src/shell/site-shell";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
