// _shared/wa/templates/band_change_alert: a followed project's band moved (WaAlerts; API_CONTRACTS
// §5.2). Image header (the band on its fill), then project / from band / to band / trigger / date,
// in the catalogue's variable order. "Open full card" and "Stop alerts" are router.ts's own reply
// ids (card_button rule, prefs.stop rule): change one here and the inbound rule stops matching.

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, imageHeader, quickReplyButton, templateMessage } from "./shared.ts";

export const BAND_CHANGE_ALERT: TemplateMirror = {
  code: "band_change_alert",
  metaName: "band_change_alert",
  category: "UTILITY",
  language: "en",
  variables: ["project", "from_band", "to_band", "trigger", "date"],
  buttons: [
    { type: "quick_reply", text: "Open full card" },
    { type: "quick_reply", text: "Stop alerts" },
  ],
};

export interface BandChangeAlertVars {
  headerImageUrl: string;
  project: string;
  fromBand: string;
  toBand: string;
  trigger: string;
  date: string;
}

export function renderBandChangeAlert(vars: BandChangeAlertVars) {
  return templateMessage(BAND_CHANGE_ALERT, [
    imageHeader(vars.headerImageUrl),
    bodyComponent(vars.project, vars.fromBand, vars.toBand, vars.trigger, vars.date),
    quickReplyButton(0, "open_full_card"),
    quickReplyButton(1, "stop_alerts"),
  ]);
}
