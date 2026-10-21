"use server";

// Follows a project on the signed-in buyer's own session (M2 gate gap A: the
// web never called api.follow). Through sessionClient(), the same
// @supabase/ssr cookie session session.ts uses, via src/data's existing
// follow() (audience "buyer": src/data/adapters/supabase.ts already picks
// sessionClient() for it) — this file only gives it a "use server" boundary
// two callers reach from the client:
//   - sign-in-flow.tsx, once on the reader's brand-new session, right after
//     "Verify and follow X" signs them in (before the redirect back);
//   - the project page's FollowButton (src/features/project/sections/hero),
//     when an already-signed-in reader clicks Follow directly.
// Both keep AGENTS.md rule 9 ("no confirmation without a record"): a caller
// only shows "Following" once this returns `outcome: "followed"`, with a
// real follow row behind it; on `"error"` it shows its own existing copy
// (COPY.followFailed / HERO_COPY.followFailed — word for word the app's
// OnboardingCopy.followFailed and project_content.dart's follow-failure
// toast), never a fake success.
//
// Fixture mode never calls this (AGENTS.md "Fixture mode uses fake
// sessions…"): both callers only reach it behind their own `live` check, so
// fixture mode's Follow button and sign-in flow stay exactly as today.
import { dataMode, follow, isDataError, type Follow, type Slug } from "@/src/data";

export type FollowResult =
  | { readonly outcome: "followed"; readonly follow: Follow }
  | { readonly outcome: "auth_required" }
  | { readonly outcome: "error" };

function failure(error: unknown): void {
  // Never the slug or any buyer detail: only what kind of failure it was
  // (session.ts's own pattern).
  const e = error as { status?: unknown; code?: unknown; name?: unknown } | null;
  console.warn("follow: failed", {
    status: typeof e?.status === "number" ? e.status : null,
    code: typeof e?.code === "string" ? e.code : null,
    name: typeof e?.name === "string" ? e.name : null,
  });
}

/**
 * Follows `slug` as "watching" (the plain follow both callers offer; a
 * booked buyer changes their own type from Following,
 * src/features/following/actions.ts's setFollowTypeAction). `clientId`
 * makes a retry idempotent (API_CONTRACTS §1): callers pass a fresh
 * `crypto.randomUUID()` per click/verify, never a reused one.
 */
export async function followProject(slug: Slug, clientId: string): Promise<FollowResult> {
  if (dataMode() !== "supabase") return { outcome: "error" };
  try {
    const record = await follow(slug, "watching", "web", clientId);
    return { outcome: "followed", follow: record };
  } catch (e) {
    if (isDataError(e, "auth_required")) return { outcome: "auth_required" };
    failure(e);
    return { outcome: "error" };
  }
}
