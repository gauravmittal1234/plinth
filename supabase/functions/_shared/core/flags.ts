// Feature flags and kill switches at the edge (T29; BUILD_PLAN §10, catalogues/flags.json).
//
//   const flags = flagsReader(rpcFlagsLoader(anonClient(ctx.env.supabase)));
//   await flags.require("ai_ask");            // flag_off (503) when the kill switch is off
//
// Flags come from api.flags() (plinth.flags/1), cached 60 s per isolate like the edge cache.
// An unknown key, or a payload we cannot read, counts as off: the same rule as ops.flag() in SQL.
// In the fixture world the AI kill switches (ai_ask, ai_doc_check, ai_staging) are off until M5,
// so `ask` and `doc-check` answer flag_off there until the M5 gate flips them.
// Build-time modes (AI_MODE, META_MODE) are not flags: see env.ts.

import type { Clock } from "./clock.ts";
import { systemClock } from "./clock.ts";
import { HttpError } from "./errors.ts";
import type { Logger } from "./log.ts";
import { errorFields } from "./log.ts";
import type { RpcClient } from "./supabase.ts";
import { callRpc } from "./supabase.ts";

/** The R1 flag keys, in catalogue order (flags.test.ts keeps this equal to the catalogue). */
export const FLAG_KEYS = [
  "bands_public",
  "harera_live_fetch",
  "ai_ask",
  "ai_doc_check",
  "ai_staging",
  "wa_outbound",
  "wa_inbound",
  "push_outbound",
  "email_outbound",
  "since_replay_slider",
  "family_circle",
  "dev_workspace",
  "visit_booking",
  "broker_layer",
  "buyer_signals",
  "pro_paywall",
  "map_tiles",
  "facts_only_global",
  "maintenance_mode",
] as const;
export type FlagKey = typeof FLAG_KEYS[number];

export type FlagMap = Readonly<Record<string, boolean>>;

/** The flags of a plinth.flags/1 payload. Throws on any other shape. */
export function parseFlags(payload: unknown): FlagMap {
  const p = payload as { schema?: unknown; flags?: unknown } | null;
  if (!p || typeof p !== "object" || p.schema !== "plinth.flags/1") {
    throw new Error("api.flags() did not return plinth.flags/1");
  }
  if (!p.flags || typeof p.flags !== "object" || Array.isArray(p.flags)) {
    throw new Error("plinth.flags/1 has no flags object");
  }
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(p.flags)) {
    if (typeof v !== "boolean") throw new Error(`flag ${k} is not a boolean`);
    out[k] = v;
  }
  return out;
}

export type FlagsLoader = () => Promise<unknown>;

/** Loads api.flags() through a client (anon for public flags, secret for internal ones). */
export function rpcFlagsLoader(client: RpcClient): FlagsLoader {
  return () => callRpc(client, "flags", undefined, { get: true });
}

export interface FlagsReader {
  /** All flags (cached). Empty when they cannot be read. */
  all(): Promise<FlagMap>;
  isOn(key: FlagKey): Promise<boolean>;
  /** Throws flag_off (503) unless the flag is on. */
  require(key: FlagKey, message?: string): Promise<void>;
}

export interface FlagsReaderOptions {
  ttlMs?: number;
  clock?: Clock;
  log?: Logger;
}

export function flagsReader(load: FlagsLoader, opts: FlagsReaderOptions = {}): FlagsReader {
  const ttl = opts.ttlMs ?? 60_000;
  const clock = opts.clock ?? systemClock;
  let cached: { at: number; flags: FlagMap } | null = null;

  const all = async (): Promise<FlagMap> => {
    const now = clock.now().getTime();
    if (cached && now - cached.at < ttl) return cached.flags;
    try {
      const flags = parseFlags(await load());
      cached = { at: now, flags };
      return flags;
    } catch (err) {
      opts.log?.warn("flags unavailable; treating every flag as off", errorFields(err));
      return {};
    }
  };

  const isOn = async (key: FlagKey) => (await all())[key] === true;

  return {
    all,
    isOn,
    async require(key, message) {
      if (!(await isOn(key))) throw new HttpError("flag_off", message);
    },
  };
}
