// Loads examples/<type>/{valid,invalid}/*.json. An invalid example is either a
// full `document`, or a `base` (a file in the same type's valid/ folder) plus
// an RFC 6902 `patch` (add, replace, remove). `expect` is the instancePath
// prefix at least one validation error must have ("" = the root).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG_DIR = fileURLToPath(new URL("..", import.meta.url));
export const EXAMPLES_DIR = join(PKG_DIR, "examples");

export type PatchOp =
  { op: "add" | "replace"; path: string; value: unknown } | { op: "remove"; path: string };

export interface InvalidExample {
  why: string;
  expect: string;
  base?: string;
  patch?: PatchOp[];
  document?: unknown;
}

export interface ExampleSet {
  folder: string;
  valid: { file: string; data: unknown }[];
  invalid: { file: string; spec: InvalidExample; data: unknown }[];
}

/** RiskSummary → risk_summary. */
export const folderOf = (typeName: string) =>
  typeName.replace(/(?<!^)([A-Z])/g, "_$1").toLowerCase();

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

function pointer(path: string): string[] {
  if (path === "") return [];
  return path
    .slice(1)
    .split("/")
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
}

export function applyPatch(doc: unknown, ops: readonly PatchOp[]): unknown {
  const root = structuredClone(doc);
  for (const op of ops) {
    const keys = pointer(op.path);
    const last = keys.pop();
    if (last === undefined) throw new Error("patching the root is not supported");
    let parent = root as Record<string, unknown> | unknown[];
    for (const k of keys) parent = (parent as Record<string, unknown>)[k] as typeof parent;
    if (Array.isArray(parent)) {
      const i = last === "-" ? parent.length : Number(last);
      if (op.op === "add") parent.splice(i, 0, structuredClone(op.value));
      else if (op.op === "replace") parent[i] = structuredClone(op.value);
      else parent.splice(i, 1);
    } else if (op.op === "remove") {
      if (!(last in parent)) throw new Error(`remove: ${op.path} does not exist`);
      delete parent[last];
    } else {
      if (op.op === "replace" && !(last in parent))
        throw new Error(`replace: ${op.path} does not exist`);
      parent[last] = structuredClone(op.value);
    }
  }
  return root;
}

export function loadExampleSet(folder: string): ExampleSet {
  const dir = join(EXAMPLES_DIR, folder);
  const list = (kind: string) =>
    existsSync(join(dir, kind))
      ? readdirSync(join(dir, kind))
          .filter((f) => f.endsWith(".json"))
          .sort()
      : [];
  const valid = list("valid").map((file) => ({ file, data: readJson(join(dir, "valid", file)) }));
  const invalid = list("invalid").map((file) => {
    const spec = readJson(join(dir, "invalid", file)) as InvalidExample;
    let data: unknown;
    if (spec.document !== undefined) data = spec.document;
    else if (spec.base && spec.patch)
      data = applyPatch(readJson(join(dir, "valid", spec.base)), spec.patch);
    else throw new Error(`${folder}/invalid/${file}: needs "document" or "base" + "patch"`);
    return { file, spec, data };
  });
  return { folder, valid, invalid };
}

export const exampleFolders = () =>
  readdirSync(EXAMPLES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
