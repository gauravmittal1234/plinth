// Builds the self-test's recorded responses from answers.json (T63).
//
//   deno run --allow-read --allow-write evals/lib/selftest/make.ts
// Each answer becomes <recorded_dir>/<input SHA>.json, keyed exactly as the gateway keys a replay.
// A test (selftest.test.ts) checks the committed files still equal what this builds, so a change
// to the SHA rule or the PII stripper cannot leave the toy recordings silently stale.

import type { AiCatalogue } from "../../../supabase/functions/_shared/ai/catalogue.ts";
import {
  findTask,
  modelFor,
  promptVersionFor,
  readerFor,
  recordedDirFor,
} from "../../../supabase/functions/_shared/ai/catalogue.ts";
import { inputShaFor } from "../../../supabase/functions/_shared/ai/gateway.ts";
import type {
  RecordedAttempt,
  RecordedResponse,
} from "../../../supabase/functions/_shared/ai/recorded.ts";
import { loadSet, REPO_ROOT, toTaskInput } from "../sets.ts";

const HERE = new URL("./", import.meta.url);
const RECORDED_AT = "2026-10-18T12:00:00+05:30";

export interface RecordedFile {
  /** Repo-relative path. */
  path: string;
  file: RecordedResponse;
}

export async function toyRecordings(): Promise<RecordedFile[]> {
  const catalogue = JSON.parse(
    await Deno.readTextFile(new URL("catalogue.json", HERE)),
  ) as AiCatalogue;
  const answers = JSON.parse(await Deno.readTextFile(new URL("answers.json", HERE))) as Record<
    string,
    Record<string, RecordedAttempt[]> | string
  >;
  const set = await loadSet(new URL("toy/", HERE));
  const task = findTask(catalogue, set.gates.task);
  const out: RecordedFile[] = [];
  for (const golden of set.goldens) {
    const byReader = answers[golden.id];
    if (!byReader || typeof byReader === "string") continue;
    for (const [readerId, attempts] of Object.entries(byReader)) {
      const reader = readerFor(task, readerId);
      const sha = await inputShaFor(task.key, await toTaskInput(golden), {
        reader: readerId,
        catalogue,
      });
      out.push({
        path: `${recordedDirFor(task)}/${sha}.json`,
        file: {
          format: "plinth.ai_recorded/1",
          task: task.key,
          prompt_version: promptVersionFor(task, reader),
          input_sha256: sha,
          source_sha256: golden.input.source_sha256,
          model: modelFor(task, reader),
          recorded_at: RECORDED_AT,
          attempts,
        },
      });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

if (import.meta.main) {
  for (const { path, file } of await toyRecordings()) {
    const url = new URL(path, REPO_ROOT);
    await Deno.mkdir(new URL("./", url), { recursive: true });
    await Deno.writeTextFile(url, `${JSON.stringify(file, null, 2)}\n`);
    console.log(`wrote ${path}`);
  }
}
