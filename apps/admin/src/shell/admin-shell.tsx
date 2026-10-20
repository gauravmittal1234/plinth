// The admin chrome: wordmark, the five-item nav (this task builds /ops; the rest are
// M3-M4 placeholders) and "Signed in as … / Sign out". No glass, glow, resting
// shadows, hairline boxes or eyebrows (DESIGN §0): the header separates from the page
// by a background step, not a border.
import { Button } from "@plinth/web-ui";
import { signOutAction } from "@/src/auth/actions";
import type { AdminSession } from "@/src/auth/types";
import { ADMIN_NAV } from "./nav";

export function AdminShell({
  session,
  children,
}: {
  readonly session: AdminSession;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-slab px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-display text-h3 font-semibold">Plinth admin</span>
          <nav aria-label="Admin" className="flex flex-wrap gap-4">
            {ADMIN_NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-body font-medium">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <form action={signOutAction} className="flex items-center gap-3">
          {session.email ? <span className="text-small">Signed in as {session.email}</span> : null}
          <Button type="submit" variant="secondary" size="md">
            Sign out
          </Button>
        </form>
      </header>
      <main id="main" className="px-6 py-8">
        {children}
      </main>
    </div>
  );
}
