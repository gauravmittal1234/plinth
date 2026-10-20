// AI gateway configuration (T63; BUILD_PLAN §13–§14, DECISIONS E-8, FOUNDER_QUESTIONS M3-3).
//
// Variables (names only; values live in supabase/functions/.env or the platform's secrets):
//   AI_MODE           recorded | live   default recorded. PLINTH_ENV=test refuses live (core env.ts)
//   AI_PROVIDER_TIER  free | paid       default free: only the fictional sample documents listed in
//                                       the fixture manifest may reach a model. `paid` lifts that
//                                       once the founder's paid key (or Vertex, Mumbai) and DPA exist
//   GEMINI_API_KEY    secret            needed for live calls only; sent as a header, never a URL
//   PLINTH_HASH_SALT  secret            keys the PII vault's account hashes (shared with core)

import type { AiMode, EnvSource, PlinthEnv, Secret } from "../core/env.ts";
import { processEnv, readCoreEnv, readEnum, readSecret } from "../core/env.ts";

export const AI_TIERS = ["free", "paid"] as const;
export type AiTier = typeof AI_TIERS[number];

export interface AiEnv {
  plinthEnv: PlinthEnv;
  mode: AiMode;
  tier: AiTier;
  geminiKey: Secret | null;
  hashSalt: Secret | null;
}

/** Reads the AI variables. Throws EnvError for AI_MODE=live under PLINTH_ENV=test. */
export function readAiEnv(src: EnvSource = processEnv): AiEnv {
  const core = readCoreEnv(src);
  return {
    plinthEnv: core.plinthEnv,
    mode: core.aiMode,
    tier: readEnum(src, "AI_PROVIDER_TIER", AI_TIERS, "free"),
    geminiKey: readSecret(src, "GEMINI_API_KEY"),
    hashSalt: core.hashSalt,
  };
}
