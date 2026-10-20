// Task input: shape, normalisation and the input SHA (T63).
//
// A task input is document data plus the SHA-256 of the source document it came from. The
// gateway normalises it (Unicode NFC, LF line ends, no trailing spaces, no control characters),
// strips PII per the task's policy, and hashes exactly what the model will see:
//   input_sha256 = sha256( canonical JSON of [task@version, prompt version, normalised input] )
// The recorded responses are keyed by this SHA, so a replay answers only the input it was
// recorded for. Media is hashed by its bytes' SHA-256; its bytes never enter the canonical form.

import type { Bytes } from "../core/crypto.ts";
import { sha256Hex } from "../core/crypto.ts";
import { AiError } from "./errors.ts";

export interface InputLine {
  /** A stable line id from OCR ("p1-l07"); readers cite these, never coordinates. */
  id: string;
  text: string;
}

export interface InputMedia {
  /** image/png, image/jpeg, image/webp or application/pdf. */
  mime_type: string;
  data: Bytes;
}

export interface TaskInput {
  /** SHA-256 (hex) of the source document (the uploaded file). The free tier checks it. */
  source_sha256: string;
  /** Document text as lines with ids (the readers' input). */
  lines?: readonly InputLine[];
  /** Document text without line ids. */
  text?: string;
  /** A page image or PDF (ocr.document). */
  media?: InputMedia;
  /** Small structured parameters for the prompt (never document text). */
  params?: Readonly<Record<string, string | number | boolean | null>>;
}

/** The normalised input: what is hashed, and (with the media bytes) what the model receives. */
export interface NormalisedInput {
  source_sha256: string;
  lines?: InputLine[];
  text?: string;
  media?: { mime_type: string; sha256: string };
  params?: Record<string, string | number | boolean | null>;
}

const HEX64 = /^[0-9a-f]{64}$/;
const LINE_ID = /^[A-Za-z0-9._:-]{1,40}$/;
const MEDIA_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

/** NFC, LF line ends, no control characters but tab and newline, no trailing spaces. */
export function cleanText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    // deno-lint-ignore no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t ]+$/, ""))
    .join("\n")
    .trim();
}

/** Checks the input's shape and returns its normalised form (media hashed, not copied). */
export async function normaliseInput(input: TaskInput): Promise<NormalisedInput> {
  if (!input || typeof input !== "object") throw new AiError("bad_input", "input is not an object");
  const source = String(input.source_sha256 ?? "").toLowerCase();
  if (!HEX64.test(source)) throw new AiError("bad_input", "source_sha256 is not a SHA-256 hex");
  if (input.lines === undefined && input.text === undefined && input.media === undefined) {
    throw new AiError("bad_input", "input has no lines, text or media");
  }
  const out: NormalisedInput = { source_sha256: source };
  if (input.lines !== undefined) {
    const seen = new Set<string>();
    out.lines = input.lines.map((l, i) => {
      if (!l || typeof l.id !== "string" || !LINE_ID.test(l.id) || typeof l.text !== "string") {
        throw new AiError("bad_input", `line ${i} needs an id and text`);
      }
      if (seen.has(l.id)) throw new AiError("bad_input", `line id ${l.id} repeats`);
      seen.add(l.id);
      return { id: l.id, text: cleanText(l.text).replace(/\n+/g, " ") };
    });
  }
  if (input.text !== undefined) out.text = cleanText(String(input.text));
  if (input.media !== undefined) {
    if (!MEDIA_TYPES.has(input.media.mime_type) || !(input.media.data instanceof Uint8Array)) {
      throw new AiError("bad_input", "media needs a supported mime_type and bytes");
    }
    out.media = { mime_type: input.media.mime_type, sha256: await sha256Hex(input.media.data) };
  }
  if (input.params !== undefined) {
    const params: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(input.params)) {
      if (!/^[a-z][a-z0-9_]{0,40}$/.test(k)) {
        throw new AiError("bad_input", `param ${k} is not a name`);
      }
      if (typeof v === "string" && v.length > 200) {
        throw new AiError("bad_input", `param ${k} is too long to be a parameter`);
      }
      params[k] = typeof v === "string" ? cleanText(v) : v;
    }
    out.params = params;
  }
  return out;
}

/** JSON with object keys sorted at every level: one text per value. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new AiError("bad_input", "a number in the input is not finite");
    }
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

/**
 * The input SHA of a call. source_sha256 is not part of it: two copies of the same document
 * give the same model input, and the free tier checks the source separately.
 */
export async function inputSha(
  taskKey: string,
  promptVersion: string,
  input: NormalisedInput,
): Promise<string> {
  const { source_sha256: _source, ...modelInput } = input;
  return await sha256Hex(canonicalJson([taskKey, promptVersion, modelInput]));
}
