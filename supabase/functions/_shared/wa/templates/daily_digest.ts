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

export interface DailyDigestVars {
  date: string;
  changeCount: string;
}

export function renderDailyDigest(vars: DailyDigestVars) {
  return templateMessage(DAILY_DIGEST, [
    bodyComponent(vars.date, vars.changeCount),
    quickReplyButton(0, "see_changes"),
    quickReplyButton(1, "stop_daily"),
  ]);
}
