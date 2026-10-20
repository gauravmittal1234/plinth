// _shared/wa/templates/weekly_digest: the Sunday 9 am round-up (WaDigest; API_CONTRACTS §5.2).
// Image header (1080×570, one floor per followed project, drawn outside this renderer and passed
// in as a link); week range / change count / the one fact that may move a band, catalogue order.
// "See changes" and "Stop weekly" are router.ts's digest.see_changes and prefs.stop(stop_weekly)
// reply ids; "Turn weekly on" (api.whatsapp_digest_changes's sibling, api.whatsapp_prefs_stop)
// reuses the stop_weekly id in the handler's own session reply, not here.

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, imageHeader, quickReplyButton, templateMessage } from "./shared.ts";

export const WEEKLY_DIGEST: TemplateMirror = {
  code: "weekly_digest",
  metaName: "weekly_digest",
  category: "UTILITY",
  language: "en",
  variables: ["week_range", "change_count", "band_moving_fact"],
  buttons: [
    { type: "quick_reply", text: "See changes" },
    { type: "quick_reply", text: "Stop weekly" },
  ],
};

export interface WeeklyDigestVars {
  headerImageUrl: string;
  weekRange: string;
  changeCount: string;
  bandMovingFact: string;
}

export function renderWeeklyDigest(vars: WeeklyDigestVars) {
  return templateMessage(WEEKLY_DIGEST, [
    imageHeader(vars.headerImageUrl),
    bodyComponent(vars.weekRange, vars.changeCount, vars.bandMovingFact),
    quickReplyButton(0, "see_changes"),
    quickReplyButton(1, "stop_weekly"),
  ]);
}
