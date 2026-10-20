// WebProject's fixture previews (T20c): `?state=<state>` (WebProjectStates)
// and `?view=simple` (T20b's SimpleView). next.config.ts rewrites those query
// URLs to internal segment routes under app/(public)/gurugram/projects/[slug]/
// ~preview/, so the canonical page never reads `searchParams` and stays
// prerendered (a page-wide Suspense around `searchParams` left the static
// shell empty: Lighthouse CLS 0.61 on PR #46). The public URLs don't change.
import "server-only";
import requests from "@plinth/fixtures/expected/project_page/_requests.json";
import type { Metadata } from "next";
import type { ProjectData } from "./load-project";

/**
 * WebProjectStates' preview names (src/shell/screens.ts's variant note).
 * next.config.ts's `?state=` rewrite matches exactly these; keep the two in
 * step. Only `facts_only` loads a different payload (load-project.ts's
 * FIXTURE_STATE_REMAPS); the other six are each already the default fixture
 * of their own phase slug.
 */
export const PROJECT_PREVIEW_STATES = [
  "severe",
  "stalled",
  "limited_history",
  "not_scored",
  "stale",
  "rescoring",
  "facts_only",
] as const;

export function isProjectPreviewState(value: string): boolean {
  return (PROJECT_PREVIEW_STATES as readonly string[]).includes(value);
}

/**
 * The (slug, state) pairs that carry their own design-state fixture
 * (packages/fixtures/expected/project_page/_requests.json): prerendered at
 * build. Any other pair renders on its first request.
 */
export function statePreviewParams(): { slug: string; state: string }[] {
  return Object.values(requests.requests).flatMap((req) =>
    "state" in req && isProjectPreviewState(req.state) ? [{ slug: req.p_slug, state: req.state }] : [],
  );
}

/** The page's metadata; a preview is noindex (its canonical stays the live page). */
export function projectMetadata({ page }: ProjectData, { preview = false } = {}): Metadata {
  return {
    title: page.risk.phase.name,
    description: page.hero.summary_line,
    alternates: { canonical: page.risk.meta.live_url },
    ...(preview ? { robots: { index: false } } : {}),
  };
}
