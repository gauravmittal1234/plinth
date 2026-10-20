// _shared/wa/templates/export_ready: a DPDP data export is ready to download (AppYou;
// API_CONTRACTS §5.2). No header; expiry date, catalogue order. One CTA-URL button whose dynamic
// suffix (urlSuffix) Meta appends to the approved template's fixed base URL.

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, templateMessage, urlButton } from "./shared.ts";

export const EXPORT_READY: TemplateMirror = {
  code: "export_ready",
  metaName: "export_ready",
  category: "UTILITY",
  language: "en",
  variables: ["expiry_date"],
  buttons: [{ type: "cta_url", text: null }],
};

export interface ExportReadyVars {
  expiryDate: string;
  urlSuffix: string;
}

export function renderExportReady(vars: ExportReadyVars) {
  return templateMessage(EXPORT_READY, [
    bodyComponent(vars.expiryDate),
    urlButton(0, vars.urlSuffix),
  ]);
}
