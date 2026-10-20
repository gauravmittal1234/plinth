// WhatsApp Graph API send (T42; API_CONTRACTS §5.2 "outbox-dispatch → Graph API
// POST /{WA_PHONE_NUMBER_ID}/messages"). META_MODE=mock (the default everywhere but a live
// deploy) never calls Meta: it fabricates a provider message id so the caller can still record
// the request body as evidence (comms.wa_messages, status mock_sent).
//
//   const send = whatsAppSender("mock", null, null);
//   await send(body);   // { ok, providerMessageId, mock, error? }

import type { MetaMode } from "../core/env.ts";
import type { Secret } from "../core/env.ts";

export interface WhatsAppSendResult {
  ok: boolean;
  providerMessageId: string;
  mock: boolean;
  error?: string;
}

export interface WhatsAppSenderOptions {
  /** Injected in tests; defaults to the global fetch. */
  fetch?: typeof fetch;
  /** Default v21.0; override only for a pinned test fixture. */
  graphVersion?: string;
}

export function whatsAppSender(
  metaMode: MetaMode,
  phoneNumberId: string | null,
  accessToken: Secret | null,
  opts: WhatsAppSenderOptions = {},
): (body: Record<string, unknown>) => Promise<WhatsAppSendResult> {
  const fetchImpl = opts.fetch ?? fetch;
  const version = opts.graphVersion ?? "v21.0";

  return async (body) => {
    if (metaMode === "mock") {
      return { ok: true, providerMessageId: `mock_${crypto.randomUUID()}`, mock: true };
    }
    if (!phoneNumberId || !accessToken) {
      return {
        ok: false,
        providerMessageId: "",
        mock: false,
        error: "WA_PHONE_NUMBER_ID or WA_ACCESS_TOKEN is not set",
      };
    }
    const res = await fetchImpl(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken.reveal()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        providerMessageId: "",
        mock: false,
        error: `graph ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const payload = await res.json() as { messages?: Array<{ id?: string }> };
    const id = payload.messages?.[0]?.id;
    if (!id) {
      return {
        ok: false,
        providerMessageId: "",
        mock: false,
        error: "graph response had no message id",
      };
    }
    return { ok: true, providerMessageId: id, mock: false };
  };
}
