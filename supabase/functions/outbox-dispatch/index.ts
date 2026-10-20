// outbox-dispatch: POST /functions/v1/outbox-dispatch (API_CONTRACTS §5.5) · auth: the dispatch
// secret, never a JWT (header x-plinth-dispatch-secret, DISPATCH_SECRET_HEADER in _shared/core/
// auth.ts). Callers: pg_cron (every 10 s) and an AFTER INSERT trigger on comms.outbox via
// pg_net, both reading the secret from Vault (supabase/migrations/20261112000200).
//
// → 200 { claimed, sent, deferred, suppressed, failed }   always 200 once the secret checks out;
//   per-row failures are recorded on the row (comms.outbox.last_error) and retried later, never
//   thrown back to the caller.
//   401 auth_required   the header is missing
//   403 forbidden        the header doesn't match
//   500 internal          PLINTH_DISPATCH_SECRET (or another required variable) is not set
// Deploy without JWT verification (config.toml [functions.outbox-dispatch] verify_jwt = false).
//
// Env: the CoreEnv set (SUPABASE_URL, a secret key, PLINTH_DISPATCH_SECRET, META_MODE) plus
// WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN (WhatsApp, live mode only) and FCM_SERVICE_ACCOUNT (push;
// "not_configured" is a quiet no-op, never a crash, when it's unset).
//
// Logic and tests: logic.ts, logic.test.ts. Adapters: _shared/outbox/{fcm,whatsapp,email}.ts.

import { processEnv, readSecret, readVar } from "../_shared/core/env.ts";
import { flagsReader, rpcFlagsLoader } from "../_shared/core/flags.ts";
import { callRpc, secretClient } from "../_shared/core/supabase.ts";
import { sendEmailMock } from "../_shared/outbox/email.ts";
import { fcmSender } from "../_shared/outbox/fcm.ts";
import { whatsAppSender } from "../_shared/outbox/whatsapp.ts";
import type { DispatchDeps } from "./logic.ts";
import { makeOutboxDispatch, MAX_ATTEMPTS, parseClaimed } from "./logic.ts";

const dispatch = makeOutboxDispatch({
  buildDeps: (ctx): DispatchDeps => {
    const client = secretClient(ctx.env.supabase, { requestId: ctx.requestId, fn: ctx.fn });
    const flags = flagsReader(rpcFlagsLoader(client), { clock: ctx.clock, log: ctx.log });
    const sendPush = fcmSender(readSecret(processEnv, "FCM_SERVICE_ACCOUNT")?.reveal());
    const sendWhatsAppBody = whatsAppSender(
      ctx.env.metaMode,
      readVar(processEnv, "WA_PHONE_NUMBER_ID") ?? null,
      readSecret(processEnv, "WA_ACCESS_TOKEN"),
    );

    return {
      now: () => ctx.clock.now(),
      log: ctx.log,
      async claimDue(limit) {
        return parseClaimed(await callRpc(client, "outbox_claim_due", { p_limit: limit }));
      },
      async resolve(id, outcome) {
        const args: Record<string, unknown> = { p_id: id, p_outcome: outcome.outcome };
        if (outcome.outcome === "sent") {
          if (outcome.channel) args.p_channel = outcome.channel;
          if (outcome.providerMessageId) args.p_provider_message_id = outcome.providerMessageId;
        } else if (outcome.outcome === "failed") {
          args.p_error = outcome.error;
          args.p_not_before = outcome.notBefore.toISOString();
          args.p_max_attempts = MAX_ATTEMPTS;
        } else if (outcome.outcome === "suppressed") {
          args.p_error = outcome.error;
        } else {
          args.p_not_before = outcome.notBefore.toISOString();
        }
        await callRpc(client, "outbox_resolve", args);
      },
      isChannelEnabled(channel) {
        if (channel === "push") return flags.isOn("push_outbound");
        if (channel === "whatsapp_template" || channel === "whatsapp_session") {
          return flags.isOn("wa_outbound");
        }
        if (channel === "email") return flags.isOn("email_outbound");
        return Promise.resolve(false);
      },
      async getWaContact(contactId) {
        return await callRpc(client, "outbox_wa_contact", { p_contact_id: contactId });
      },
      async recordWaSend(args) {
        await callRpc(client, "outbox_record_wa_send", {
          p_contact_id: args.contactId,
          p_wa_message_id: args.waMessageId,
          p_type: args.type,
          p_payload: args.body,
          p_template_code: args.templateCode,
          p_status: args.status,
        });
      },
      sendWhatsApp: sendWhatsAppBody,
      async pushTokens(userId) {
        return (await callRpc<string[] | null>(client, "outbox_push_tokens", {
          p_user_id: userId,
        })) ?? [];
      },
      async pushTokenGone(token) {
        await callRpc(client, "outbox_push_token_gone", { p_fcm_token: token });
      },
      sendPush,
      sendEmail: sendEmailMock,
    };
  },
});

Deno.serve(dispatch);
