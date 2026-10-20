// Flattens every schema file into one bundle ({ $defs: { Name: schema } }) with
// $refs rewritten to "#/$defs/Name", so every code generator sees one namespace
// and names each type after its title.
//
// Variants (what each generator is fed):
//   ts      enums and consts kept (string literal unions)
//   dart    string enums and consts become plain strings, so an older app never
//           crashes on a value added later (catalogues.g.dart carries the values)
//   python  enums kept (StrEnum classes), consts kept (Literal); no "examples"
// Every variant drops if/then/else: those are validation-only invariants, which
// the ajv validators enforce from the original files.
import { refToName } from "./schemas.mjs";

const DROP_ALWAYS = new Set(["$id", "$schema", "$comment", "if", "then", "else"]);

export function buildBundle(loaded, variant) {
  if (!["ts", "dart", "python"].includes(variant)) throw new Error(`unknown variant ${variant}`);
  const defs = {};
  for (const t of [...loaded.types.values()].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    const clone = structuredClone(t.schema);
    if (t.top) delete clone.$defs;
    defs[t.name] = transform(clone, t.file, loaded.topByFile, variant);
  }
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "PlinthContracts",
    $defs: defs,
  };
}

function transform(node, file, topByFile, variant) {
  if (Array.isArray(node)) return node.map((n) => transform(n, file, topByFile, variant));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (DROP_ALWAYS.has(k)) continue;
    if (k === "examples" && variant !== "ts") continue;
    if (k === "$ref") {
      out.$ref = `#/$defs/${refToName(v, file, topByFile)}`;
      continue;
    }
    out[k] = transform(v, file, topByFile, variant);
  }
  if (out.allOf) {
    out.allOf = out.allOf.filter((s) => Object.keys(s).length > 0);
    if (out.allOf.length === 0) delete out.allOf;
  }
  if (variant === "dart") {
    if ("const" in out) {
      const c = out.const;
      delete out.const;
      if (out.type === undefined)
        out.type = c === null ? "null" : typeof c === "number" ? "number" : typeof c;
    }
    if (Array.isArray(out.enum)) {
      const allStrings = out.enum.every((v) => typeof v === "string");
      const allInts = out.enum.every((v) => Number.isInteger(v));
      if (allStrings || allInts) {
        delete out.enum;
        if (out.type === undefined) out.type = allStrings ? "string" : "integer";
      }
    }
  }
  return out;
}

/** String enums of the bundle, for the Dart and catalogue constants. */
export function stringEnums(loaded) {
  const out = [];
  for (const t of [...loaded.types.values()].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )) {
    const s = t.schema;
    if (s.type === "string" && Array.isArray(s.enum))
      out.push({ name: t.name, values: s.enum, description: s.description });
  }
  return out;
}
