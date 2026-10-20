import { assert, assertEquals, assertThrows, testEnv, testEnvSource } from "../testing/mod.ts";
import {
  EnvError,
  envFromRecord,
  isFrozenEnv,
  need,
  readCoreEnv,
  readEnum,
  readSupabaseConfig,
  readVar,
  requireVar,
  Secret,
} from "./env.ts";

Deno.test("modes default to the side that reaches nobody", () => {
  const env = readCoreEnv(envFromRecord({}));
  assertEquals(env.plinthEnv, "prod");
  assertEquals(env.aiMode, "recorded");
  assertEquals(env.metaMode, "mock");
  assertEquals(env.supabase, { url: null, publishableKey: null, secretKey: null });
  assertEquals(env.dispatchSecret, null);
});

Deno.test("PLINTH_ENV=test refuses live AI and live Meta, naming only the variables", () => {
  const e = assertThrows(() => testEnv({ AI_MODE: "live", META_MODE: "live" }), EnvError);
  assertEquals(e.names, ["AI_MODE", "META_MODE"]);
  assertEquals(testEnv({ PLINTH_ENV: "dev", AI_MODE: "live" }).aiMode, "live");
});

Deno.test("an unknown mode value fails loudly", () => {
  const e = assertThrows(() => readCoreEnv(envFromRecord({ PLINTH_ENV: "prd" })), EnvError);
  assertEquals(e.names, ["PLINTH_ENV"]);
  assertEquals(e.message.includes("prd"), false);
  assertEquals(readEnum(envFromRecord({ X: "b" }), "X", ["a", "b"] as const, "a"), "b");
});

Deno.test("values are trimmed and cleaned of terminal paste markers; blanks are unset", () => {
  const src = envFromRecord({ A: "  value\n", B: "\x1b[200~pasted\x1b[201~", C: "   " });
  assertEquals(readVar(src, "A"), "value");
  assertEquals(readVar(src, "B"), "pasted");
  assertEquals(readVar(src, "C"), undefined);
  assertThrows(() => requireVar(src, "C"), EnvError, "C is not set");
  assertThrows(() => need(null, "SOME_VAR"), EnvError, "SOME_VAR is not set");
});

Deno.test("Supabase keys follow their fallback chains", () => {
  const legacy = readSupabaseConfig(
    envFromRecord({
      SUPABASE_URL: "http://kong:8000/",
      SUPABASE_ANON_KEY: "legacy-anon",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-service",
    }),
  );
  assertEquals(legacy.url, "http://kong:8000");
  assertEquals(legacy.publishableKey, "legacy-anon");
  assertEquals(legacy.secretKey?.reveal(), "legacy-service");

  const listed = readSupabaseConfig(
    envFromRecord({
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ other: "pub-other", default: "pub-default" }),
      SUPABASE_SECRET_KEYS: JSON.stringify({ only: "sec-only" }),
      SUPABASE_ANON_KEY: "legacy-anon",
    }),
  );
  assertEquals(listed.publishableKey, "pub-default");
  assertEquals(listed.secretKey?.reveal(), "sec-only");

  const explicit = readSupabaseConfig(
    testEnvSource({ SUPABASE_PUBLISHABLE_KEYS: "pub-list", SUPABASE_ANON_KEY: "legacy" }),
  );
  assertEquals(explicit.publishableKey, "test-publishable-key");
});

Deno.test("a Secret never prints its value", () => {
  const s = new Secret("very-private-value");
  assertEquals(s.reveal(), "very-private-value");
  assertEquals(String(s), "[redacted]");
  assertEquals(JSON.stringify({ s }), '{"s":"[redacted]"}');
  assertEquals(Deno.inspect(s).includes("very-private"), false);
  assertEquals(JSON.stringify(testEnv()).includes("test-hash-salt"), false);
});

Deno.test("the fixture world is test and fixture only", () => {
  assert(isFrozenEnv("test") && isFrozenEnv("fixture"));
  for (const e of ["local", "dev", "staging", "prod"] as const) assertEquals(isFrozenEnv(e), false);
});
