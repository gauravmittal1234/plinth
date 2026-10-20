// Loads packages/contracts/schemas/*.schema.json, checks the house conventions
// and builds the type registry every emitter shares (one name per type, the
// same in TS, Dart and Python).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PKG } from "./paths.mjs";

export const SCHEMA_BASE = "https://plinth.in/schemas/";
export const SCHEMAS_DIR = join(PKG, "schemas");

/** Defs that are exported (validators, examples, top-level codegen) besides
 * every file's top-level type and every `*Request` def. Acknowledgements carry
 * no schema envelope (API_CONTRACTS §1). */
export const EXTRA_EXPORTS = [
  "Ok",
  "ConsentWithdrawal",
  "RelayRenewal",
  "DocCheckStarted",
  "RpcError",
];

/** Exported types without the "schema" envelope. */
export const NO_ENVELOPE = new Set([
  "ApiError",
  "Ok",
  "ConsentWithdrawal",
  "RelayRenewal",
  "DocCheckStarted",
  "RpcError",
]);

function fail(msg) {
  throw new Error(`contracts: ${msg}`);
}

export function loadSchemas() {
  const files = readdirSync(SCHEMAS_DIR)
    .filter((f) => f.endsWith(".schema.json"))
    .sort();
  const entries = [];
  /** name -> { name, file, pointer, schema, top } */
  const types = new Map();
  /** file -> top-level type name (or null for defs-only files) */
  const topByFile = new Map();

  for (const file of files) {
    const text = readFileSync(join(SCHEMAS_DIR, file), "utf8");
    const banned =
      /"(unevaluatedProperties|unevaluatedItems|\$dynamicRef|\$dynamicAnchor|\$recursiveRef)"/.exec(
        text,
      );
    if (banned) fail(`${file}: ${banned[1]} is not supported by the generators`);
    const json = JSON.parse(text);
    const stem = file.replace(/\.schema\.json$/, "");
    if (json.$schema !== "https://json-schema.org/draft/2020-12/schema")
      fail(`${file}: $schema must be JSON Schema 2020-12`);
    if (json.$id !== SCHEMA_BASE + file) fail(`${file}: $id must be ${SCHEMA_BASE + file}`);
    const top = json.type === "object" ? json.title : null;
    if (json.type !== undefined && !top) fail(`${file}: a top-level type needs a title`);
    topByFile.set(file, top);
    entries.push({ file, stem, json, top });
    if (top) register(types, { name: top, file, pointer: "", schema: json, top: true });
    for (const [key, def] of Object.entries(json.$defs ?? {})) {
      if (def.title !== key) fail(`${file}: $defs/${key} must have title "${key}"`);
      register(types, { name: key, file, pointer: `/$defs/${key}`, schema: def, top: false });
    }
  }

  const exported = [];
  for (const e of entries) {
    if (e.top) exported.push(e.top);
    for (const key of Object.keys(e.json.$defs ?? {}))
      if (key.endsWith("Request") || EXTRA_EXPORTS.includes(key)) exported.push(key);
  }
  for (const x of EXTRA_EXPORTS) if (!types.has(x)) fail(`EXTRA_EXPORTS names an unknown def ${x}`);

  /** "plinth.risk_summary/1" -> "RiskSummary" */
  const schemaIds = {};
  for (const e of entries) {
    if (!e.top) continue;
    const c = e.json.properties?.schema?.const;
    if (NO_ENVELOPE.has(e.top)) {
      if (c !== undefined) fail(`${e.file}: ${e.top} is listed without an envelope but has one`);
      continue;
    }
    if (c !== `plinth.${e.stem}/1`)
      fail(`${e.file}: properties.schema.const must be "plinth.${e.stem}/1"`);
    if (!e.json.required?.includes("schema")) fail(`${e.file}: "schema" must be required`);
    schemaIds[c] = e.top;
  }

  return { entries, types, topByFile, exported: exported.sort(), schemaIds };
}

function register(types, t) {
  if (types.has(t.name)) {
    const prev = types.get(t.name);
    fail(
      `type name "${t.name}" is defined twice (${prev.file}${prev.pointer} and ${t.file}${t.pointer})`,
    );
  }
  types.set(t.name, t);
}

/** Resolves a $ref found in `file` to a registered type name. */
export function refToName(ref, file, topByFile) {
  const [filePart, pointer = ""] = ref.split("#");
  const target = filePart === "" ? file : filePart;
  if (!topByFile.has(target)) fail(`${file}: $ref "${ref}" points at an unknown file`);
  if (pointer === "" || pointer === "/") {
    const top = topByFile.get(target);
    if (!top) fail(`${file}: $ref "${ref}" points at a file without a top-level type`);
    return top;
  }
  const m = /^\/\$defs\/([A-Za-z0-9]+)$/.exec(pointer);
  if (!m) fail(`${file}: $ref "${ref}" must point at a file or at /$defs/<Name>`);
  return m[1];
}

/** The $id-based reference ajv uses for a type. */
export function typeRef(t) {
  return SCHEMA_BASE + t.file + (t.pointer ? `#${t.pointer}` : "");
}
