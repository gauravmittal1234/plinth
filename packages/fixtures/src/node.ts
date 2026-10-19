// Node-only loaders for the fixture JSON (fixture-mode servers, tests, scripts).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path of the packages/fixtures directory. */
export const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, rel), "utf8"));
}

/** One expected payload, e.g. `loadExpected("risk_summary", "kestrel-park")`. */
export function loadExpected<T = unknown>(fn: string, key: string): T {
  return readJson(`expected/${fn}/${key}.json`) as T;
}

/** The RPC arguments of every fixture key of a function. */
export function loadRequests(fn: string): Record<string, Record<string, unknown>> {
  const p = `expected/${fn}/_requests.json`;
  if (!existsSync(join(FIXTURES_DIR, p))) return {};
  return (readJson(p) as { requests: Record<string, Record<string, unknown>> }).requests;
}

/** Fixture keys of a function (file names without `.json`, `_requests` excluded). */
export function expectedKeys(fn: string): string[] {
  const dir = join(FIXTURES_DIR, "expected", fn);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.slice(0, -5))
    .sort();
}

/** A canonical file: catalogue, evidence, scoring, developer_content (T03b adds more). */
export function loadCanonical<T = unknown>(name: string): T {
  return readJson(`canonical/${name}.json`) as T;
}

/** A golden vector file, e.g. `loadVector("formatting")`. */
export function loadVector<T = unknown>(name: string): T {
  return readJson(`vectors/${name}.json`) as T;
}
