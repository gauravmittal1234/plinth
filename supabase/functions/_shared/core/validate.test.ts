import { assertEquals, assertRejects, assertThrows, fakeRequest } from "../testing/mod.ts";
import { EXPORTED_TYPES, VALIDATORS } from "./contracts.ts";
import type { AskRequest } from "./contracts.ts";
import { HttpError } from "./errors.ts";
import { check, checkContract, compileSchema, parseBody, parseBodyWith } from "./validate.ts";

const EXAMPLES = new URL("../../../../packages/contracts/examples/", import.meta.url);
const example = async (path: string) =>
  JSON.parse(await Deno.readTextFile(new URL(path, EXAMPLES)));

Deno.test("every contract type has a validator at the edge", () => {
  assertEquals(EXPORTED_TYPES.length > 30, true);
  for (const name of EXPORTED_TYPES) assertEquals(typeof VALIDATORS[name], "function", name);
});

Deno.test("parseBody accepts the contract's valid AskRequest example, typed", async () => {
  const valid = await example("ask_request/valid/aurelia-hinglish-voice.json");
  const ask: AskRequest = await parseBody(fakeRequest("ask", { json: valid }), "AskRequest");
  assertEquals(ask.channel, "app");
  assertEquals(ask.slug, "aurelia-heights-phase-2");
});

Deno.test("parseBody refuses the invalid example as invalid_input naming the path", async () => {
  const invalid = await example("ask_request/invalid/empty-question.json");
  const base = await example(`ask_request/valid/${invalid.base}`);
  const body = { ...base, question: "" };
  const e = await assertRejects(
    () => parseBody(fakeRequest("ask", { json: body }), "AskRequest"),
    HttpError,
  );
  assertEquals([e.code, e.status], ["invalid_input", 422]);
  assertEquals(e.message.startsWith(`Check ${invalid.expect} `), true, e.message);
  const extra = await assertRejects(
    () => parseBody(fakeRequest("ask", { json: { ...base, injected: true } }), "AskRequest"),
    HttpError,
  );
  assertEquals(extra.code, "invalid_input");
});

Deno.test("checkContract validates payloads too (the fixture world's flags)", async () => {
  const flags = await example("flags/valid/fixture-world-bands-public.json");
  assertEquals(checkContract("Flags", flags).flags.ai_ask, false);
  assertThrows(
    () => checkContract("Flags", { schema: "plinth.flags/1", flags: { ai_ask: "no" } }),
    HttpError,
  );
});

Deno.test("edge-local schemas compile with ajv (2020-12, strict, formats) and are cached", async () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["user", "sms"],
    properties: {
      user: {
        type: "object",
        required: ["phone"],
        properties: { phone: { type: "string", pattern: "^\\d{10,15}$" } },
      },
      sms: {
        type: "object",
        required: ["otp"],
        properties: { otp: { type: "string", pattern: "^\\d{6}$" } },
      },
      sent_at: { type: "string", format: "date-time" },
    },
  };
  const v = await compileSchema(schema);
  assertEquals(await compileSchema(schema), v);
  const ok = {
    user: { phone: "910000000001" },
    sms: { otp: "000000" },
    sent_at: "2026-10-18T12:00:00+05:30",
  };
  assertEquals(check(v, ok), ok);
  assertThrows(() => check(v, { ...ok, sent_at: "yesterday" }), HttpError, "/sent_at");
  const req = fakeRequest("auth-sms-hook", { json: { user: {}, sms: { otp: "000000" } } });
  await assertRejects(() => parseBodyWith(req, v), HttpError, "Check /user");
});
