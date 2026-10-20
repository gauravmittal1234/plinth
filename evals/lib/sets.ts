// Eval sets on disk (T63; evals/README.md).
//
// A set is the folder a task's catalogue entry names in `eval_set` (evals/claims/
// extract.marketing_claims). It holds gates.json and golden/*.json:
//   gates.json   { "format": "plinth.eval_gates/1", "task": "<task@version>",
//                  "readers": ["a", "b"]?, "compare": <AgreeSpec>, "confidence_bar": 0.8?,
//                  "gates": { "precision_min", "recall_min", "f1_min", "agreement_rate_min",
//                             "agreed_but_wrong_max", "errors_max", "fields": {…} } }
//   golden/x.json { "format": "plinth.eval_golden/1", "id": "x",
//                   "input": <TaskInput; media as { "mime_type", "path" } from the repo root>,
//                   "expected": <the output the readers should agree on> }
// `catalogue` and `prompts` in gates.json (paths inside the set) exist for the self-test only.

import type { AgreeSpec } from "../../supabase/functions/_shared/ai/agree.ts";
import type { AiCatalogue } from "../../supabase/functions/_shared/ai/catalogue.ts";
import type { TaskInput } from "../../supabase/functions/_shared/ai/input.ts";

export const REPO_ROOT = new URL("../../", import.meta.url);
export const EVALS_DIR = new URL("../", import.meta.url);

export interface FieldGate {
  precision_min?: number | null;
  recall_min?: number | null;
  f1_min?: number | null;
}

export interface GateSpec extends FieldGate {
  agreement_rate_min?: number | null;
  agreed_but_wrong_max?: number | null;
  /** Cases that failed to run (recorded_miss, schema_mismatch…). Default 0. */
  errors_max?: number | null;
  fields?: Readonly<Record<string, FieldGate>>;
}

export interface EvalGates {
  format: "plinth.eval_gates/1";
  task: string;
  readers?: string[];
  compare: AgreeSpec;
  confidence_bar?: number;
  gates: GateSpec;
  catalogue?: string;
  prompts?: string;
}

export interface GoldenInput extends Omit<TaskInput, "media"> {
  media?: { mime_type: string; path: string };
}

export interface Golden {
  format: "plinth.eval_golden/1";
  id: string;
  input: GoldenInput;
  expected: unknown;
}

export interface EvalSet {
  dir: URL;
  /** The folder relative to the repo root. */
  rel: string;
  gates: EvalGates;
  goldens: Golden[];
  catalogue?: AiCatalogue;
}

async function readJson(url: URL): Promise<unknown> {
  return JSON.parse(await Deno.readTextFile(url));
}

function relOf(url: URL, root: URL = REPO_ROOT): string {
  return url.href.startsWith(root.href)
    ? url.href.slice(root.href.length).replace(/\/$/, "")
    : url.pathname;
}

/** Loads a set folder; throws with the file name on any malformed file. */
export async function loadSet(dir: URL): Promise<EvalSet> {
  const base = dir.href.endsWith("/") ? dir : new URL(`${dir.href}/`);
  const gates = await readJson(new URL("gates.json", base)) as EvalGates;
  if (gates?.format !== "plinth.eval_gates/1" || typeof gates.task !== "string" || !gates.compare) {
    throw new Error(`${relOf(base)}/gates.json is not plinth.eval_gates/1`);
  }
  const goldens: Golden[] = [];
  const goldenDir = new URL("golden/", base);
  const names: string[] = [];
  try {
    for await (const e of Deno.readDir(goldenDir)) {
      if (e.isFile && e.name.endsWith(".json")) names.push(e.name);
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }
  for (const name of names.sort()) {
    const g = await readJson(new URL(name, goldenDir)) as Golden;
    if (g?.format !== "plinth.eval_golden/1" || typeof g.id !== "string" || !g.input) {
      throw new Error(`${relOf(goldenDir)}/${name} is not plinth.eval_golden/1`);
    }
    goldens.push(g);
  }
  const catalogue = gates.catalogue
    ? await readJson(new URL(gates.catalogue, base)) as AiCatalogue
    : undefined;
  return { dir: base, rel: relOf(base), gates, goldens, catalogue };
}

/** Every folder under evals/ holding a gates.json, except evals/lib (the harness and its self-test). */
export async function discoverSets(root: URL = EVALS_DIR): Promise<URL[]> {
  const out: URL[] = [];
  const walk = async (dir: URL, depth: number) => {
    if (depth > 4) return;
    for await (const e of Deno.readDir(dir)) {
      if (!e.isDirectory || e.name.startsWith(".")) continue;
      const sub = new URL(`${e.name}/`, dir);
      if (sub.href === new URL("lib/", root).href) continue;
      try {
        await Deno.stat(new URL("gates.json", sub));
        out.push(sub);
      } catch {
        await walk(sub, depth + 1);
      }
    }
  };
  await walk(root, 0);
  return out.sort((a, b) => a.href.localeCompare(b.href));
}

/** A golden's input as runTask takes it: media bytes read from the repo. */
export async function toTaskInput(g: Golden, root: URL = REPO_ROOT): Promise<TaskInput> {
  const { media, ...rest } = g.input;
  if (!media) return rest;
  if (media.path.split("/").includes("..")) throw new Error(`${g.id}: media path leaves the repo`);
  const data = await Deno.readFile(new URL(media.path, root));
  return { ...rest, media: { mime_type: media.mime_type, data } };
}
