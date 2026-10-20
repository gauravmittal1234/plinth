// outbox-dispatch logic. Run: npx --yes deno@2 task test (in supabase/functions).
import { assertEquals, assertExists, readBody } from "../_shared/testing/mod.ts";
import { fakeRequest } from "../_shared/testing/mod.ts";
import {
  backoffDelayMs,
  buildFcmMessage,
  buildWhatsAppRequest,
  channelFlagKey,
  chooseWhatsAppChannel,
  type ClaimedRow,
  dedupeBatch,
  DEFAULT_QUIET_HOURS,
  deferForQuietHours,
  type DispatchDeps,
  dispatchHandler,
  isTestBlockNumber,
  MAX_ATTEMPTS,
  type ResolveOutcome,
} from "./logic.ts";

function row(overrides: Partial<ClaimedRow> = {}): ClaimedRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    dedupe_key: "dk-1",
    user_id: null,
    contact_id: null,
    org_member_id: null,
    channel: "push",
    template_code: null,
    payload: {},
    basis: null,
    attempts: 0,
    created_at: "2026-10-18T06:30:00Z",
    template: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Accept: "a quiet-hours row is deferred to 08:00."
// ---------------------------------------------------------------------------

Deno.test("deferForQuietHours: 23:00 IST defers to 08:00 IST the next day", () => {
  const now = new Date("2026-10-18T17:30:00Z"); // 23:00 IST
  const until = deferForQuietHours(now, DEFAULT_QUIET_HOURS);
  assertExists(until);
  assertEquals(until.toISOString(), new Date("2026-10-19T02:30:00Z").toISOString()); // 08:00 IST, 19 Oct
});

Deno.test("deferForQuietHours: 05:00 IST (past midnight) defers to 08:00 IST the same IST day", () => {
  const now = new Date("2026-10-17T23:30:00Z"); // 05:00 IST, 18 Oct
  const until = deferForQuietHours(now, DEFAULT_QUIET_HOURS);
  assertExists(until);
  assertEquals(until.toISOString(), new Date("2026-10-18T02:30:00Z").toISOString()); // 08:00 IST, 18 Oct
});

Deno.test("deferForQuietHours: 14:00 IST (outside the window) sends now", () => {
  const now = new Date("2026-10-18T08:30:00Z"); // 14:00 IST
  assertEquals(deferForQuietHours(now, DEFAULT_QUIET_HOURS), null);
});

Deno.test("deferForQuietHours: exactly at the boundaries", () => {
  assertExists(deferForQuietHours(new Date("2026-10-18T16:30:00Z"), DEFAULT_QUIET_HOURS)); // 22:00 IST: in
  assertEquals(deferForQuietHours(new Date("2026-10-18T02:30:00Z"), DEFAULT_QUIET_HOURS), null); // 08:00 IST: out
});

// ---------------------------------------------------------------------------
// Accept: "a duplicate dedupe key is suppressed."
// ---------------------------------------------------------------------------

Deno.test("dedupeBatch: a second row with the same dedupe_key is suppressed", () => {
  const a = row({ id: "a", dedupe_key: "same" });
  const b = row({ id: "b", dedupe_key: "same" });
  const c = row({ id: "c", dedupe_key: "different" });
  const { toProcess, suppressed } = dedupeBatch([a, b, c]);
  assertEquals(toProcess.map((r) => r.id), ["a", "c"]);
  assertEquals(suppressed.map((r) => r.id), ["b"]);
});

Deno.test("dedupeBatch: no duplicates means nothing is suppressed", () => {
  const { toProcess, suppressed } = dedupeBatch([
    row({ id: "a", dedupe_key: "x" }),
    row({ id: "b", dedupe_key: "y" }),
  ]);
  assertEquals(toProcess.length, 2);
  assertEquals(suppressed.length, 0);
});

// ---------------------------------------------------------------------------
// Accept: "outside 24 h → template, inside → session."
// ---------------------------------------------------------------------------

Deno.test("chooseWhatsAppChannel: inside the 24h window → session", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  const lastInbound = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
  assertEquals(chooseWhatsAppChannel(lastInbound, now), "whatsapp_session");
});

Deno.test("chooseWhatsAppChannel: outside the 24h window → template", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  const lastInbound = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString();
  assertEquals(chooseWhatsAppChannel(lastInbound, now), "whatsapp_template");
});

Deno.test("chooseWhatsAppChannel: never messaged (null) → template", () => {
  assertEquals(chooseWhatsAppChannel(null, new Date()), "whatsapp_template");
});

Deno.test("chooseWhatsAppChannel: exactly 24h ago → template (the window is a strict <)", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  const lastInbound = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  assertEquals(chooseWhatsAppChannel(lastInbound, now), "whatsapp_template");
});

// ---------------------------------------------------------------------------
// INTEGRATION_NOTES "T42/T44: outbound SMS and WhatsApp adapters refuse the test block
// +91 99000 003NN in every environment."
// ---------------------------------------------------------------------------

Deno.test("isTestBlockNumber: matches the whole +91 99000 003NN block, however formatted", () => {
  assertEquals(isTestBlockNumber("+919900000318"), true); // Rohan's fixture number
  assertEquals(isTestBlockNumber("919900000300"), true); // NN = 00
  assertEquals(isTestBlockNumber("9900000399"), true); // NN = 99, no country code
  assertEquals(isTestBlockNumber("+91 99000 00318"), true); // with the brief's spacing
  assertEquals(isTestBlockNumber("+91-9900-000-318"), true); // dashes
});

Deno.test("isTestBlockNumber: a neighbouring real-shaped number is not in the block", () => {
  assertEquals(isTestBlockNumber("+919900000418"), false); // 99000004NN, not 003NN
  assertEquals(isTestBlockNumber("+919811122233"), false);
});

// ---------------------------------------------------------------------------
// Accept: "the FCM payload is shaped correctly."
// ---------------------------------------------------------------------------

Deno.test("buildFcmMessage: data-only, carries the deep link, no notification block", () => {
  const message = buildFcmMessage({
    dedupe_key: "dk-42",
    template_code: "band_change_alert",
    payload: {
      deep_link: "https://plinth.in/p/aurelia-heights",
      project: "Aurelia Heights",
      score: 3,
    },
  });
  assertEquals(Object.keys(message), ["data"]);
  assertEquals(message.data.deep_link, "https://plinth.in/p/aurelia-heights");
  assertEquals(message.data.dedupe_key, "dk-42");
  assertEquals(message.data.notification_code, "band_change_alert");
  assertEquals(message.data.project, "Aurelia Heights");
  assertEquals(message.data.score, "3"); // FCM data values must be strings
  assertEquals("notification" in message, false);
});

Deno.test("buildFcmMessage: throws without a deep_link (never silently drops the link)", () => {
  let threw = false;
  try {
    buildFcmMessage({ dedupe_key: "dk", template_code: null, payload: {} });
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test("buildFcmMessage: drops non-primitive payload fields rather than sending them unstringified", () => {
  const message = buildFcmMessage({
    dedupe_key: "dk",
    template_code: null,
    payload: { deep_link: "https://plinth.in/p/x", nested: { a: 1 } },
  });
  assertEquals("nested" in message.data, false);
});

// ---------------------------------------------------------------------------
// WhatsApp request shape (template vs. session), channel flags and backoff.
// ---------------------------------------------------------------------------

Deno.test("buildWhatsAppRequest: template fills body parameters from the row's payload", () => {
  const body = buildWhatsAppRequest(
    "919900000101",
    "whatsapp_template",
    {
      meta_name: "band_change_alert",
      category: "utility",
      language: "en",
      header: {},
      variables: ["project", "to_band"],
      buttons: [],
    },
    { project: "Aurelia Heights", to_band: "elevated" },
  );
  assertEquals(body.type, "template");
  assertEquals((body.template as { name: string }).name, "band_change_alert");
  assertEquals(
    (body.template as { components: Array<{ parameters: Array<{ type: string; text: string }> }> })
      .components[0]!.parameters,
    [{ type: "text", text: "Aurelia Heights" }, { type: "text", text: "elevated" }],
  );
});

Deno.test("buildWhatsAppRequest: template without variables sends no components", () => {
  const body = buildWhatsAppRequest(
    "919900000101",
    "whatsapp_template",
    {
      meta_name: "family_removed",
      category: "utility",
      language: "en",
      header: {},
      variables: [],
      buttons: [],
    },
    {},
  );
  assertEquals("components" in (body.template as object), false);
});

Deno.test("buildWhatsAppRequest: session with quick-reply buttons becomes an interactive message", () => {
  const body = buildWhatsAppRequest(
    "919900000101",
    "whatsapp_session",
    {
      meta_name: "band_change_alert",
      category: "utility",
      language: "en",
      header: {},
      variables: [],
      buttons: [{ type: "quick_reply", text: "Open full card" }, {
        type: "quick_reply",
        text: "Stop alerts",
      }, { type: "cta_url", text: null }],
    },
    { session_text: "Aurelia Heights moved to Elevated." },
  );
  assertEquals(body.type, "interactive");
  const interactive = body.interactive as {
    body: { text: string };
    action: { buttons: unknown[] };
  };
  assertEquals(interactive.body.text, "Aurelia Heights moved to Elevated.");
  assertEquals(interactive.action.buttons.length, 2); // cta_url is dropped; session buttons are quick-reply only
});

Deno.test("buildWhatsAppRequest: session with no buttons falls back to plain text", () => {
  const body = buildWhatsAppRequest("919900000101", "whatsapp_session", null, {
    session_text: "hi",
  });
  assertEquals(body.type, "text");
  assertEquals((body.text as { body: string }).body, "hi");
});

Deno.test("buildWhatsAppRequest: template without a template row throws (never sends garbage)", () => {
  let threw = false;
  try {
    buildWhatsAppRequest("919900000101", "whatsapp_template", null, {});
  } catch {
    threw = true;
  }
  assertEquals(threw, true);
});

Deno.test("channelFlagKey maps every channel; sms has none (not built in R1)", () => {
  assertEquals(channelFlagKey("push"), "push_outbound");
  assertEquals(channelFlagKey("whatsapp_template"), "wa_outbound");
  assertEquals(channelFlagKey("whatsapp_session"), "wa_outbound");
  assertEquals(channelFlagKey("email"), "email_outbound");
  assertEquals(channelFlagKey("sms"), null);
});

Deno.test("backoffDelayMs grows with attempts and never exceeds the schedule's last step", () => {
  const delays = [0, 1, 2, 3, 4, 5, 20].map(backoffDelayMs);
  for (let i = 1; i < delays.length - 1; i++) assertEquals(delays[i]! >= delays[i - 1]!, true);
  assertEquals(delays.at(-1), delays.at(-2));
  assertEquals(MAX_ATTEMPTS > 0, true);
});

// ---------------------------------------------------------------------------
// Orchestration (fakes, no network — health's pattern).
// ---------------------------------------------------------------------------

function fakeDeps(
  overrides: Partial<DispatchDeps> = {},
): DispatchDeps & { resolved: Array<{ id: string; outcome: ResolveOutcome }> } {
  const resolved: Array<{ id: string; outcome: ResolveOutcome }> = [];
  const base: DispatchDeps = {
    now: () => new Date("2026-10-18T12:00:00+05:30"), // 12:00 IST: outside quiet hours
    claimDue: () => Promise.resolve([]),
    resolve(id, outcome) {
      resolved.push({ id, outcome });
      return Promise.resolve();
    },
    isChannelEnabled: () => Promise.resolve(true),
    getWaContact: () => Promise.resolve(null),
    recordWaSend: () => Promise.resolve(),
    sendWhatsApp: () => Promise.resolve({ ok: true, providerMessageId: "wamid.1", mock: true }),
    pushTokens: () => Promise.resolve([]),
    pushTokenGone: () => Promise.resolve(),
    sendPush: () => Promise.resolve("ok"),
    sendEmail: () => Promise.resolve({ ok: true, providerMessageId: "mock_1" }),
  };
  return Object.assign({}, base, overrides, { resolved }) as DispatchDeps & {
    resolved: Array<{ id: string; outcome: ResolveOutcome }>;
  };
}

Deno.test("dispatchHandler: a push row with a device token resolves sent", async () => {
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([
        row({
          id: "p1",
          channel: "push",
          user_id: "u1",
          payload: { deep_link: "https://plinth.in/p/x" },
        }),
      ]),
    pushTokens: () => Promise.resolve(["token-1"]),
  });
  const res = await dispatchHandler(deps)(
    fakeRequest("outbox-dispatch", { method: "POST" }),
    {} as never,
  );
  assertEquals(await readBody(res), { claimed: 1, sent: 1, deferred: 0, suppressed: 0, failed: 0 });
  assertEquals(deps.resolved, [{ id: "p1", outcome: { outcome: "sent", channel: "push" } }]);
});

Deno.test("dispatchHandler: no registered devices suppresses the push row", async () => {
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([
        row({
          id: "p1",
          channel: "push",
          user_id: "u1",
          payload: { deep_link: "https://plinth.in/p/x" },
        }),
      ]),
    pushTokens: () => Promise.resolve([]),
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(deps.resolved[0]!.outcome.outcome, "suppressed");
});

Deno.test("dispatchHandler: a disabled channel flag suppresses without touching the adapter", async () => {
  let sendCalled = false;
  const deps = fakeDeps({
    claimDue: () => Promise.resolve([row({ id: "e1", channel: "email" })]),
    isChannelEnabled: () => Promise.resolve(false),
    sendEmail: () => {
      sendCalled = true;
      return Promise.resolve({ ok: true, providerMessageId: "x" });
    },
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(sendCalled, false);
  assertEquals(deps.resolved[0]!.outcome, {
    outcome: "suppressed",
    error: "email_outbound is off",
  });
});

Deno.test("dispatchHandler: a duplicate dedupe_key in the batch is suppressed and never dispatched", async () => {
  let emailCalls = 0;
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([
        row({ id: "e1", channel: "email", dedupe_key: "dk-x" }),
        row({ id: "e2", channel: "email", dedupe_key: "dk-x" }),
      ]),
    sendEmail: () => {
      emailCalls++;
      return Promise.resolve({ ok: true, providerMessageId: "x" });
    },
  });
  const res = await dispatchHandler(deps)(
    fakeRequest("outbox-dispatch", { method: "POST" }),
    {} as never,
  );
  assertEquals(emailCalls, 1);
  assertEquals(await readBody(res), { claimed: 2, sent: 1, deferred: 0, suppressed: 1, failed: 0 });
  const e2 = deps.resolved.find((r) => r.id === "e2")!;
  assertEquals(e2.outcome, { outcome: "suppressed", error: "duplicate dedupe_key in this batch" });
});

Deno.test("dispatchHandler: a push row is deferred during quiet hours (no adapter call)", async () => {
  let sendCalled = false;
  const deps = fakeDeps({
    now: () => new Date("2026-10-18T23:00:00+05:30"), // well inside 22:00–08:00 IST
    claimDue: () => Promise.resolve([row({ id: "p1", channel: "push", user_id: "u1" })]),
    pushTokens: () => {
      sendCalled = true;
      return Promise.resolve(["t1"]);
    },
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(sendCalled, false);
  assertEquals(deps.resolved[0]!.outcome.outcome, "deferred");
});

Deno.test("dispatchHandler: an email row is never subject to quiet hours", async () => {
  const deps = fakeDeps({
    now: () => new Date("2026-10-18T23:00:00+05:30"),
    claimDue: () => Promise.resolve([row({ id: "e1", channel: "email" })]),
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(deps.resolved[0]!.outcome.outcome, "sent");
});

Deno.test("dispatchHandler: whatsapp picks session inside 24h and records the send", async () => {
  const recorded: Array<{ status: string; templateCode: string | null }> = [];
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([
        row({
          id: "w1",
          channel: "whatsapp_session",
          contact_id: "c1",
          template_code: "band_change_alert",
          template: {
            meta_name: "band_change_alert",
            category: "utility",
            language: "en",
            header: {},
            variables: [],
            buttons: [],
          },
          payload: { session_text: "hi" },
        }),
      ]),
    getWaContact: () =>
      Promise.resolve({
        wa_id_e164: "919900000101",
        last_inbound_at: new Date().toISOString(),
        utility_opt_in: true,
        stopped_at: null,
      }),
    recordWaSend: (args) => {
      recorded.push({ status: args.status, templateCode: args.templateCode });
      return Promise.resolve();
    },
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(deps.resolved[0]!.outcome, {
    outcome: "sent",
    channel: "whatsapp_session",
    providerMessageId: "wamid.1",
  });
  assertEquals(recorded, [{ status: "mock_sent", templateCode: null }]);
});

Deno.test("dispatchHandler: whatsapp picks template outside 24h", async () => {
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([
        row({
          id: "w1",
          channel: "whatsapp_template",
          contact_id: "c1",
          template_code: "band_change_alert",
          template: {
            meta_name: "band_change_alert",
            category: "utility",
            language: "en",
            header: {},
            variables: [],
            buttons: [],
          },
        }),
      ]),
    getWaContact: () =>
      Promise.resolve({
        wa_id_e164: "919900000101",
        last_inbound_at: null,
        utility_opt_in: true,
        stopped_at: null,
      }),
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(deps.resolved[0]!.outcome, {
    outcome: "sent",
    channel: "whatsapp_template",
    providerMessageId: "wamid.1",
  });
});

Deno.test("dispatchHandler: a contact who replied STOP is suppressed, not sent", async () => {
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([row({ id: "w1", channel: "whatsapp_session", contact_id: "c1" })]),
    getWaContact: () =>
      Promise.resolve({
        wa_id_e164: "919900000101",
        last_inbound_at: null,
        utility_opt_in: false,
        stopped_at: "2026-10-01T00:00:00Z",
      }),
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(deps.resolved[0]!.outcome, { outcome: "suppressed", error: "contact replied STOP" });
});

Deno.test("dispatchHandler: a test-block WhatsApp number is refused, even in mock mode", async () => {
  let sendCalled = false;
  const deps = fakeDeps({
    claimDue: () =>
      Promise.resolve([row({ id: "w1", channel: "whatsapp_session", contact_id: "c1" })]),
    getWaContact: () =>
      Promise.resolve({
        wa_id_e164: "+919900000318", // Rohan's fixture number, inside the test block
        last_inbound_at: new Date().toISOString(),
        utility_opt_in: true,
        stopped_at: null,
      }),
    sendWhatsApp: () => {
      sendCalled = true;
      return Promise.resolve({ ok: true, providerMessageId: "wamid.1", mock: true });
    },
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(sendCalled, false);
  assertEquals(deps.resolved[0]!.outcome, {
    outcome: "suppressed",
    error: "refused: test block number (+91 99000 003NN)",
  });
});

Deno.test("dispatchHandler: a failed send is scheduled for retry with backoff, not marked failed at attempt 0", async () => {
  const deps = fakeDeps({
    claimDue: () => Promise.resolve([row({ id: "e1", channel: "email", attempts: 0 })]),
    sendEmail: () => Promise.resolve({ ok: false, providerMessageId: "" }),
  });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  const outcome = deps.resolved[0]!.outcome;
  assertEquals(outcome.outcome, "failed");
  if (outcome.outcome === "failed") {
    assertEquals(outcome.notBefore.getTime() > deps.now().getTime(), true);
  }
});

Deno.test("sms is not built in R1: suppressed, never reaches an adapter", async () => {
  const deps = fakeDeps({ claimDue: () => Promise.resolve([row({ id: "s1", channel: "sms" })]) });
  await dispatchHandler(deps)(fakeRequest("outbox-dispatch", { method: "POST" }), {} as never);
  assertEquals(deps.resolved[0]!.outcome, {
    outcome: "suppressed",
    error: "channel sms is not built in R1",
  });
});
