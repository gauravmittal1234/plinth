// Mock channel: sends nothing, writes one log line (T41; API_CONTRACTS §5.4).
//
// "Mock mode logs otp only when PLINTH_ENV=local": with `supabase functions serve` a developer
// reads the code from the function log. In every other environment the line says only that a
// code was not sent. The code goes in `local_code` because the logger redacts any field whose
// name contains "otp".

import type { PlinthEnv } from "../core/env.ts";
import type { OtpAdapter, OtpMessage } from "./adapter.ts";
import { maskPhone } from "./rules.ts";

export const MOCK_LOG_MESSAGE = "login code (mock): not sent";

export function mockAdapter(plinthEnv: PlinthEnv): OtpAdapter {
  return {
    channel: "mock",
    send(msg: OtpMessage, log) {
      log.info(
        MOCK_LOG_MESSAGE,
        plinthEnv === "local"
          ? { channel: "mock", to_masked: maskPhone(msg.to), local_code: msg.code }
          : { channel: "mock" },
      );
      return Promise.resolve({ channel: "mock", providerId: null });
    },
  };
}
