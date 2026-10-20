// WebDeveloper's fixture previews: `?state=<state>` (e.g. `facts_only`).
// next.config.ts rewrites that query URL to the internal segment route
// app/(public)/gurugram/developers/[slug]/~preview/state/[state], so the
// canonical page never reads `searchParams` and stays prerendered (a
// page-wide Suspense around `searchParams` left its static shell empty).
// The public URL doesn't change.
import "server-only";
import requests from "@plinth/fixtures/expected/developer_page/_requests.json";
import type { Metadata } from "next";
import type { DeveloperData } from "./load-developer";

/**
 * The design states a developer page previews. next.config.ts's `?state=`
 * rewrite matches exactly these; keep the two in step.
 */
export const DEVELOPER_PREVIEW_STATES = ["facts_only"] as const;

export function isDeveloperPreviewState(value: string): boolean {
  return (DEVELOPER_PREVIEW_STATES as readonly string[]).includes(value);
}

/**
 * The (slug, state) pairs that carry their own design-state fixture
 * (packages/fixtures/expected/developer_page/_requests.json): prerendered at
 * build. Any other pair renders on its first request.
 */
export function statePreviewParams(): { slug: string; state: string }[] {
  return Object.values(requests.requests).flatMap((req) =>
    "state" in req && isDeveloperPreviewState(req.state)
      ? [{ slug: req.p_slug, state: req.state }]
      : [],
  );
}

/** The page's metadata; a preview is noindex (its canonical stays the live page). */
export function developerMetadata({ page }: DeveloperData, { preview = false } = {}): Metadata {
  return {
    title: page.group.name,
    description: page.summary_line ?? undefined,
    alternates: { canonical: page.meta.live_url },
    ...(preview ? { robots: { index: false } } : {}),
  };
}
