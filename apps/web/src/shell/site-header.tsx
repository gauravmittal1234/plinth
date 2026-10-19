import Link from "next/link";
import { PlinthMark } from "./icons";
import { PRIMARY_ACTION, PRIMARY_NAV, WORKSPACE_NAV, type NavLink } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export type ShellVariant = "public" | "workspace";

/** Wordmark: the mark plus "Plinth" in Bricolage 800 (DESIGN §4.1). */
export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 py-1 text-ink no-underline">
      <PlinthMark />
      <span className="font-display text-[1.4375rem] font-extrabold tracking-[-0.02em]">
        Plinth
      </span>
    </Link>
  );
}

function NavLinks({ label, links }: { label: string; links: readonly NavLink[] }) {
  return (
    <nav
      aria-label={label}
      className="order-last w-full overflow-x-auto md:order-none md:ml-auto md:w-auto md:overflow-visible"
    >
      <ul className="m-0 flex list-none gap-x-6 p-0 whitespace-nowrap">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-block py-2 text-[1.0625rem] font-medium text-ink no-underline hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The plain top bar (DESIGN §0): wordmark, 3–5 links, the Night toggle and ONE
 * action. No glass, no blur, no shadow: a flat `bg` band. Sticky from tablet
 * width up; on a phone the links sit in one scrollable row under the wordmark
 * and the bar scrolls away, leaving the screen to the page.
 */
export function SiteHeader({ variant = "public" }: { variant?: ShellVariant }) {
  const workspace = variant === "workspace";
  return (
    <header className="z-20 bg-bg md:sticky md:top-0">
      <div className="mx-auto flex w-full max-w-[79rem] flex-wrap items-center gap-x-7 gap-y-1 px-4 py-3 sm:px-8 md:min-h-18">
        <Wordmark href={workspace ? "/workspace" : "/"} />
        {workspace ? <span className="text-[1.0625rem] text-ink2">Workspace</span> : null}
        <NavLinks
          label={workspace ? "Workspace" : "Primary"}
          links={workspace ? WORKSPACE_NAV : PRIMARY_NAV}
        />
        <div className="ml-auto flex items-center gap-2.5 md:order-last md:ml-0">
          <ThemeToggle />
          {workspace ? null : (
            <Link
              href={PRIMARY_ACTION.href}
              className="inline-flex h-11 items-center rounded-pill bg-inverse px-5 text-[1.0625rem] font-semibold whitespace-nowrap text-on-inverse no-underline transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {PRIMARY_ACTION.label}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
