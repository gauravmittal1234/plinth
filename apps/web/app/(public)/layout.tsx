// Route-group layout (T05; layouts stay T05's). Public pages: the site shell.
import type { ReactNode } from "react";
import { SiteShell } from "@/src/shell/site-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
