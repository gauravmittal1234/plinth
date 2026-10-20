// Recorded responses and the fictional-sample manifest (T63; packages/fixtures/recorded/ai/README.md).
//
// Recorded file: <recorded_dir>/<input_sha256>.json, written by evals/lib/record.ts from a live
// free-tier run on a manifest document, replayed by AI_MODE=recorded (CI, tests, the fixture world):
//   { "format": "plinth.ai_recorded/1", "task": "extract.marketing_claims@1", "prompt_version": "a@1",
//     "input_sha256": "<hex>", "source_sha256": "<hex>", "model": "<model id>",
//     "recorded_at": "<ISO time>",
//     "attempts": [ { "output": {…} } | { "text": "<raw answer>" }, + "tokens_in", "tokens_out" ] }
// Attempts replay in order: a first answer that fails the schema replays the retry from the second.
//
// Manifest (T62 writes packages/fixtures/media/docs/manifest.json):
//   { "format": "plinth.sample_docs/1",
//     "files": [ { "path": "flyer.pdf", "sha256": "<hex>", "fictional": true,
//                  "pages": [ { "sha256": "<hex of a rendered page image>" } ] } ] }
// Every `sha256` (file or page) is a fictional sample the free tier may send (DECISIONS E-8).
// A file marked "fictional": false is never allowed.

import { AiError } from "./errors.ts";

export interface RecordedAttempt {
  output?: unknown;
  text?: string;
  tokens_in?: number;
  tokens_out?: number;
}

export interface RecordedResponse {
  format: "plinth.ai_recorded/1";
  task: string;
  prompt_version: string;
  input_sha256: string;
  source_sha256?: string | null;
  model?: string | null;
  recorded_at?: string;
  attempts: RecordedAttempt[];
}

export interface RecordedStore {
  /** The recorded response for an input SHA in a task's folder, or null. */
  get(recordedDir: string, sha: string): Promise<RecordedResponse | null>;
}

const HEX64 = /^[0-9a-f]{64}$/;

/** Checks a recorded file's shape (a broken file is a config error, never a miss). */
export function parseRecorded(raw: unknown, where: string): RecordedResponse {
  const r = raw as Partial<RecordedResponse> | null;
  if (
    !r || r.format !== "plinth.ai_recorded/1" || typeof r.task !== "string" ||
    typeof r.prompt_version !== "string" || typeof r.input_sha256 !== "string" ||
    !Array.isArray(r.attempts) || r.attempts.length === 0 || r.attempts.length > 2
  ) {
    throw new AiError("config", `recorded response ${where} is not plinth.ai_recorded/1`);
  }
  return r as RecordedResponse;
}

/** Reads recorded files under the repo root (default: four levels above this folder). */
export function fileRecordedStore(
  root: URL = new URL("../../../../", import.meta.url),
): RecordedStore {
  return {
    async get(recordedDir, sha) {
      if (!HEX64.test(sha)) return null;
      const dir = recordedDir.replace(/\/+$/, "");
      if (dir.split("/").includes("..") || dir.startsWith("/")) {
        throw new AiError("config", "recorded_dir must stay inside the repo");
      }
      const url = new URL(`${dir}/${sha}.json`, root);
      let text: string;
      try {
        text = await Deno.readTextFile(url);
      } catch (err) {
        if (err instanceof Deno.errors.NotFound) return null;
        throw new AiError("config", `recorded response ${dir}/${sha}.json is unreadable`, {
          cause: err,
        });
      }
      return parseRecorded(JSON.parse(text), `${dir}/${sha}.json`);
    },
  };
}

/** An in-memory store (tests, and record.ts dry runs). Keys are "<recorded_dir>/<sha>". */
export function memoryRecordedStore(
  files: Readonly<Record<string, RecordedResponse>> = {},
): RecordedStore {
  return {
    get: (dir, sha) => {
      const hit = files[`${dir.replace(/\/+$/, "")}/${sha}`];
      return Promise.resolve(hit ? parseRecorded(hit, `${dir}/${sha}`) : null);
    },
  };
}

/** Loads the set of SHA-256 values the free tier may send. */
export type ManifestLoader = () => Promise<ReadonlySet<string>>;

/** The SHA set of a plinth.sample_docs/1 manifest. Throws on any other shape. */
export function parseManifest(raw: unknown): ReadonlySet<string> {
  const m = raw as { format?: unknown; files?: unknown } | null;
  if (!m || m.format !== "plinth.sample_docs/1" || !Array.isArray(m.files)) {
    throw new AiError("config", "the sample manifest is not plinth.sample_docs/1");
  }
  const out = new Set<string>();
  for (const f of m.files as { sha256?: unknown; fictional?: unknown; pages?: unknown }[]) {
    if (f?.fictional === false) continue;
    const shas = [f?.sha256, ...(Array.isArray(f?.pages) ? f.pages.map((p) => p?.sha256) : [])];
    for (const s of shas) {
      if (typeof s === "string" && HEX64.test(s.toLowerCase())) out.add(s.toLowerCase());
      else if (s !== undefined) throw new AiError("config", "a sample manifest sha256 is not hex");
    }
  }
  return out;
}

/** Reads a manifest file once per isolate (default: packages/fixtures/media/docs/manifest.json). */
export function fileManifestLoader(
  url: URL = new URL("../../../../packages/fixtures/media/docs/manifest.json", import.meta.url),
): ManifestLoader {
  let cached: Promise<ReadonlySet<string>> | null = null;
  return () => {
    cached ??= (async () => {
      try {
        return parseManifest(JSON.parse(await Deno.readTextFile(url)));
      } catch (err) {
        cached = null;
        if (err instanceof AiError) throw err;
        // No manifest yet (T62) or unreadable: nothing is allowed on the free tier.
        return new Set<string>();
      }
    })();
    return cached;
  };
}
