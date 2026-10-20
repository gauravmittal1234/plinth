// The one place WebFollowing reads data ("clients call only api.* RPCs",
// AGENTS.md §7; "Data comes only from @/src/data"). `following_feed` has one
// fixture key (rohan: the only buyer fixture mode can be signed in as), so a
// miss here means fixture mode genuinely has nothing to show, not a bug —
// the page names the gap instead of crashing (compare's `load-compare.ts`
// pattern).
//
// `alert_prefs_get` also has a fixture; `family_circle` and a read for saved
// searches do not exist yet (no packages/fixtures/expected folder, no
// contract schema either) — api.me/api.family_circle are still `Untyped`
// placeholders in src/data (M2 wiring lands with T43b/T45a). This page never
// calls either, so it never throws on their behalf; the family and saved
// searches sections below are built from what following_feed already
// carries (family_line per project) plus static layout copy, with the gap
// named in the PR's Handoff note rather than invented data.
import "server-only";
import { alertPrefsGet, flags, followingFeed, isDataError, type AlertPrefs, type FollowingFeed } from "@/src/data";

export type FollowingLoad =
  | {
      ok: true;
      feed: FollowingFeed;
      alertPrefs: AlertPrefs | null;
      sliderOn: boolean;
    }
  | { ok: false; message: string };

const NOT_YET =
  "Your Following page isn't available in fixture mode yet. In the live product this shows what changed on your followed projects.";

export async function loadFollowing(): Promise<FollowingLoad> {
  let feed: FollowingFeed;
  let sliderOn = false;
  try {
    const [feedResult, flagsResult] = await Promise.all([followingFeed(), flags()]);
    feed = feedResult;
    sliderOn = flagsResult.flags.since_replay_slider === true;
  } catch (e) {
    if (isDataError(e, "fixture_missing") || isDataError(e, "not_found")) {
      return { ok: false, message: NOT_YET };
    }
    throw e;
  }

  let alertPrefs: AlertPrefs | null = null;
  try {
    alertPrefs = await alertPrefsGet();
  } catch (e) {
    if (!isDataError(e, "fixture_missing")) throw e;
  }

  return { ok: true, feed, alertPrefs, sliderOn };
}
