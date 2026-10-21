// A one-shot, this-browser-only signal that a project was just followed (M2
// gate gap A). The project page stays static and sessionless (AGENTS.md:
// public pages never read a per-user session), so it can't know on its own
// that a reader who just signed in from its own "Verify and follow X" button
// now follows it. sign-in-flow.tsx sets this flag right after that follow
// ran on the new session (and only then: AGENTS.md rule 9, never a fake
// "Following"), immediately before the redirect back to the project; the
// hero's FollowButton (src/features/project/sections/hero) reads and clears
// it on mount, so "Following" shows at once without a server round trip.
//
// sessionStorage is this tab's own, cleared when it closes: a stale flag
// from an abandoned flow never leaks into a later, unrelated visit, and a
// private-browsing or storage-blocked reader just sees "Follow" until their
// next real click there — the feature degrades, it never breaks.
const PREFIX = "plinth:followed:";

function flagKey(slug: string): string {
  return `${PREFIX}${slug}`;
}

/** Set right after `followProject` (src/features/auth/follow.ts) actually returned a record. */
export function markFollowed(slug: string): void {
  try {
    sessionStorage.setItem(flagKey(slug), "1");
  } catch {
    // Storage blocked: the project page just won't show "Following" until
    // the reader's next real click there.
  }
}

/** Reads and clears the flag; true only once, right after the reader lands back. */
export function consumeFollowedFlag(slug: string): boolean {
  try {
    const key = flagKey(slug);
    if (sessionStorage.getItem(key) === null) return false;
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
