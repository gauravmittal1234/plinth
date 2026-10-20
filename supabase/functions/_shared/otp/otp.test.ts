// _shared/otp: rules, adapter selection, the WhatsApp body against the template catalogue, the
// MSG91 body, fallback and the mock log. Run: npx --yes deno@2 task test (in supabase/functions).
//
// Numbers: the fixture block from packages/fixtures/canonical/people.json (Rohan …318, Meera
// …319), which every real adapter refuses. Paths that must reach a (fake) provider use
// +910000000001, the repo's placeholder: no Indian number starts with 0 after +91, so it belongs
// to nobody. Codes and secrets are random per run; nothing here can reach the network.

import { Secret } from "../core/env.ts";
import { createLogger } from "../core/log.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
  assertThrows,
  captureLogs,
  fakeFetch,
  frozenClock,
  jsonResponse,
  noNetwork,
  testEnv,
  testEnvSource,
} from "../testing/mod.ts";
import type { OtpAdapter } from "./adapter.ts";
import { OtpSendError, sendWithFallback } from "./adapter.ts";
import { MOCK_LOG_MESSAGE, mockAdapter } from "./mock.ts";
import { DLT_SMS_TEXT, MSG91_FLOW_URL, msg91Adapter, msg91FlowBody } from "./msg91.ts";
import {
  isIndianNumber,
  isOtpCode,
  isTestNumber,
  maskPhone,
  OTP_RATE_LIMITS,
  OTP_RULES,
  toE164,
} from "./rules.ts";
import { readOtpConfig, selectAdapters } from "./select.ts";
import {
  GRAPH_API_VERSION,
  LOGIN_CODE_TEMPLATE,
  loginCodeMessage,
  loginCodeTemplateDefinition,
  whatsappAdapter,
} from "./whatsapp.ts";

const ROHAN = "+919900000318";
const MEERA = "+919900000319";
const PLACEHOLDER = "+910000000001";
const ABROAD = "+10000000001";

function randomCode(): string {
  return String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, "0");
}

const LIVE_VARS = {
  PLINTH_ENV: "dev",
  META_MODE: "live",
  OTP_CHANNELS: "whatsapp,msg91",
  WA_PHONE_NUMBER_ID: "test-phone-id",
  WA_ACCESS_TOKEN: "test-wa-token",
  MSG91_AUTH_KEY: "test-sms-key",
  MSG91_TEMPLATE_ID: "test-sms-template",
};

function quietLog() {
  const logs = captureLogs();
  const log = createLogger({
    fn: "otp-test",
    sink: logs.sink,
    minLevel: "debug",
    clock: frozenClock(),
  });
  return { logs, log };
}

// The template catalogue (packages/contracts, API_CONTRACTS §5.2).
const CATALOGUE = JSON.parse(
  await Deno.readTextFile(
    new URL("../../../../packages/contracts/catalogues/wa_templates.json", import.meta.url),
  ),
) as {
  templates: Array<{
    code: string;
    meta_name: string;
    category: string;
    language: string;
    header: { type: string };
    variables: string[];
    buttons: Array<{ type: string; text: string }>;
  }>;
  interactive_limits: { reply_button_chars_max: number };
};
const LOGIN_CODE_ROW = CATALOGUE.templates.find((t) => t.code === "login_code")!;

// Rules ----------------------------------------------------------------------------------------

Deno.test("OTP rules: 6 digits, 10 minutes, a new code after 30 s, sender PLINTH", () => {
  assertEquals(OTP_RULES, {
    codeLength: 6,
    ttlSeconds: 600,
    resendAfterSeconds: 30,
    smsSender: "PLINTH",
  });
  assertEquals(OTP_RATE_LIMITS.map((r) => [r.bucket, r.limit, r.windowSeconds]), [
    ["otp_phone_hour", 5, 3600],
    ["otp_phone_day", 10, 86400],
  ]);
});

Deno.test("the OTP rules match config.toml [auth.sms]", async () => {
  const toml = await Deno.readTextFile(new URL("../../../config.toml", import.meta.url));
  const sms = toml.slice(toml.indexOf("\n[auth.sms]\n"), toml.indexOf("\n[auth.sms.test_otp]\n"));
  assertStringIncludes(sms, `otp_length = ${OTP_RULES.codeLength}\n`);
  assertStringIncludes(sms, `otp_expiry = ${OTP_RULES.ttlSeconds}\n`);
  assertStringIncludes(sms, `max_frequency = "${OTP_RULES.resendAfterSeconds}s"\n`);
});

Deno.test("config.toml test OTP numbers are the fixture personas with an account, nothing else", async () => {
  const toml = await Deno.readTextFile(new URL("../../../config.toml", import.meta.url));
  const block = toml.slice(toml.indexOf("\n[auth.sms.test_otp]\n") + 1).split("\n\n")[0]!;
  const numbers = [...block.matchAll(/^(\d+) = "\d{6}"/gm)].map((m) => `+${m[1]}`);
  const people = JSON.parse(
    await Deno.readTextFile(
      new URL("../../../../packages/fixtures/canonical/people.json", import.meta.url),
    ),
  ) as { people: Array<{ account: boolean; test_phone_e164: string | null }> };
  const expected = people.people
    .filter((p) => p.account && p.test_phone_e164)
    .map((p) => p.test_phone_e164!);
  assertEquals(numbers.sort(), expected.sort());
  assert(numbers.every(isTestNumber), "every test OTP number is in the +91 99000 003NN block");
});

Deno.test("toE164 takes Auth's digits-only phone and refuses anything else", () => {
  assertEquals(toE164("919900000318"), ROHAN);
  assertEquals(toE164("+919900000318"), ROHAN);
  assertEquals(toE164(" 91 99000 00318 "), ROHAN);
  assertEquals(toE164(""), null);
  assertEquals(toE164("0919900000318"), null);
  assertEquals(toE164("91990000031x"), null);
  assertEquals(toE164("1234567"), null);
});

Deno.test("the fixture block +91 99000 003NN is recognised, and only it", () => {
  assert(isTestNumber(ROHAN) && isTestNumber(MEERA) && isTestNumber("+919900000300"));
  assertFalse(isTestNumber(PLACEHOLDER));
  assertFalse(isTestNumber("+919900000418"));
  assertFalse(isTestNumber("+9199000003180"));
  assert(isIndianNumber(ROHAN) && isIndianNumber(PLACEHOLDER));
  assertFalse(isIndianNumber(ABROAD));
  assert(isOtpCode("042117") && !isOtpCode("12ab56") && !isOtpCode(""));
  assertEquals(maskPhone(ROHAN), "+91 99••• ••318");
});

// Adapter selection ------------------------------------------------------------------------------

Deno.test("selection: mock by default (no OTP_CHANNELS, META_MODE mock)", () => {
  const sel = selectAdapters(testEnv(), readOtpConfig(testEnvSource()), PLACEHOLDER);
  assert(sel.ok);
  assertEquals(sel.mode, "mock");
  assertEquals(sel.adapters.map((a) => a.channel), ["mock"]);
});

Deno.test("selection: OTP_CHANNELS alone stays mock while META_MODE is mock", () => {
  const src = testEnvSource({ ...LIVE_VARS, META_MODE: "mock" });
  const sel = selectAdapters(
    testEnv({ ...LIVE_VARS, META_MODE: "mock" }),
    readOtpConfig(src),
    PLACEHOLDER,
  );
  assert(sel.ok);
  assertEquals(sel.adapters.map((a) => a.channel), ["mock"]);
});

Deno.test("selection: META_MODE live alone stays mock (no OTP_CHANNELS)", () => {
  const vars = { ...LIVE_VARS, OTP_CHANNELS: undefined };
  const sel = selectAdapters(testEnv(vars), readOtpConfig(testEnvSource(vars)), PLACEHOLDER);
  assert(sel.ok);
  assertEquals(sel.adapters.map((a) => a.channel), ["mock"]);
});

Deno.test("selection: live picks the channels in OTP_CHANNELS order", () => {
  const env = testEnv(LIVE_VARS);
  const both = selectAdapters(env, readOtpConfig(testEnvSource(LIVE_VARS)), PLACEHOLDER);
  assert(both.ok);
  assertEquals(both.mode, "live");
  assertEquals(both.adapters.map((a) => a.channel), ["whatsapp", "msg91"]);

  const vars = { ...LIVE_VARS, OTP_CHANNELS: "msg91, whatsapp, msg91" };
  const swapped = selectAdapters(env, readOtpConfig(testEnvSource(vars)), PLACEHOLDER);
  assert(swapped.ok);
  assertEquals(swapped.adapters.map((a) => a.channel), ["msg91", "whatsapp"]);
});

Deno.test("selection: SMS is skipped for a number outside India; no channel left is a refusal", () => {
  const env = testEnv(LIVE_VARS);
  const both = selectAdapters(env, readOtpConfig(testEnvSource(LIVE_VARS)), ABROAD);
  assert(both.ok);
  assertEquals(both.adapters.map((a) => a.channel), ["whatsapp"]);

  const vars = { ...LIVE_VARS, OTP_CHANNELS: "msg91" };
  assertEquals(selectAdapters(env, readOtpConfig(testEnvSource(vars)), ABROAD), {
    ok: false,
    refusal: "no_channel",
  });
});

Deno.test("selection: fixture test numbers never reach a real channel (mock outside prod, refused in prod)", () => {
  const cfg = readOtpConfig(testEnvSource(LIVE_VARS));
  const dev = selectAdapters(testEnv(LIVE_VARS), cfg, ROHAN);
  assert(dev.ok);
  assertEquals(dev.mode, "test_number");
  assertEquals(dev.adapters.map((a) => a.channel), ["mock"]);

  const prod = selectAdapters(testEnv({ ...LIVE_VARS, PLINTH_ENV: "prod" }), cfg, MEERA);
  assertEquals(prod, { ok: false, refusal: "test_number" });
});

Deno.test("selection: a named channel without its keys is a configuration error naming the variables", () => {
  const vars = { ...LIVE_VARS, WA_ACCESS_TOKEN: undefined, MSG91_TEMPLATE_ID: undefined };
  const cfg = readOtpConfig(testEnvSource(vars));
  const err = assertThrows(() => selectAdapters(testEnv(vars), cfg, PLACEHOLDER));
  assertStringIncludes(String(err), "WA_ACCESS_TOKEN");
  assertFalse(String(err).includes("test-"), "the error names variables, never values");

  const sms = { ...vars, OTP_CHANNELS: "msg91" };
  const smsErr = assertThrows(() =>
    selectAdapters(testEnv(sms), readOtpConfig(testEnvSource(sms)), PLACEHOLDER)
  );
  assertStringIncludes(String(smsErr), "MSG91_TEMPLATE_ID");
});

Deno.test("selection: OTP_CHANNELS accepts only whatsapp, msg91 and mock", () => {
  assertThrows(() => readOtpConfig(testEnvSource({ OTP_CHANNELS: "whatsapp,sms" })));
  assertEquals(readOtpConfig(testEnvSource({ OTP_CHANNELS: "mock" })).channels, []);
  assertEquals(readOtpConfig(testEnvSource({ OTP_CHANNELS: " WhatsApp " })).channels, [
    "whatsapp",
  ]);
});

Deno.test("selection: PLINTH_ENV=test can never select a real channel", () => {
  assertThrows(() => testEnv({ ...LIVE_VARS, PLINTH_ENV: "test" }));
});

// WhatsApp -----------------------------------------------------------------------------------------

Deno.test("WhatsApp: LOGIN_CODE_TEMPLATE matches the login_code row of the template catalogue", () => {
  assertEquals(LOGIN_CODE_ROW.meta_name, LOGIN_CODE_TEMPLATE.metaName);
  assertEquals(LOGIN_CODE_ROW.category, LOGIN_CODE_TEMPLATE.category);
  assertEquals(LOGIN_CODE_ROW.language, LOGIN_CODE_TEMPLATE.language);
  assertEquals(LOGIN_CODE_ROW.header, { type: "none" });
  assertEquals(LOGIN_CODE_ROW.variables, [...LOGIN_CODE_TEMPLATE.variables]);
  assertEquals(LOGIN_CODE_ROW.buttons, LOGIN_CODE_TEMPLATE.buttons.map((b) => ({ ...b })));
});

Deno.test("WhatsApp: the send body is the catalogue's template (name, language, one variable, copy-code button)", () => {
  const code = randomCode();
  const body = loginCodeMessage(ROHAN, code);
  assertEquals<unknown>(body, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "919900000318",
    type: "template",
    template: {
      name: LOGIN_CODE_ROW.meta_name,
      language: { code: LOGIN_CODE_ROW.language },
      components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ],
    },
  });
  const bodyParams = body.template.components.filter((c) => c.type === "body")
    .flatMap((c) => c.parameters);
  assertEquals(bodyParams.length, LOGIN_CODE_ROW.variables.length, "one parameter per variable");
  const buttons = body.template.components.filter((c) => c.type === "button");
  assertEquals(buttons.length, LOGIN_CODE_ROW.buttons.length, "one parameter set per button");
  assertFalse("header" in body.template, "the catalogue has no header");
});

Deno.test("WhatsApp: the template definition for Meta carries 10 minutes and the catalogue's button", () => {
  const def = loginCodeTemplateDefinition();
  assertEquals(def.name, LOGIN_CODE_ROW.meta_name);
  assertEquals(def.category, "AUTHENTICATION");
  assertEquals(def.language, LOGIN_CODE_ROW.language);
  assertEquals(def.message_send_ttl_seconds, 600);
  assertEquals(def.components[1], { type: "FOOTER", code_expiration_minutes: 10 });
  const button = def.components[2] as { buttons: Array<{ otp_type: string; text: string }> };
  assertEquals(button.buttons.length, LOGIN_CODE_ROW.buttons.length);
  assertEquals(button.buttons[0]!.otp_type, "COPY_CODE");
  assertEquals(button.buttons[0]!.text, LOGIN_CODE_ROW.buttons[0]!.text);
  assert(button.buttons[0]!.text.length <= CATALOGUE.interactive_limits.reply_button_chars_max);
});

Deno.test("WhatsApp adapter: POSTs the body to the Graph API with the bearer token", async () => {
  const code = randomCode();
  const ff = fakeFetch(() => jsonResponse({ messages: [{ id: "wamid.TEST1" }] }));
  const wa = whatsappAdapter({
    phoneNumberId: "test-phone-id",
    accessToken: new Secret("test-wa-token"),
    fetch: ff.fetch,
  });
  const { log } = quietLog();
  assertEquals(await wa.send({ to: PLACEHOLDER, code }, log), {
    channel: "whatsapp",
    providerId: "wamid.TEST1",
  });
  assertEquals(ff.calls.length, 1);
  const call = ff.calls[0]!;
  assertEquals(call.method, "POST");
  assertEquals(
    call.url.href,
    `https://graph.facebook.com/${GRAPH_API_VERSION}/test-phone-id/messages`,
  );
  assertEquals(call.headers.get("authorization"), "Bearer test-wa-token");
  assertEquals(JSON.parse(call.body!), loginCodeMessage(PLACEHOLDER, code));
});

Deno.test("WhatsApp adapter: a Graph error is an OtpSendError with the status and code, never the body", async () => {
  const code = randomCode();
  const ff = fakeFetch(() =>
    jsonResponse({ error: { code: 131026, message: `undeliverable to ${PLACEHOLDER}` } }, 400)
  );
  const wa = whatsappAdapter({
    phoneNumberId: "test-phone-id",
    accessToken: new Secret("test-wa-token"),
    fetch: ff.fetch,
  });
  const err = await assertRejects(
    () => wa.send({ to: PLACEHOLDER, code }, quietLog().log),
    OtpSendError,
  );
  assertEquals([err.status, err.providerCode], [400, "131026"]);
  assertFalse(err.message.includes(PLACEHOLDER.slice(1)) || err.message.includes(code));
});

Deno.test("WhatsApp and MSG91 adapters refuse the fixture block before any fetch", async () => {
  const ff = fakeFetch(noNetwork);
  const wa = whatsappAdapter({
    phoneNumberId: "test-phone-id",
    accessToken: new Secret("test-wa-token"),
    fetch: ff.fetch,
  });
  const sms = msg91Adapter({
    authKey: new Secret("test-sms-key"),
    templateId: "test-sms-template",
    fetch: ff.fetch,
  });
  for (const adapter of [wa, sms]) {
    const err = await assertRejects(
      () => adapter.send({ to: ROHAN, code: randomCode() }, quietLog().log),
      OtpSendError,
    );
    assertStringIncludes(err.message, "test number refused");
  }
  assertEquals(ff.calls.length, 0);
});

// MSG91 ------------------------------------------------------------------------------------------------

Deno.test("MSG91: the Flow body carries the template id, the number without + and the code", () => {
  const code = randomCode();
  assertEquals(msg91FlowBody("test-sms-template", PLACEHOLDER, code), {
    template_id: "test-sms-template",
    short_url: "0",
    recipients: [{ mobiles: "910000000001", otp: code }],
  });
  assertStringIncludes(DLT_SMS_TEXT, "10 minutes");
  assert(DLT_SMS_TEXT.endsWith("-PLINTH"), "the DLT text is signed with the sender PLINTH");
});

Deno.test("MSG91 adapter: success is type=success; type=error on HTTP 200 is a failure", async () => {
  const code = randomCode();
  let answer: unknown = { type: "success", message: "req-test-1" };
  const ff = fakeFetch(() => jsonResponse(answer));
  const sms = msg91Adapter({
    authKey: new Secret("test-sms-key"),
    templateId: "test-sms-template",
    fetch: ff.fetch,
  });
  assertEquals(await sms.send({ to: PLACEHOLDER, code }, quietLog().log), {
    channel: "msg91",
    providerId: "req-test-1",
  });
  const call = ff.calls[0]!;
  assertEquals(call.url.href, MSG91_FLOW_URL);
  assertEquals(call.headers.get("authkey"), "test-sms-key");
  assertEquals(JSON.parse(call.body!), msg91FlowBody("test-sms-template", PLACEHOLDER, code));

  answer = { type: "error", message: "Invalid template" };
  const err = await assertRejects(
    () => sms.send({ to: PLACEHOLDER, code }, quietLog().log),
    OtpSendError,
  );
  assertEquals(err.providerCode, "error");
  await assertRejects(
    () => sms.send({ to: ABROAD, code }, quietLog().log),
    OtpSendError,
    "+91 only",
  );
});

// Fallback and mock ----------------------------------------------------------------------------------

Deno.test("fallback: WhatsApp fails, SMS delivers; the log names channels only", async () => {
  const code = randomCode();
  const ff = fakeFetch((call) =>
    call.url.hostname === "graph.facebook.com"
      ? jsonResponse({ error: { code: 131047 } }, 500)
      : jsonResponse({ type: "success", message: "req-test-2" })
  );
  const sel = selectAdapters(
    testEnv(LIVE_VARS),
    readOtpConfig(testEnvSource(LIVE_VARS)),
    PLACEHOLDER,
    {
      fetch: ff.fetch,
    },
  );
  assert(sel.ok);
  const { logs, log } = quietLog();
  const sent = await sendWithFallback(sel.adapters, { to: PLACEHOLDER, code }, log);
  assertEquals(sent, {
    channel: "msg91",
    providerId: "req-test-2",
    attempts: ["whatsapp", "msg91"],
  });
  const warn = logs.find("login code channel failed");
  assertEquals([warn?.channel, warn?.status, warn?.provider_code], ["whatsapp", 500, "131047"]);
  assertFalse(logs.text().includes(code));
  assertFalse(logs.text().includes(PLACEHOLDER.slice(1)));
});

Deno.test("fallback: every channel failing throws the last OtpSendError", async () => {
  const failing = (channel: "whatsapp" | "msg91"): OtpAdapter => ({
    channel,
    send: () => Promise.reject(new OtpSendError(channel, "down", { status: 503 })),
  });
  const err = await assertRejects(
    () =>
      sendWithFallback([failing("whatsapp"), failing("msg91")], {
        to: PLACEHOLDER,
        code: randomCode(),
      }, quietLog().log),
    OtpSendError,
  );
  assertEquals(err.channel, "msg91");
});

Deno.test("mock: logs the code only when PLINTH_ENV=local", async () => {
  const code = randomCode();
  for (const env of ["local", "test", "dev", "prod"] as const) {
    const { logs, log } = quietLog();
    await mockAdapter(env).send({ to: ROHAN, code }, log);
    const line = logs.find(MOCK_LOG_MESSAGE);
    assertEquals(line?.channel, "mock");
    if (env === "local") {
      assertEquals(line?.local_code, code);
      assertEquals(line?.to_masked, "+91 99••• ••318");
    } else {
      assertFalse(logs.text().includes(code), `no code in the ${env} log`);
      assertFalse(logs.text().includes("318"), `no number in the ${env} log`);
    }
  }
});
