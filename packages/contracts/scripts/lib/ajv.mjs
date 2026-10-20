// One ajv setup for codegen and tests: JSON Schema 2020-12, strict mode, and
// the three formats the contracts use, defined as plain regexes so the
// standalone validators inline them (no ajv-formats import at runtime).
import Ajv2020Module from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMAS_DIR } from "./schemas.mjs";

const Ajv2020 = Ajv2020Module.default ?? Ajv2020Module;

export const FORMATS = {
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  "date-time":
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/,
  uuid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
};

/** @param {{ standalone?: boolean }} [opts] */
export function makeAjv(opts = {}) {
  const ajv = new Ajv2020({
    strict: true,
    strictRequired: false,
    allowUnionTypes: true,
    // Standalone validators stop at the first error (a smaller module); tests use allErrors.
    allErrors: !opts.standalone,
    // Standalone: one function per referenced schema instead of inlining, so
    // the module stays small.
    inlineRefs: opts.standalone ? false : true,
    code: opts.standalone ? { source: true, esm: true, lines: true } : undefined,
  });
  // Ajv2020 forces unevaluated and dynamicRef on, which adds bookkeeping to
  // every generated function. The contracts use neither (loadSchemas() rejects
  // unevaluated*, $dynamicRef and $dynamicAnchor), so switch them off.
  ajv.opts.unevaluated = false;
  ajv.opts.dynamicRef = false;
  for (const [name, re] of Object.entries(FORMATS)) ajv.addFormat(name, re);
  return ajv;
}

/** Adds every schemas/*.schema.json (already loaded) to an ajv instance. */
export function addAllSchemas(ajv, loaded) {
  for (const e of loaded.entries) ajv.addSchema(e.json);
  return ajv;
}

export function readSchemaFile(file) {
  return JSON.parse(readFileSync(join(SCHEMAS_DIR, file), "utf8"));
}
