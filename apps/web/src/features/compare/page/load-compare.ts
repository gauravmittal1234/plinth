// The one place WebCompare reads data ("import data only from @/src/data",
// INTEGRATION_NOTES). `compare()` only has two fixture keys today (the
// default trio and +Coral): any other 2-4 slug list is a legitimate request
// the fixture world just can't answer yet ("T22/T24: a query without a
// fixture key gives fixture_missing; new keys come from the fixtures owner",
// INTEGRATION_NOTES). That is expected, not a bug, so this never throws past
// itself: the screen always renders, with the gap named instead of a crash.
import "server-only";
import { compare, flags, isDataError, type Compare, type Slug } from "@/src/data";

export type CompareLoad =
  | { ok: true; slugs: readonly Slug[]; data: Compare; aiAskOn: boolean }
  | { ok: false; slugs: readonly Slug[]; message: string };

const NOT_YET =
  "This exact comparison isn't in our records yet. Try the default projects, or remove one and compare again.";

export async function loadCompare(slugs: readonly Slug[]): Promise<CompareLoad> {
  try {
    const [data, f] = await Promise.all([compare([...slugs]), flags()]);
    return { ok: true, slugs, data, aiAskOn: f.flags.ai_ask === true };
  } catch (e) {
    if (isDataError(e, "fixture_missing") || isDataError(e, "not_found")) {
      return { ok: false, slugs, message: NOT_YET };
    }
    throw e;
  }
}
