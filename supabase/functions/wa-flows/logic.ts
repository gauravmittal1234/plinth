// wa-flows: WhatsApp Flows data exchange, skeleton (T44; API_CONTRACTS §5.3). Tested in logic.test.ts.
//
// POST: verify X-Hub-Signature-256 (403) → flags.require("wa_inbound") (503) → decrypt
// (crypto.ts; a request we cannot decrypt gets 421 so Meta refreshes our public key) → answer →
// encrypt with the flipped IV → 200 text/plain.
// Answers: action "ping" → { data: { status: "active" } } (Meta's health check); an error
// notification (data.error) → { data: { acknowledged: true } }; otherwise the Flow named by the
// flow_token prefix ("<flow>.<opaque>") answers. No Flow is registered yet: visit_booking and
// agent_onboarding land in M5, dev_receipt in M4. Until then the screen gets an error_message.

import type { HandlerOptions } from "../_shared/core/handler.ts";
import { createHandler } from "../_shared/core/handler.ts";
import type { EnvSource, Secret } from "../_shared/core/env.ts";
import { EnvError, processEnv, readSecret } from "../_shared/core/env.ts";
import { HttpError } from "../_shared/core/errors.ts";
import type { FlagsReader } from "../_shared/core/flags.ts";
import { flagsReader, rpcFlagsLoader } from "../_shared/core/flags.ts";
import { secretClient } from "../_shared/core/supabase.ts";
import { readRawBody, SIGNATURE_HEADER, verifyMetaSignature } from "../_shared/wa/verify.ts";
import type { FlowEnvelope } from "./crypto.ts";
import {
  decryptFlowRequest,
  encryptFlowResponse,
  FlowDecryptError,
  importFlowsPrivateKey,
} from "./crypto.ts";

export const FN = "wa-flows";
export const MAX_FLOW_BYTES = 64 * 1024;

export const FLOW_NAMES = ["visit_booking", "agent_onboarding", "dev_receipt"] as const;
export type FlowName = typeof FLOW_NAMES[number];

export interface FlowRequest {
  version?: string;
  action: string;
  screen?: string;
  data?: Record<string, unknown>;
  flow_token?: string;
}

export interface FlowResponse {
  screen?: string;
  data: Record<string, unknown>;
}

export type FlowHandler = (req: FlowRequest) => Promise<FlowResponse>;

/** Registered Flows (none in T44). */
export const FLOWS: Readonly<Partial<Record<FlowName, FlowHandler>>> = {};

export const NOT_OPEN_MESSAGE = "This form is not open yet. Try again later.";

/** "<flow>.<opaque>" → the Flow name, or null. */
export function flowNameOf(token: string | undefined): FlowName | null {
  const name = token?.split(".")[0];
  return (FLOW_NAMES as readonly string[]).includes(name ?? "") ? name as FlowName : null;
}

function asFlowRequest(body: unknown): FlowRequest {
  const b = body as Record<string, unknown> | null;
  if (!b || typeof b !== "object" || typeof b.action !== "string") {
    throw new HttpError("invalid_input", "The Flow request has no action.");
  }
  return b as unknown as FlowRequest;
}

/** The decrypted answer for a decrypted request. */
export async function answerFlow(
  req: FlowRequest,
  flows: Readonly<Partial<Record<FlowName, FlowHandler>>> = FLOWS,
): Promise<FlowResponse> {
  if (req.action === "ping") return { data: { status: "active" } };
  if (req.data && typeof req.data === "object" && "error" in req.data) {
    return { data: { acknowledged: true } };
  }
  const name = flowNameOf(req.flow_token);
  const handler = name ? flows[name] : undefined;
  if (!handler) return { screen: req.screen ?? "", data: { error_message: NOT_OPEN_MESSAGE } };
  return await handler(req);
}

export interface FlowsEnv {
  appSecret: Secret | null;
  privateKeyPem: string | null;
}

export function readFlowsEnv(src: EnvSource = processEnv): FlowsEnv {
  return {
    appSecret: readSecret(src, "WA_APP_SECRET"),
    // Not readVar: that strips control characters, and a PEM needs its newlines.
    privateKeyPem: src.get("WA_FLOWS_PRIVATE_KEY")?.trim() || null,
  };
}

export interface MakeWaFlowsOptions extends Omit<HandlerOptions, "methods"> {
  flows?: Readonly<Partial<Record<FlowName, FlowHandler>>>;
  /** WA_APP_SECRET and WA_FLOWS_PRIVATE_KEY; default readFlowsEnv() once per isolate. */
  vars?: FlowsEnv;
  flags?: FlagsReader;
  privateKey?: () => Promise<CryptoKey>;
}

function parseEnvelope(raw: Uint8Array): FlowEnvelope {
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new HttpError("invalid_input", "The Flow request is not JSON.");
  }
  const fields = ["encrypted_flow_data", "encrypted_aes_key", "initial_vector"] as const;
  if (!b || fields.some((f) => typeof b[f] !== "string" || b[f] === "")) {
    throw new HttpError("invalid_input", "The Flow request is missing an encrypted field.");
  }
  return b as unknown as FlowEnvelope;
}

let isolateKey: Promise<CryptoKey> | null = null;

/** The private key, imported once per isolate (a failed import is retried next request). */
function isolatePrivateKey(env: FlowsEnv): Promise<CryptoKey> {
  if (!env.privateKeyPem) throw new EnvError(["WA_FLOWS_PRIVATE_KEY"], "is not set");
  isolateKey ??= importFlowsPrivateKey(env.privateKeyPem).catch((err) => {
    isolateKey = null;
    throw err;
  });
  return isolateKey;
}
let isolateFlags: FlagsReader | null = null;
let isolateVars: FlowsEnv | null = null;

export function makeWaFlows(opts: MakeWaFlowsOptions = {}): (req: Request) => Promise<Response> {
  const { flows, vars, flags, privateKey, ...handlerOptions } = opts;
  return createHandler(
    FN,
    async (req, ctx) => {
      const env = vars ?? (isolateVars ??= readFlowsEnv());
      const raw = await readRawBody(req, MAX_FLOW_BYTES);
      await verifyMetaSignature(raw, req.headers.get(SIGNATURE_HEADER), env.appSecret);
      const reader = flags ??
        (isolateFlags ??= flagsReader(rpcFlagsLoader(secretClient(ctx.env.supabase)), {
          log: ctx.log,
        }));
      await reader.require("wa_inbound");
      const envelope = parseEnvelope(raw);

      const key = await (privateKey ? privateKey() : isolatePrivateKey(env));

      let decrypted;
      try {
        decrypted = await decryptFlowRequest(envelope, key);
      } catch (err) {
        if (!(err instanceof FlowDecryptError)) throw err;
        ctx.log.warn("wa flow request could not be decrypted");
        return new Response(null, { status: 421, headers: { "cache-control": "no-store" } });
      }
      const request = asFlowRequest(decrypted.body);
      const answer = await answerFlow(request, flows ?? FLOWS);
      ctx.log.info("wa flow", { action: request.action, flow: flowNameOf(request.flow_token) });
      return new Response(await encryptFlowResponse(answer, decrypted.aesKey, decrypted.iv), {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    },
    { ...handlerOptions, methods: ["POST"] },
  );
}
