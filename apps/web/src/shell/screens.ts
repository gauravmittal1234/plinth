// WORK_BREAKDOWN §2.1 as data: every web screen, its routes, its stub file and
// the task that replaces the stub. The Placeholder, the route smoke test
// (e2e/smoke.spec.ts) and the manifest test (test/screens.test.ts) all read
// this list, so a row added to §2.1 is one entry here plus one stub page.
//
// Owner: T05 (src/shell stays T05's). Each route folder passes to the task named
// in `task` (OWNERSHIP.md), which replaces the stub page with the real one. The
// tests only hold a page to its artboard name while it is still a stub, so a
// task replacing a stub doesn't need to edit this file.

export type Milestone = "M1" | "M2" | "M3" | "M4" | "M5";

export type ScreenRoute = {
  /** The route as written in §2.1, e.g. "/gurugram/projects/[slug]". */
  pattern: string;
  /** A concrete URL the smoke test opens (fixture slugs from DESIGN §5b). */
  sample: string;
  /** The stub page, relative to apps/web. */
  file: string;
};

export type Screen = {
  /** The artboard name, or a plain name for rows without one. Shown as the page's h1. */
  name: string;
  /** The artboard file in product/design/artboards, or null when §2.1 has none. */
  artboard: string | null;
  routes: ScreenRoute[];
  /** The task that builds the page; null for M3+ rows (assigned at that milestone's kickoff). */
  task: string | null;
  milestone: Milestone;
  /** Other §2.1 rows served by the same route (e.g. WebProjectStates via ?state=). */
  variants?: { name: string; task: string; note: string; sample: string }[];
};

const r = (pattern: string, sample: string, file: string): ScreenRoute => ({
  pattern,
  sample,
  file,
});

export const SCREENS = [
  {
    name: "WebHome",
    artboard: "WebHome.dc.html",
    routes: [r("/", "/", "app/(public)/page.tsx")],
    task: "T21",
    milestone: "M1",
  },
  {
    name: "WebSearch",
    artboard: "WebSearch.dc.html",
    routes: [r("/search", "/search", "app/(public)/search/page.tsx")],
    task: "T22",
    milestone: "M1",
  },
  {
    name: "WebProject",
    artboard: "WebProject.dc.html",
    routes: [
      r(
        "/gurugram/projects/[slug]",
        "/gurugram/projects/aurelia-heights-phase-2",
        "app/(public)/gurugram/projects/[slug]/page.tsx",
      ),
    ],
    task: "T20a, T20b",
    milestone: "M1",
    variants: [
      {
        name: "WebProjectStates",
        task: "T20c",
        note: "Severe, Stalled, Limited history, Not scored, Stale, Re-scoring and Facts-only preview with ?state=",
        sample: "/gurugram/projects/laurel-residency?state=severe",
      },
    ],
  },
  {
    name: "WebDeveloper",
    artboard: "WebDeveloper.dc.html",
    routes: [
      r(
        "/gurugram/developers/[slug]",
        "/gurugram/developers/northfield-estates",
        "app/(public)/gurugram/developers/[slug]/page.tsx",
      ),
    ],
    task: "T23",
    milestone: "M1",
  },
  {
    name: "WebCompare",
    artboard: "WebCompare.dc.html",
    routes: [
      r(
        "/compare?p=a,b,c",
        "/compare?p=aurelia-heights-phase-2,kestrel-park,sapphire-grove-phase-1",
        "app/(public)/compare/page.tsx",
      ),
      r(
        "/compare/[a]-vs-[b]",
        "/compare/aurelia-heights-phase-2-vs-kestrel-park",
        "app/(public)/compare/[pair]/page.tsx",
      ),
    ],
    task: "T24",
    milestone: "M1",
  },
  {
    name: "WebMethodology",
    artboard: "WebMethodology.dc.html",
    routes: [r("/methodology", "/methodology", "app/(public)/methodology/page.tsx")],
    task: "T25",
    milestone: "M1",
  },
  {
    name: "WebAbout",
    artboard: "WebAbout.dc.html",
    routes: [r("/about", "/about", "app/(public)/about/page.tsx")],
    task: "T25",
    milestone: "M1",
  },
  {
    name: "WebPricing",
    artboard: "WebPricing.dc.html",
    routes: [r("/pricing", "/pricing", "app/(public)/pricing/page.tsx")],
    task: "T26",
    milestone: "M1",
  },
  {
    name: "Share cards",
    artboard: null,
    routes: [
      r("/cards/*", "/cards/risk/aurelia-heights-phase-2.png", "app/cards/[...card]/page.tsx"),
      r("/c/[code]", "/c/AH2", "app/c/[code]/page.tsx"),
    ],
    task: "T27",
    milestone: "M1",
  },
  {
    name: "WebSignIn",
    artboard: "WebSignIn.dc.html",
    routes: [r("/sign-in?next=", "/sign-in?next=/following", "app/(auth)/sign-in/page.tsx")],
    task: "T47",
    milestone: "M2",
  },
  {
    name: "WebFollowing",
    artboard: "WebFollowing.dc.html",
    routes: [r("/following", "/following", "app/(account)/following/page.tsx")],
    task: "T49",
    milestone: "M2",
  },
  {
    name: "WebPrivacy",
    artboard: "WebPrivacy.dc.html",
    routes: [r("/privacy", "/privacy", "app/(account)/privacy/page.tsx")],
    task: "T51",
    milestone: "M2",
  },
  {
    name: "Family opt-in",
    artboard: null,
    routes: [r("/j/[code]", "/j/AH2-7KQ", "app/j/[code]/page.tsx")],
    task: "T52",
    milestone: "M2",
  },
  {
    name: "WebCostSheet",
    artboard: "WebCostSheet.dc.html",
    routes: [r("/check/cost-sheet", "/check/cost-sheet", "app/(public)/check/cost-sheet/page.tsx")],
    task: null,
    milestone: "M3",
  },
  {
    name: "WebClaims",
    artboard: "WebClaims.dc.html",
    routes: [
      r("/check/claims", "/check/claims", "app/(public)/check/claims/page.tsx"),
      r("/check/claims/[id]", "/check/claims/sample", "app/(public)/check/claims/[id]/page.tsx"),
    ],
    task: null,
    milestone: "M3",
  },
  {
    name: "WebBeforePay",
    artboard: "WebBeforePay.dc.html",
    routes: [
      r(
        "/check/before-you-pay",
        "/check/before-you-pay",
        "app/(public)/check/before-you-pay/page.tsx",
      ),
    ],
    task: null,
    milestone: "M3",
  },
  {
    name: "WebPayAsBuilt",
    artboard: "WebPayAsBuilt.dc.html",
    routes: [
      r("/check/pay-as-built", "/check/pay-as-built", "app/(public)/check/pay-as-built/page.tsx"),
    ],
    task: null,
    milestone: "M3",
  },
  {
    name: "WebDevOnboarding",
    artboard: "WebDevOnboarding.dc.html",
    routes: [r("/workspace/claim", "/workspace/claim", "app/(workspace)/workspace/claim/page.tsx")],
    task: null,
    milestone: "M4",
  },
  {
    name: "WebDevPortal",
    artboard: "WebDevPortal.dc.html",
    routes: [r("/workspace", "/workspace", "app/(workspace)/workspace/page.tsx")],
    task: null,
    milestone: "M4",
  },
  {
    name: "WebDevInbox",
    artboard: "WebDevInbox.dc.html",
    routes: [r("/workspace/inbox", "/workspace/inbox", "app/(workspace)/workspace/inbox/page.tsx")],
    task: null,
    milestone: "M4",
  },
  {
    name: "WebDevLiveRecord",
    artboard: "WebDevLiveRecord.dc.html",
    routes: [
      r(
        "/workspace/live-record",
        "/workspace/live-record",
        "app/(workspace)/workspace/live-record/page.tsx",
      ),
      r("/r/[code]", "/r/AH2", "app/r/[code]/page.tsx"),
    ],
    task: null,
    milestone: "M4",
  },
  {
    name: "WebDevFacts",
    artboard: "WebDevFacts.dc.html",
    routes: [
      r(
        "/workspace/facts?tab=",
        "/workspace/facts?tab=prices",
        "app/(workspace)/workspace/facts/page.tsx",
      ),
    ],
    task: null,
    milestone: "M4",
  },
  {
    name: "AppDevCapture",
    artboard: "AppDevCapture.dc.html",
    routes: [r("/capture/[token]", "/capture/sample-token", "app/capture/[token]/page.tsx")],
    task: null,
    milestone: "M4",
  },
  {
    name: "WebVisualise",
    artboard: "WebVisualise.dc.html",
    routes: [r("/visualise", "/visualise", "app/(public)/visualise/page.tsx")],
    task: null,
    milestone: "M5",
  },
  {
    name: "WebForAgents",
    artboard: "WebForAgents.dc.html",
    routes: [r("/agents", "/agents", "app/(public)/agents/page.tsx")],
    task: null,
    milestone: "M5",
  },
  {
    name: "WebAgentProfile",
    artboard: "WebAgentProfile.dc.html",
    routes: [
      r("/agents/[slug]", "/agents/larkspur-realty", "app/(public)/agents/[slug]/page.tsx"),
      r(
        "/agents/[slug]/briefs",
        "/agents/larkspur-realty/briefs",
        "app/(public)/agents/[slug]/briefs/page.tsx",
      ),
    ],
    task: null,
    milestone: "M5",
  },
  {
    name: "WebBrokerCheck",
    artboard: "WebBrokerCheck.dc.html",
    routes: [r("/check/broker", "/check/broker", "app/(public)/check/broker/page.tsx")],
    task: null,
    milestone: "M5",
  },
] as const satisfies readonly Screen[];

export type ScreenName = (typeof SCREENS)[number]["name"];

export function screenByName(name: ScreenName): Screen {
  const s = SCREENS.find((x) => x.name === name);
  if (!s) throw new Error(`Unknown screen ${name}`);
  return s;
}

/**
 * True when the route's stub sits in a route group, so the group layout wraps it
 * in the site shell. Top-level folders (cards, c, j, r, capture) render bare;
 * their owners pick their own chrome.
 */
export function hasShell(route: ScreenRoute): boolean {
  return route.file.startsWith("app/(");
}
