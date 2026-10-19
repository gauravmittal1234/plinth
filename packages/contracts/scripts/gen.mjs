#!/usr/bin/env node
// Contracts codegen (WORK_BREAKDOWN T02). From schemas/*.schema.json and
// catalogues/*.json it writes, all committed (CI fails on drift):
//   gen/ts/{types.ts,validators.js,validators.d.ts,index.ts}  TS types + ajv standalone validators
//   dart/lib/{plinth_contracts.dart,src/*.g.dart}             Dart package plinth_contracts (quicktype)
//   python/plinth_contracts/{models.py,__init__.py}           Python package plinth_contracts (Pydantic v2)
//   openapi/plinth.yaml                                       OpenAPI 3.1 for RPC paths and edge functions
//
//   node scripts/gen.mjs            write what changed
//   node scripts/gen.mjs --check    exit 1 if any output differs from disk
//   node scripts/gen.mjs --only ts,dart,python,openapi
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { addAllSchemas, makeAjv } from "./lib/ajv.mjs";
import { emitDart } from "./lib/emit-dart.mjs";
import { emitOpenapi } from "./lib/emit-openapi.mjs";
import { emitPython } from "./lib/emit-python.mjs";
import { emitTs } from "./lib/emit-ts.mjs";
import { CATALOGUES, CATALOGUE_NAMES, PKG } from "./lib/paths.mjs";
import { loadSchemas, typeRef } from "./lib/schemas.mjs";

const argv = process.argv.slice(2);
const check = argv.includes("--check");
const onlyArg = argv.find((a) => a.startsWith("--only"));
const only = new Set(
  (onlyArg?.includes("=")
    ? onlyArg.split("=")[1]
    : onlyArg
      ? argv[argv.indexOf(onlyArg) + 1]
      : "ts,dart,python,openapi"
  )
    .split(",")
    .map((s) => s.trim()),
);
const log = (msg) => console.log(`contracts gen: ${msg}`);

const loaded = loadSchemas();
const catalogues = Object.fromEntries(
  CATALOGUE_NAMES.map((n) => [n, JSON.parse(readFileSync(join(CATALOGUES, `${n}.json`), "utf8"))]),
);

// Every schema compiles (strict), and every exported type resolves.
const ajv = addAllSchemas(makeAjv(), loaded);
for (const name of loaded.exported)
  if (!ajv.getSchema(typeRef(loaded.types.get(name)))) fail(`cannot compile ${name}`);
log(
  `${loaded.entries.length} schema files, ${loaded.types.size} types, ${loaded.exported.length} exported`,
);

const outputs = {};
if (only.has("ts")) Object.assign(outputs, await emitTs(loaded));
if (only.has("dart")) Object.assign(outputs, await emitDart(loaded, catalogues));
if (only.has("python")) Object.assign(outputs, emitPython(loaded, catalogues, log) ?? {});
if (only.has("openapi")) Object.assign(outputs, emitOpenapi(loaded));

let drift = 0;
for (const [rel, content] of Object.entries(outputs).sort(([a], [b]) =>
  a < b ? -1 : a > b ? 1 : 0,
)) {
  const abs = join(PKG, rel);
  const current = existsSync(abs) ? readFileSync(abs, "utf8") : null;
  if (current === content) continue;
  if (check) {
    drift++;
    log(`drift: ${rel}`);
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  log(`wrote ${rel}`);
}
if (check && drift) {
  log(`${drift} generated file(s) are stale: run \`npm run -w @plinth/contracts gen\` and commit`);
  process.exit(1);
}
log(check ? "generated files are up to date" : "done");

function fail(msg) {
  console.error(`contracts gen: ${msg}`);
  process.exit(1);
}
