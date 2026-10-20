// WhatsApp channel: the login_code AUTHENTICATION template via the Cloud API (T41;
// API_CONTRACTS §5.2 template catalogue, §5.4; platform_architecture §2.4).
//
//   POST https://graph.facebook.com/{GRAPH_API_VERSION}/{WA_PHONE_NUMBER_ID}/messages
//   Authorization: Bearer {WA_ACCESS_TOKEN}
//
// Meta writes the text of an authentication template itself ("<code> is your verification
// code", the security line, "This code expires in 10 minutes."), so the send carries only the
// code: once for the body and once for the copy-code button. LOGIN_CODE_TEMPLATE mirrors the
// catalogue row (packages/contracts/catalogues/wa_templates.json, checked in the tests), and
// loginCodeTemplateDefinition() is the body the founder submits to Meta once (SETUP 1.1).

import type { Secret } from "../core/env.ts";
import type { OtpAdapter, OtpMessage } from "./adapter.ts";
import { OtpSendError, postJson, PROVIDER_TIMEOUT_MS } from "./adapter.ts";
import { isTestNumber, OTP_RULES } from "./rules.ts";

export const GRAPH_API_VERSION = "v23.0";

/** The catalogue row for login_code (API_CONTRACTS §5.2). */
export const LOGIN_CODE_TEMPLATE = {
  code: "login_code",
  metaName: "login_code",
  category: "AUTHENTICATION",
  language: "en",
  variables: ["code"],
  buttons: [{ type: "copy_code", text: "Copy code" }],
} as const;

/** The Graph API message that sends `code` to `to` (E.164) with the login_code template. */
export function loginCodeMessage(to: string, code: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to.replace(/^\+/, ""),
    type: "template",
    template: {
      name: LOGIN_CODE_TEMPLATE.metaName,
      language: { code: LOGIN_CODE_TEMPLATE.language },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        // Meta's copy-code button takes the code as a "url" button parameter at index 0.
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ],
    },
  };
}

/**
 * The template as submitted to Meta (POST /{WA_BUSINESS_ACCOUNT_ID}/message_templates): the
 * security recommendation, the 10-minute expiry line, a copy-code button, and a delivery TTL of
 * 10 minutes so a late code is dropped rather than delivered after it expired.
 */
export function loginCodeTemplateDefinition() {
  return {
    name: LOGIN_CODE_TEMPLATE.metaName,
    language: LOGIN_CODE_TEMPLATE.language,
    category: LOGIN_CODE_TEMPLATE.category,
    message_send_ttl_seconds: OTP_RULES.ttlSeconds,
    components: [
      { type: "BODY", add_security_recommendation: true },
      { type: "FOOTER", code_expiration_minutes: OTP_RULES.ttlSeconds / 60 },
      {
        type: "BUTTONS",
        buttons: [{
          type: "OTP",
          otp_type: "COPY_CODE",
          text: LOGIN_CODE_TEMPLATE.buttons[0].text,
        }],
      },
    ],
  };
}

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: Secret;
  graphVersion?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function whatsappAdapter(cfg: WhatsAppConfig): OtpAdapter {
  const version = cfg.graphVersion ?? GRAPH_API_VERSION;
  const url = `https://graph.facebook.com/${version}/${
    encodeURIComponent(cfg.phoneNumberId)
  }/messages`;
  return {
    channel: "whatsapp",
    async send(msg: OtpMessage) {
      if (isTestNumber(msg.to)) throw new OtpSendError("whatsapp", "test number refused");
      const { status, json } = await postJson(
        "whatsapp",
        cfg.fetch ?? fetch,
        url,
        { authorization: `Bearer ${cfg.accessToken.reveal()}` },
        loginCodeMessage(msg.to, msg.code),
        cfg.timeoutMs ?? PROVIDER_TIMEOUT_MS,
      );
      const body = json as
        | { messages?: Array<{ id?: unknown }>; error?: { code?: unknown } }
        | null;
      const id = body?.messages?.[0]?.id;
      if (status >= 200 && status < 300 && typeof id === "string") {
        return { channel: "whatsapp", providerId: id };
      }
      const code = body?.error?.code;
      throw new OtpSendError("whatsapp", `Graph API answered ${status}`, {
        status,
        providerCode: typeof code === "number" || typeof code === "string" ? String(code) : null,
      });
    },
  };
}
