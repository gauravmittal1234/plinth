// Dart: package plinth_contracts. Null-safe classes from quicktype, plus
// constant classes for every string enum and the catalogue values the app needs.
//
// Enums and consts reach Dart as plain String fields (see bundle.mjs): an app
// built today must not throw when the server adds a band overlay or an event
// kind tomorrow. Compare against the constants instead, e.g.
// `summary.display.state == DisplayState.scored`.
//
// Dates and timestamps stay Strings too: "today" comes from meta.generated_at
// with its +05:30 offset, which DateTime.parse would turn into UTC.
import { createRequire } from "node:module";
import { buildBundle, stringEnums } from "./bundle.mjs";
import { HEADER } from "./emit-ts.mjs";
import { PKG } from "./paths.mjs";

const require = createRequire(`${PKG}/package.json`);
const { quicktype, InputData, JSONSchemaInput, JSONSchemaStore } = require("quicktype-core");

/** Serves the one bundle document, so every source shares the same named types. */
class BundleStore extends JSONSchemaStore {
  constructor(bundle) {
    super();
    this.bundle = bundle;
  }
  async fetch() {
    return this.bundle;
  }
}

function stripDartFormats(node) {
  if (Array.isArray(node)) return node.forEach(stripDartFormats);
  if (!node || typeof node !== "object") return;
  if (node.type === "string" && typeof node.format === "string") delete node.format;
  Object.values(node).forEach(stripDartFormats);
}

// Dart's reserved words (cannot be identifiers at all), not just the ones this
// catalogue happened to need before: a future enum value is one schema change
// away from hitting any of these (T61 hit "super", DATA_MODEL §7 qualifier).
const DART_RESERVED = new Set([
  "assert",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "else",
  "enum",
  "extends",
  "false",
  "final",
  "finally",
  "for",
  "if",
  "in",
  "is",
  "new",
  "null",
  "rethrow",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "var",
  "void",
  "while",
  "with",
  "as",
]);

function dartIdent(value) {
  let id = value.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
  id = id.charAt(0).toLowerCase() + id.slice(1);
  if (/^\d/.test(id)) id = `v${id}`;
  if (DART_RESERVED.has(id)) id = `${id}_`;
  return id;
}

const dartString = (s) =>
  `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\$/g, "\\$")}'`;

/**
 * quicktype's Dart output turns a null list into [] and crashes on a null map.
 * Its null-checked forms only appear on nullable fields, so keep null as null.
 */
export function fixNullableCollections(src) {
  const out = src
    .replace(/ == null \? \[\] : /g, " == null ? null : ")
    .replace(/Map\.from\(json\["(\w+)"\]!\)/g, 'json["$1"] == null ? null : Map.from(json["$1"]!)')
    .replace(/Map\.from\((\w+)!\)/g, "$1 == null ? null : Map.from($1!)");
  if (/\? \[\] :/.test(out)) throw new Error("contracts: unexpected quicktype list default");
  return out;
}

export async function emitDart(loaded, catalogues) {
  const files = {};
  const bundle = buildBundle(loaded, "dart");
  stripDartFormats(bundle);
  const input = new JSONSchemaInput(new BundleStore(bundle));
  for (const name of loaded.exported)
    await input.addSource({ name, uris: [`plinth-contracts.json#/$defs/${name}`] });
  const inputData = new InputData();
  inputData.addInput(input);
  const result = await quicktype({
    inputData,
    lang: "dart",
    combineClasses: false,
    inferMaps: false,
    inferEnums: false,
    inferUuids: false,
    inferDateTimes: false,
    inferIntegerStrings: false,
    inferBooleanStrings: false,
    alphabetizeProperties: false,
    leadingComments: [HEADER],
    rendererOptions: { "null-safety": "true", "final-props": "true", "required-props": "false" },
  });
  const models = [
    "// ignore_for_file: type=lint",
    fixNullableCollections(result.lines.join("\n").replace(/\n{3,}/g, "\n\n")),
    "",
  ].join("\n");
  const missing = [];
  for (const t of loaded.types.values()) {
    // An object whose additionalProperties is a schema is a map in Dart (Map<String, T>).
    const isObject =
      t.schema.type === "object" && typeof t.schema.additionalProperties !== "object";
    if (isObject && !new RegExp(`\\nclass ${t.name} \\{`).test(models)) missing.push(t.name);
  }
  if (missing.length) {
    console.error(models.match(/^class \w+/gm).join("\n"));
    throw new Error(`contracts: quicktype did not emit Dart classes ${missing.join(", ")}`);
  }
  files["dart/lib/src/models.g.dart"] = models;

  // Enum constants.
  const enumLines = [`// ${HEADER}`, "// ignore_for_file: type=lint", ""];
  for (const e of stringEnums(loaded)) {
    if (e.description) enumLines.push(`/// ${e.description}`);
    enumLines.push(`abstract final class ${e.name} {`);
    for (const v of e.values)
      enumLines.push(`  static const String ${dartIdent(v)} = ${dartString(v)};`);
    enumLines.push(
      `  static const List<String> values = [${e.values.map(dartString).join(", ")}];`,
    );
    enumLines.push("}", "");
  }
  files["dart/lib/src/enums.g.dart"] = enumLines.join("\n");

  // Catalogue constants.
  const cat = [`// ${HEADER}`, "// ignore_for_file: type=lint", ""];
  cat.push("/// Envelope id → type name (API_CONTRACTS §1).");
  cat.push("const Map<String, String> schemaIds = {");
  for (const [id, name] of Object.entries(loaded.schemaIds).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  ))
    cat.push(`  ${dartString(id)}: ${dartString(name)},`);
  cat.push("};", "");
  cat.push("/// Feature flag keys (catalogues/flags.json). An absent key reads as false.");
  cat.push("abstract final class FlagKeys {");
  for (const f of catalogues.flags.flags)
    cat.push(`  static const String ${dartIdent(f.key)} = ${dartString(f.key)};`);
  cat.push(
    `  static const List<String> values = [${catalogues.flags.flags.map((f) => dartString(f.key)).join(", ")}];`,
  );
  cat.push("}", "");
  cat.push("/// Human reference formats (catalogues/ref_formats.json), keyed by prefix.");
  cat.push("final Map<String, RegExp> refPatterns = {");
  for (const f of catalogues.ref_formats.formats)
    cat.push(`  ${dartString(f.prefix)}: RegExp(r'${f.regex}'),`);
  cat.push("};", "");
  cat.push("/// Ask Plinth refusal codes and fixed lines (catalogues/ai_tasks.json).");
  cat.push("abstract final class AskLines {");
  for (const [k, v] of Object.entries(catalogues.ai_tasks.fixed_lines))
    cat.push(`  static const String ${dartIdent(k)} = ${dartString(v)};`);
  cat.push("}", "");
  files["dart/lib/src/catalogues.g.dart"] = cat.join("\n");

  // Round-trip helpers for dart/test/examples_test.dart, keyed by examples/ folder.
  const folderOf = (n) => n.replace(/(?<!^)([A-Z])/g, "_$1").toLowerCase();
  files["dart/test/round_trips.g.dart"] = [
    `// ${HEADER}`,
    "import 'package:plinth_contracts/plinth_contracts.dart';",
    "",
    "/// examples/(folder) → decode with the generated model, then encode again.",
    "final Map<String, Map<String, dynamic> Function(Map<String, dynamic>)> roundTrips = {",
    ...loaded.exported.map((n) => `  '${folderOf(n)}': (json) => ${n}.fromJson(json).toJson(),`),
    "};",
    "",
  ].join("\n");

  files["dart/lib/plinth_contracts.dart"] = [
    "/// Plinth API contract models for Dart (BUILD_PLAN §1 rule 2: one contract).",
    "///",
    "/// Null-safe models from quicktype; unknown JSON fields are ignored. Enum-like",
    "/// fields are Strings (an older app never throws on a value added later):",
    "/// compare them with the constants in enums.g.dart, e.g.",
    "/// `summary.display.state == DisplayState.scored`. Dates and timestamps are",
    "/// Strings too, so meta.generated_at keeps its +05:30 offset.",
    "///",
    `/// ${HEADER}`,
    "library;",
    "",
    "export 'src/catalogues.g.dart';",
    "export 'src/enums.g.dart';",
    "export 'src/models.g.dart';",
    "",
    "/// The contract envelope prefix every payload carries (`plinth.<type>/<major>`).",
    "const String plinthSchemaPrefix = 'plinth.';",
    "",
  ].join("\n");
  return files;
}
