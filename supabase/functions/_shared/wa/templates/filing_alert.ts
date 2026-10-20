// _shared/wa/templates/filing_alert: a QPR filed, missed or late, or another filing-style event
// (WaAlerts; API_CONTRACTS §5.2). No header; project / event line / date, catalogue order.

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, quickReplyButton, templateMessage } from "./shared.ts";

export const FILING_ALERT: TemplateMirror = {
  code: "filing_alert",
  metaName: "filing_alert",
  category: "UTILITY",
  language: "en",
  variables: ["project", "event_line", "date"],
  buttons: [
    { type: "quick_reply", text: "Open full card" },
    { type: "quick_reply", text: "Stop alerts" },
  ],
};

/** The quick replies' payloads, in button order: router.ts's own reply ids. outbox-dispatch
 * gives a session alert the same ids, so a tap routes the same way inside the 24-hour window. */
export const FILING_ALERT_REPLY_IDS = ["open_full_card", "stop_alerts"] as const;

export interface FilingAlertVars {
  project: string;
  eventLine: string;
  date: string;
}

export function renderFilingAlert(vars: FilingAlertVars) {
  return templateMessage(FILING_ALERT, [
    bodyComponent(vars.project, vars.eventLine, vars.date),
    quickReplyButton(0, FILING_ALERT_REPLY_IDS[0]),
    quickReplyButton(1, FILING_ALERT_REPLY_IDS[1]),
  ]);
}
