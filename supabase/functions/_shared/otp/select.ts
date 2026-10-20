// Adapter selection (T41). Every real channel is off by default.
//
// A real channel is used only when all of these hold:
//   1. META_MODE=live: the outbound master switch (.env.example: "stays mock until the founder
//      says go"); PLINTH_ENV=test refuses it, so CI never selects a real channel;
//   2. it is named in OTP_CHANNELS, an ordered list: "whatsapp", "msg91" or "whatsapp,msg91"
//      (WhatsApp first, SMS fallback: API_CONTRACTS §5.4). Unset or "mock" = mock;
//   3. its variables are set (names only below). A named channel with a missing variable is a
//      configuration error, never a silent fallback;
//   4. the number is not in the fixture test block, and for msg91 it is a +91 number.
// Otherwise the mock channel answers (it logs, sends nothing).
//
// Fixture test numbers (+91 99000 003NN) are never sent anywhere: outside prod they go to the
// mock channel; in prod they are refused (refusal "test_number").
//
//   whatsapp  WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN
//   msg91     MSG91_AUTH_KEY, MSG91_TEMPLATE_ID

import type { CoreEnv, EnvSource, Secret } from "../core/env.ts";
import { EnvError, processEnv, readSecret, readVar } from "../core/env.ts";
import type { OtpAdapter } from "./adapter.ts";
import { mockAdapter } from "./mock.ts";
import { msg91Adapter } from "./msg91.ts";
import { isIndianNumber, isTestNumber } from "./rules.ts";
import { whatsappAdapter } from "./whatsapp.ts";

export const REAL_CHANNELS = ["whatsapp", "msg91"] as const;
export type RealChannel = typeof REAL_CHANNELS[number];

export interface OtpConfig {
  /** OTP_CHANNELS, in order. Empty = mock only. */
  channels: readonly RealChannel[];
  whatsapp: { phoneNumberId: string | null; accessToken: Secret | null };
  msg91: { authKey: Secret | null; templateId: string | null };
}

export function readOtpConfig(src: EnvSource = processEnv): OtpConfig {
  const raw = readVar(src, "OTP_CHANNELS") ?? "";
  const names = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const channels: RealChannel[] = [];
  for (const name of names) {
    if (name === "mock") continue;
    if (!(REAL_CHANNELS as readonly string[]).includes(name)) {
      throw new EnvError(["OTP_CHANNELS"], "must list whatsapp and/or msg91 (or mock)");
    }
    if (!channels.includes(name as RealChannel)) channels.push(name as RealChannel);
  }
  return {
    channels,
    whatsapp: {
      phoneNumberId: readVar(src, "WA_PHONE_NUMBER_ID") ?? null,
      accessToken: readSecret(src, "WA_ACCESS_TOKEN"),
    },
    msg91: {
      authKey: readSecret(src, "MSG91_AUTH_KEY"),
      templateId: readVar(src, "MSG91_TEMPLATE_ID") ?? null,
    },
  };
}

export type SelectionMode = "mock" | "live" | "test_number";

export type Selection =
  | { ok: true; mode: SelectionMode; adapters: OtpAdapter[] }
  | { ok: false; refusal: "test_number" | "no_channel" };

export interface SelectOptions {
  /** Provider calls; tests pass a fake. */
  fetch?: typeof fetch;
  timeoutMs?: number;
}

function missing(names: Array<[string, unknown]>): string[] {
  return names.filter(([, v]) => v === null || v === undefined).map(([n]) => n);
}

/** The adapters for one number, in the order to try them. */
export function selectAdapters(
  env: CoreEnv,
  cfg: OtpConfig,
  to: string,
  opts: SelectOptions = {},
): Selection {
  const mock = (mode: SelectionMode): Selection => ({
    ok: true,
    mode,
    adapters: [mockAdapter(env.plinthEnv)],
  });

  if (isTestNumber(to)) {
    return env.plinthEnv === "prod" ? { ok: false, refusal: "test_number" } : mock("test_number");
  }
  if (env.metaMode !== "live" || cfg.channels.length === 0) return mock("mock");

  const adapters: OtpAdapter[] = [];
  for (const channel of cfg.channels) {
    if (channel === "whatsapp") {
      const { phoneNumberId, accessToken } = cfg.whatsapp;
      const gaps = missing([["WA_PHONE_NUMBER_ID", phoneNumberId], [
        "WA_ACCESS_TOKEN",
        accessToken,
      ]]);
      if (gaps.length) throw new EnvError(gaps, "must be set when OTP_CHANNELS has whatsapp");
      adapters.push(whatsappAdapter({
        phoneNumberId: phoneNumberId!,
        accessToken: accessToken!,
        fetch: opts.fetch,
        timeoutMs: opts.timeoutMs,
      }));
    } else {
      const { authKey, templateId } = cfg.msg91;
      const gaps = missing([["MSG91_AUTH_KEY", authKey], ["MSG91_TEMPLATE_ID", templateId]]);
      if (gaps.length) throw new EnvError(gaps, "must be set when OTP_CHANNELS has msg91");
      if (!isIndianNumber(to)) continue;
      adapters.push(msg91Adapter({
        authKey: authKey!,
        templateId: templateId!,
        fetch: opts.fetch,
        timeoutMs: opts.timeoutMs,
      }));
    }
  }
  return adapters.length
    ? { ok: true, mode: "live", adapters }
    : { ok: false, refusal: "no_channel" };
}
