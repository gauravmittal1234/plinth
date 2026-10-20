// SMS fallback: MSG91 on a TRAI DLT template, sender PLINTH (T41; API_CONTRACTS §5.4;
// .env.example "SMS fallback: TRAI DLT + MSG91", SETUP 1.3).
//
//   POST https://control.msg91.com/api/v5/flow
//   authkey: {MSG91_AUTH_KEY}
//   { "template_id": MSG91_TEMPLATE_ID, "short_url": "0", "recipients": [{ "mobiles", "otp" }] }
//
// The SMS text, the sender header PLINTH and the DLT entity and template ids (DLT_ENTITY_ID,
// DLT_TEMPLATE_ID) are registered once on the DLT portal and bound to MSG91_TEMPLATE_ID on
// MSG91, so a send carries only the number and the code. The template's one variable is ##otp##.
// DLT reaches Indian numbers only; other numbers are left to WhatsApp.
//
// MSG91 can answer HTTP 200 with { "type": "error" }, so success is type = "success".

import type { Secret } from "../core/env.ts";
import type { OtpAdapter, OtpMessage } from "./adapter.ts";
import { OtpSendError, postJson, PROVIDER_TIMEOUT_MS } from "./adapter.ts";
import { isIndianNumber, isTestNumber, OTP_RULES } from "./rules.ts";

export const MSG91_FLOW_URL = "https://control.msg91.com/api/v5/flow";

/**
 * The text registered on the DLT portal for MSG91_TEMPLATE_ID ({#var#} is the code). Kept here
 * so the registration and the code agree; MSG91 sends the registered copy, not this string.
 */
export const DLT_SMS_TEXT = `{#var#} is your Plinth sign-in code. It expires in ${
  OTP_RULES.ttlSeconds / 60
} minutes. Plinth never calls to ask for this code. -${OTP_RULES.smsSender}`;

/** The Flow API body for one code. */
export function msg91FlowBody(templateId: string, to: string, code: string) {
  return {
    template_id: templateId,
    short_url: "0",
    recipients: [{ mobiles: to.replace(/^\+/, ""), otp: code }],
  };
}

export interface Msg91Config {
  authKey: Secret;
  templateId: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function msg91Adapter(cfg: Msg91Config): OtpAdapter {
  return {
    channel: "msg91",
    async send(msg: OtpMessage) {
      if (isTestNumber(msg.to)) throw new OtpSendError("msg91", "test number refused");
      if (!isIndianNumber(msg.to)) throw new OtpSendError("msg91", "DLT SMS reaches +91 only");
      const { status, json } = await postJson(
        "msg91",
        cfg.fetch ?? fetch,
        MSG91_FLOW_URL,
        { authkey: cfg.authKey.reveal() },
        msg91FlowBody(cfg.templateId, msg.to, msg.code),
        cfg.timeoutMs ?? PROVIDER_TIMEOUT_MS,
      );
      const body = json as { type?: unknown; message?: unknown } | null;
      if (status >= 200 && status < 300 && body?.type === "success") {
        // On success `message` is MSG91's request id.
        return {
          channel: "msg91",
          providerId: typeof body.message === "string" ? body.message : null,
        };
      }
      throw new OtpSendError("msg91", `MSG91 answered ${status}`, {
        status,
        providerCode: typeof body?.type === "string" ? body.type : null,
      });
    },
  };
}
