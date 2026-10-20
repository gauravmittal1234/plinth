// _shared/wa/templates/daily_digest: the 8 am daily round-up (WaDigest; API_CONTRACTS §5.2).
// No header; date / change count, catalogue order. "See changes" / "Stop daily" are router.ts's
// digest.see_changes and prefs.stop(stop_daily) reply ids.

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, quickReplyButton, templateMessage } from "./shared.ts";

export const DAILY_DIGEST: TemplateMirror = {
  code: "daily_digest",
  metaName: "daily_digest",
  category: "UTILITY",
  language: "en",
  variables: ["date", "change_count"],
  buttons: [
    { type: "quick_reply", text: "See changes" },
    { type: "quick_reply", text: "Stop daily" },
  ],
};

/** The quick replies' payloads, in button order: router.ts's own reply ids. outbox-dispatch
 * gives a session alert the same ids, so a tap routes the same way inside the 24-hour window. */
export const DAILY_DIGEST_REPLY_IDS = ["see_changes", "stop_daily"] as const;

export interface DailyDigestVars {
  date: string;
  changeCount: string;
}

export function renderDailyDigest(vars: DailyDigestVars) {
  return templateMessage(DAILY_DIGEST, [
    bodyComponent(vars.date, vars.changeCount),
    quickReplyButton(0, DAILY_DIGEST_REPLY_IDS[0]),
    quickReplyButton(1, DAILY_DIGEST_REPLY_IDS[1]),
  ]);
}
