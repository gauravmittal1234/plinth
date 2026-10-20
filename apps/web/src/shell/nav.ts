// Shell links (DESIGN §0: a plain sticky bar with the wordmark, 3–5 links and
// ONE action). Labels come from the WebHome / WebMethodology artboards.
// The artboards also show "Developers"; §2.1 has no developer index route yet,
// so it is left out until one exists.

export type NavLink = { label: string; href: string };

export const PRIMARY_NAV: readonly NavLink[] = [
  { label: "Projects", href: "/search" },
  { label: "Compare", href: "/compare" },
  { label: "How scores work", href: "/methodology" },
  // The Ask box lives on Home (WebHome) until web Ask ships in M5.
  { label: "Ask Plinth", href: "/#ask" },
];

/** The one action in the public header. */
export const PRIMARY_ACTION: NavLink = { label: "Sign in", href: "/sign-in" };

/** Developer workspace header (WebDevPortal). Sign-in and the account menu arrive in M4. */
export const WORKSPACE_NAV: readonly NavLink[] = [
  { label: "Inbox", href: "/workspace/inbox" },
  { label: "Live Record", href: "/workspace/live-record" },
  { label: "Facts", href: "/workspace/facts" },
];

export const FOOTER_NAV: readonly NavLink[] = [
  { label: "How we make money", href: "/about#money" },
  { label: "How scores work", href: "/methodology" },
  { label: "Pricing", href: "/pricing" },
  { label: "Developer workspace", href: "/workspace" },
  { label: "Privacy", href: "/privacy" },
];
