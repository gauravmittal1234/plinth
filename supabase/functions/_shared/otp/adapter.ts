// The OTP adapter contract and the fallback loop (T41).
//
// An adapter delivers one login code on one channel. It never logs, returns or throws the code or
// the phone number: an OtpSendError carries only the channel, the HTTP status and the provider's
// numeric or short error code. sendWithFallback tries the selected adapters in order and stops at
// the first that accepts the message.

import type { Logger } from "../core/log.ts";
import { errorFields } from "../core/log.ts";

export type OtpChannel = "mock" | "whatsapp" | "msg91";

export interface OtpMessage {
  /** E.164, e.g. "+91…". */
  to: string;
  /** The code Auth generated. */
  code: string;
}

export interface OtpSendResult {
  channel: OtpChannel;
  /** The provider's message or request id (no personal data), when it gives one. */
  providerId: string | null;
}

export interface OtpAdapter {
  readonly channel: OtpChannel;
  send(msg: OtpMessage, log: Logger): Promise<OtpSendResult>;
}

/** A channel could not deliver. The message names the problem, never the number or the code. */
export class OtpSendError extends Error {
  readonly channel: OtpChannel;
  readonly status: number | null;
  readonly providerCode: string | null;
  constructor(
    channel: OtpChannel,
    problem: string,
    opts: { status?: number | null; providerCode?: string | null; cause?: unknown } = {},
  ) {
    super(`${channel}: ${problem}`, { cause: opts.cause });
    this.name = "OtpSendError";
    this.channel = channel;
    this.status = opts.status ?? null;
    this.providerCode = opts.providerCode ?? null;
  }
}

/** Auth gives the whole hook about 5 s, so each provider call gets a short budget. */
export const PROVIDER_TIMEOUT_MS = 2000;

/** POSTs JSON with a timeout. Network failures become an OtpSendError without the body. */
export async function postJson(
  channel: OtpChannel,
  fetchImpl: typeof fetch,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs = PROVIDER_TIMEOUT_MS,
): Promise<{ status: number; json: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = controller.signal.aborted;
    throw new OtpSendError(channel, timedOut ? "timed out" : "network error", {
      cause: timedOut ? undefined : errorFields(err),
    });
  } finally {
    clearTimeout(timer);
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

export interface FallbackResult extends OtpSendResult {
  /** Channels tried, in order, including the one that worked. */
  attempts: OtpChannel[];
}

/** Tries each adapter in order; throws the last OtpSendError when none delivers. */
export async function sendWithFallback(
  adapters: readonly OtpAdapter[],
  msg: OtpMessage,
  log: Logger,
): Promise<FallbackResult> {
  if (adapters.length === 0) throw new OtpSendError("mock", "no channel selected");
  const attempts: OtpChannel[] = [];
  let last: unknown = null;
  for (const adapter of adapters) {
    attempts.push(adapter.channel);
    try {
      const sent = await adapter.send(msg, log);
      return { ...sent, attempts };
    } catch (err) {
      last = err;
      const e = err instanceof OtpSendError ? err : null;
      log.warn("login code channel failed", {
        channel: adapter.channel,
        status: e?.status ?? null,
        provider_code: e?.providerCode ?? null,
        ...(e ? {} : errorFields(err)),
      });
    }
  }
  throw last instanceof OtpSendError
    ? last
    : new OtpSendError(adapters[adapters.length - 1]!.channel, "failed", { cause: last });
}
