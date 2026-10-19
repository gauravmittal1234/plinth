import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader, type ShellVariant } from "./site-header";

/**
 * Header, the page's <main> landmark and the footer slab. The route-group
 * layouts wrap every page in it; pages render their sections only.
 */
export function SiteShell({
  children,
  variant = "public",
}: {
  children: ReactNode;
  variant?: ShellVariant;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-30 rounded-pill bg-inverse px-5 py-3 font-semibold text-on-inverse focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader variant={variant} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
