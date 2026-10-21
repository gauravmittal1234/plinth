// _shared/wa/templates: the M2 WhatsApp template renderers (T46b; API_CONTRACTS §5.2), re-exported
// from one module. outbox-dispatch picks a renderer by comms.templates.code (= TemplateMirror.code
// here) and calls it with that row's own payload.

export * from "./shared.ts";
export * from "./login_code.ts";
export * from "./band_change_alert.ts";
export * from "./filing_alert.ts";
export * from "./weekly_digest.ts";
export * from "./daily_digest.ts";
export * from "./family_removed.ts";
export * from "./export_ready.ts";

import { LOGIN_CODE } from "./login_code.ts";
import { BAND_CHANGE_ALERT, BAND_CHANGE_ALERT_REPLY_IDS } from "./band_change_alert.ts";
import { FILING_ALERT, FILING_ALERT_REPLY_IDS } from "./filing_alert.ts";
import { WEEKLY_DIGEST, WEEKLY_DIGEST_REPLY_IDS } from "./weekly_digest.ts";
import { DAILY_DIGEST, DAILY_DIGEST_REPLY_IDS } from "./daily_digest.ts";
import { FAMILY_REMOVED } from "./family_removed.ts";
import { EXPORT_READY } from "./export_ready.ts";
import type { TemplateMirror } from "./shared.ts";

/** Every M2 template this task owns, by its comms.templates.code. */
export const TEMPLATE_MIRRORS: Readonly<Record<string, TemplateMirror>> = {
  login_code: LOGIN_CODE,
  band_change_alert: BAND_CHANGE_ALERT,
  filing_alert: FILING_ALERT,
  weekly_digest: WEEKLY_DIGEST,
  daily_digest: DAILY_DIGEST,
  family_removed: FAMILY_REMOVED,
  export_ready: EXPORT_READY,
};

/**
 * Each template's quick-reply payloads, in button order, by comms.templates.code: the reply ids
 * router.ts routes (card_button, prefs.stop, digest). A template with no quick replies has none.
 */
export const TEMPLATE_REPLY_IDS: Readonly<Record<string, readonly string[]>> = {
  band_change_alert: BAND_CHANGE_ALERT_REPLY_IDS,
  filing_alert: FILING_ALERT_REPLY_IDS,
  weekly_digest: WEEKLY_DIGEST_REPLY_IDS,
  daily_digest: DAILY_DIGEST_REPLY_IDS,
};
