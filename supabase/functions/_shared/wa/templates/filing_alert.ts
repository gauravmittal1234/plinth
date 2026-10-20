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

export interface FilingAlertVars {
  project: string;
  eventLine: string;
  date: string;
}

export function renderFilingAlert(vars: FilingAlertVars) {
  return templateMessage(FILING_ALERT, [
    bodyComponent(vars.project, vars.eventLine, vars.date),
    quickReplyButton(0, "open_full_card"),
    quickReplyButton(1, "stop_alerts"),
  ]);
}
