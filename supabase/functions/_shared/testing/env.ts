// Test environments. Values are placeholders, never real keys (AGENTS.md §6).

import type { CoreEnv, EnvSource } from "../core/env.ts";
import { envFromRecord, readCoreEnv } from "../core/env.ts";

export const TEST_SUPABASE_URL = "http://supabase.test";
export const TEST_PUBLISHABLE_KEY = "test-publishable-key";
export const TEST_SECRET_KEY = "test-secret-key";

/** The variables a test function sees by default: PLINTH_ENV=test, recorded AI, mock Meta. */
export const TEST_VARS: Readonly<Record<string, string>> = {
  PLINTH_ENV: "test",
  AI_MODE: "recorded",
  META_MODE: "mock",
  SUPABASE_URL: TEST_SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: TEST_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: TEST_SECRET_KEY,
  PLINTH_HASH_SALT: "test-hash-salt",
};

/** An EnvSource over TEST_VARS plus overrides; an override of undefined removes a variable. */
export function testEnvSource(overrides: Record<string, string | undefined> = {}): EnvSource {
  return envFromRecord({ ...TEST_VARS, ...overrides });
}

/** readCoreEnv over testEnvSource(overrides). */
export function testEnv(overrides: Record<string, string | undefined> = {}): CoreEnv {
  return readCoreEnv(testEnvSource(overrides));
}
