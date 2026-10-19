// Route-group layout (T05; layouts stay T05's). Developer workspace (M4): the
// shell with the workspace header (WebDevPortal). Claim and verify arrive in M4.
import type { ReactNode } from "react";
import { SiteShell } from "@/src/shell/site-shell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <SiteShell variant="workspace">{children}</SiteShell>;
}
