// Environment loader for the edge functions (T29; BUILD_PLAN §9, .env.example).
//
// Read once per isolate with readCoreEnv(); a function reads its own extra variables with
// readVar / requireVar / readSecret. Errors name variables, never values. Secrets are wrapped in
// Secret, which prints as "[redacted]" in logs, JSON and Deno.inspect.
//
// Modes (not feature flags, BUILD_PLAN §10) default to the side that cannot reach anyone:
//   PLINTH_ENV  local | test | fixture | dev | staging | prod   default prod (strictest logging)
//   AI_MODE     recorded | live                                 default recorded (no model calls)
//   META_MODE   mock | live                                     default mock (nothing is sent)
// PLINTH_ENV=test refuses AI_MODE=live and META_MODE=live, so CI can never call a real provider.
//
// Supabase keys: the platform injects SUPABASE_URL and its keys into every function. Names vary by
// key generation, so each key has a fallback chain (first non-empty wins):
//   publishable  SUPABASE_PUBLISHABLE_KEY → SUPABASE_PUBLISHABLE_KEYS → SUPABASE_ANON_KEY
//   secret       SUPABASE_SECRET_KEY → SUPABASE_SECRET_KEYS → SUPABASE_SERVICE_ROLE_KEY
// The *_KEYS variables may hold a JSON object of named keys; "default" (else the first) is used.

export const PLINTH_ENVS = ["local", "test", "fixture", "dev", "staging", "prod"] as const;
export type PlinthEnv = typeof PLINTH_ENVS[number];
export const AI_MODES = ["recorded", "live"] as const;
export type AiMode = typeof AI_MODES[number];
export const META_MODES = ["mock", "live"] as const;
export type MetaMode = typeof META_MODES[number];

/** Where variables come from: Deno.env in a function, a plain record in tests. */
export interface EnvSource {
  get(name: string): string | undefined;
}

export const processEnv: EnvSource = { get: (name) => Deno.env.get(name) };

export function envFromRecord(vars: Readonly<Record<string, string | undefined>>): EnvSource {
  return { get: (name) => vars[name] };
}

/** A configuration problem. The message lists variable names only, never values. */
export class EnvError extends Error {
  readonly names: readonly string[];
  constructor(names: readonly string[], problem: string) {
    super(`${names.join(", ")} ${problem}`);
    this.name = "EnvError";
    this.names = names;
  }
}

const REDACTED = "[redacted]";

/** A secret value. Only reveal() returns it; every printing path shows "[redacted]". */
export class Secret {
  readonly #value: string;
  constructor(value: string) {
    this.#value = value;
  }
  reveal(): string {
    return this.#value;
  }
  toString(): string {
    return REDACTED;
  }
  toJSON(): string {
    return REDACTED;
  }
  [Symbol.for("Deno.customInspect")](): string {
    return REDACTED;
  }
}

/**
 * A variable's value, trimmed, or undefined when unset or blank. Terminal paste markers and
 * control characters are dropped: a key pasted into `supabase secrets set` can carry them, and a
 * header cannot (pet_app early-access lesson).
 */
export function readVar(src: EnvSource, name: string): string | undefined {
  const raw = src.get(name);
  if (raw === undefined) return undefined;
  // deno-lint-ignore no-control-regex
  const clean = raw.replace(/\x1b?\[20[01]~/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim();
  return clean === "" ? undefined : clean;
}

export function requireVar(src: EnvSource, name: string): string {
  const v = readVar(src, name);
  if (v === undefined) throw new EnvError([name], "is not set");
  return v;
}

export function readSecret(src: EnvSource, name: string): Secret | null {
  const v = readVar(src, name);
  return v === undefined ? null : new Secret(v);
}

export function readEnum<const T extends string>(
  src: EnvSource,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const v = readVar(src, name);
  if (v === undefined) return fallback;
  if ((allowed as readonly string[]).includes(v)) return v as T;
  throw new EnvError([name], `must be one of ${allowed.join(" | ")}`);
}

/** The value, or an EnvError naming the variable. For values read as nullable. */
export function need<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) throw new EnvError([name], "is not set");
  return value;
}

export interface SupabaseConfig {
  url: string | null;
  /** Public by design (BUILD_PLAN §9), so not wrapped. */
  publishableKey: string | null;
  secretKey: Secret | null;
}

export interface CoreEnv {
  plinthEnv: PlinthEnv;
  aiMode: AiMode;
  metaMode: MetaMode;
  /** NEXT_PUBLIC_SITE_URL: the web origin, for CORS and links. */
  siteUrl: string | null;
  supabase: SupabaseConfig;
  /** PLINTH_DISPATCH_SECRET: pg_cron / pg_net → edge (outbox-dispatch, retention-sweep). */
  dispatchSecret: Secret | null;
  /** PLINTH_HASH_SALT: keys the pseudonyms in rate-limit rows and logs (user_hash). */
  hashSalt: Secret | null;
}

/** First key in a *_KEYS variable: a JSON object ("default" first), a JSON array, or a plain key. */
function firstKey(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  if (!raw.startsWith("{") && !raw.startsWith("[")) return raw.split(",")[0]?.trim() || undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    const values = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
      ? [(parsed as Record<string, unknown>).default, ...Object.values(parsed)]
      : [];
    const hit = values.find((v): v is string => typeof v === "string" && v.trim() !== "");
    return hit?.trim();
  } catch {
    return undefined;
  }
}

function firstOf(src: EnvSource, single: string, list: string, legacy: string): string | undefined {
  return readVar(src, single) ?? firstKey(readVar(src, list)) ?? readVar(src, legacy);
}

export function readSupabaseConfig(src: EnvSource = processEnv): SupabaseConfig {
  const publishable = firstOf(
    src,
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_ANON_KEY",
  );
  const secret = firstOf(
    src,
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  return {
    url: readVar(src, "SUPABASE_URL")?.replace(/\/+$/, "") ?? null,
    publishableKey: publishable ?? null,
    secretKey: secret === undefined ? null : new Secret(secret),
  };
}

export function readCoreEnv(src: EnvSource = processEnv): CoreEnv {
  const plinthEnv = readEnum(src, "PLINTH_ENV", PLINTH_ENVS, "prod");
  const aiMode = readEnum(src, "AI_MODE", AI_MODES, "recorded");
  const metaMode = readEnum(src, "META_MODE", META_MODES, "mock");
  if (plinthEnv === "test") {
    const live = [
      ...(aiMode === "live" ? ["AI_MODE"] : []),
      ...(metaMode === "live" ? ["META_MODE"] : []),
    ];
    if (live.length) throw new EnvError(live, "cannot be live when PLINTH_ENV=test");
  }
  return {
    plinthEnv,
    aiMode,
    metaMode,
    siteUrl: readVar(src, "NEXT_PUBLIC_SITE_URL")?.replace(/\/+$/, "") ?? null,
    supabase: readSupabaseConfig(src),
    dispatchSecret: readSecret(src, "PLINTH_DISPATCH_SECRET"),
    hashSalt: readSecret(src, "PLINTH_HASH_SALT"),
  };
}

/** The fixture world: frozen clock and fixture-only behaviour (as ops.is_frozen_env() in SQL). */
export function isFrozenEnv(env: PlinthEnv): boolean {
  return env === "test" || env === "fixture";
}

/** Environments where debug logs are on. */
export function isDevEnv(env: PlinthEnv): boolean {
  return env === "local" || env === "test";
}
