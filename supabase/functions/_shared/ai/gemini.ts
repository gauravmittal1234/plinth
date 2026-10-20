// Gemini REST `generateContent` through fetch (T63; no SDK, no dependency).
//
//   POST {GEMINI_BASE}/models/{model}:generateContent
//   headers: x-goog-api-key (never the URL), content-type: application/json
//   body: systemInstruction (the prompt file), contents (one user turn: the fenced document and
//         any media as inlineData), generationConfig (temperature, maxOutputTokens,
//         responseMimeType application/json, responseSchema)
// No `tools`, `toolConfig` or `cachedContent` is ever sent: extractors get no tools.
// The caller passes `fetch`; tests inject a fake one and never reach the network.

import type { Secret } from "../core/env.ts";
import { toBase64 } from "../core/crypto.ts";
import { AiError } from "./errors.ts";
import type { InputMedia } from "./input.ts";
import type { JsonSchema } from "./schema.ts";

export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiRequest {
  systemInstruction: { parts: { text: string }[] };
  contents: {
    role: "user";
    parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[];
  }[];
  generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType: "application/json";
    responseSchema: JsonSchema;
  };
}

export interface BuildRequestOptions {
  prompt: string;
  /** The fenced user-turn texts (wrap.ts). */
  parts: readonly string[];
  media?: InputMedia;
  responseSchema: JsonSchema;
  temperature: number | null;
  maxOutputTokens: number | null;
}

export function buildRequest(o: BuildRequestOptions): GeminiRequest {
  const parts: GeminiRequest["contents"][number]["parts"] = o.parts.map((text) => ({ text }));
  if (o.media) {
    parts.push({ inlineData: { mimeType: o.media.mime_type, data: toBase64(o.media.data) } });
  }
  if (!parts.length) throw new AiError("bad_input", "nothing to send");
  const generationConfig: GeminiRequest["generationConfig"] = {
    responseMimeType: "application/json",
    responseSchema: o.responseSchema,
  };
  if (o.temperature !== null) generationConfig.temperature = o.temperature;
  if (o.maxOutputTokens !== null) generationConfig.maxOutputTokens = o.maxOutputTokens;
  return {
    systemInstruction: { parts: [{ text: o.prompt }] },
    contents: [{ role: "user", parts }],
    generationConfig,
  };
}

export interface GeminiAnswer {
  text: string;
  tokens_in: number;
  tokens_out: number;
  finish_reason: string | null;
  model_version: string | null;
}

export interface CallOptions {
  model: string;
  key: Secret;
  request: GeminiRequest;
  fetch: typeof fetch;
  timeoutMs: number;
}

const MODEL_ID = /^[a-z0-9][a-z0-9.-]{1,80}$/;

/**
 * One generateContent call. Errors carry the HTTP status, never the body or the key. The host is
 * fixed: no variable can point the gateway (and a document) at another server.
 */
export async function callGemini(o: CallOptions): Promise<GeminiAnswer> {
  if (!MODEL_ID.test(o.model)) {
    throw new AiError("config", "the model id is not a Gemini model name");
  }
  const url = `${GEMINI_BASE}/models/${o.model}:generateContent`;
  let res: Response;
  try {
    res = await o.fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": o.key.reveal() },
      body: JSON.stringify(o.request),
      signal: AbortSignal.timeout(o.timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new AiError(
      "provider_error",
      timedOut ? "the model call timed out" : "the model call failed",
      {
        cause: err,
      },
    );
  }
  if (!res.ok) {
    await res.body?.cancel();
    throw new AiError("provider_error", `the model answered HTTP ${res.status}`);
  }
  let body: GeminiResponseBody;
  try {
    body = await res.json() as GeminiResponseBody;
  } catch (err) {
    throw new AiError("provider_error", "the model answer was not JSON", { cause: err });
  }
  if (body.promptFeedback?.blockReason) {
    throw new AiError(
      "provider_blocked",
      `the prompt was blocked (${body.promptFeedback.blockReason})`,
    );
  }
  const candidate = body.candidates?.[0];
  if (!candidate) throw new AiError("provider_error", "the model sent no candidate");
  const finish = candidate.finishReason ?? null;
  if (
    finish && ["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(finish)
  ) {
    throw new AiError("provider_blocked", `the model stopped (${finish})`);
  }
  const text = (candidate.content?.parts ?? []).map((p) => p.text ?? "").join("");
  return {
    text,
    tokens_in: body.usageMetadata?.promptTokenCount ?? 0,
    tokens_out: body.usageMetadata?.candidatesTokenCount ?? 0,
    finish_reason: finish,
    model_version: body.modelVersion ?? null,
  };
}

interface GeminiResponseBody {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
  modelVersion?: string;
}
