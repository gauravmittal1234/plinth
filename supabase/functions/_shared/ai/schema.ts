// Response schemas (T63; BUILD_PLAN §14 "Outputs must match the schema or are discarded").
//
// A task's response_schema is a reference into packages/contracts/schemas ("x.schema.json",
// "x.schema.json#/$defs/Y", "ai/x.schema.json"; T61 adds schemas/ai/) or, in a test catalogue, an
// inline JSON Schema. resolveSchema() returns one self-contained JSON Schema (2020-12) with every
// $ref inlined, so ajv can compile it alone and toGeminiSchema() can turn it into the OpenAPI
// subset Gemini's `responseSchema` accepts. Gemini's schema only steers generation; ajv decides.

import type { AiTask } from "./catalogue.ts";
import { AiError } from "./errors.ts";

export type JsonSchema = Record<string, unknown>;

/** Reads a schema file by its path relative to the schemas folder. */
export type SchemaReader = (path: string) => Promise<unknown>;

export interface SchemaSource {
  /** The task's response schema, self-contained; schema_missing when it has none. */
  forTask(task: AiTask): Promise<JsonSchema>;
}

const PLINTH_ID_PREFIX = "https://plinth.in/schemas/";

function pointerGet(doc: unknown, pointer: string, where: string): unknown {
  if (pointer === "" || pointer === "/") return doc;
  let node = doc;
  for (const raw of pointer.replace(/^\//, "").split("/")) {
    const key = decodeURIComponent(raw).replace(/~1/g, "/").replace(/~0/g, "~");
    if (node === null || typeof node !== "object" || !Object.hasOwn(node, key)) {
      throw new AiError("config", `schema ref ${where} does not resolve`);
    }
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

function splitRef(ref: string, currentFile: string): { file: string; pointer: string } {
  const [rawPath = "", pointer = ""] = ref.split("#", 2);
  let path = rawPath.startsWith(PLINTH_ID_PREFIX)
    ? rawPath.slice(PLINTH_ID_PREFIX.length)
    : rawPath;
  if (path === "") return { file: currentFile, pointer };
  if (/^[a-z]+:/i.test(path)) throw new AiError("config", `schema ref ${ref} leaves the contracts`);
  if (!path.startsWith("/")) {
    const dir = currentFile.includes("/")
      ? currentFile.slice(0, currentFile.lastIndexOf("/") + 1)
      : "";
    path = dir + path;
  }
  const parts: string[] = [];
  for (const seg of path.replace(/^\/+/, "").split("/")) {
    if (seg === "..") {
      if (!parts.length) throw new AiError("config", `schema ref ${ref} leaves the contracts`);
      parts.pop();
    } else if (seg !== "." && seg !== "") parts.push(seg);
  }
  return { file: parts.join("/"), pointer };
}

/**
 * Inlines every $ref of a schema found at `ref` (a path with an optional #pointer). Recursive
 * schemas are refused: a response schema is a finite tree.
 */
export async function resolveSchema(ref: string, read: SchemaReader): Promise<JsonSchema> {
  const docs = new Map<string, unknown>();
  const load = async (file: string): Promise<unknown> => {
    if (!docs.has(file)) docs.set(file, await read(file));
    return docs.get(file);
  };

  const walk = async (node: unknown, file: string, stack: readonly string[]): Promise<unknown> => {
    if (Array.isArray(node)) return await Promise.all(node.map((n) => walk(n, file, stack)));
    if (node === null || typeof node !== "object") return node;
    const obj = node as Record<string, unknown>;
    if (typeof obj.$ref === "string") {
      const target = splitRef(obj.$ref, file);
      const id = `${target.file}#${target.pointer}`;
      if (stack.includes(id)) throw new AiError("config", `schema ref ${id} is recursive`);
      const resolved = await walk(
        pointerGet(await load(target.file), target.pointer, id),
        target.file,
        [...stack, id],
      ) as JsonSchema;
      const { $ref: _ref, ...siblings } = obj;
      const rest = await walk(siblings, file, stack) as JsonSchema;
      return { ...resolved, ...rest };
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "$id" || k === "$schema" || k === "$defs" || k === "definitions") continue;
      // Keys under `properties` are names, not keywords; walk their values only.
      out[k] = k === "properties" && v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
          await Promise.all(
            Object.entries(v).map(async ([name, s]) => [name, await walk(s, file, stack)]),
          ),
        )
        : await walk(v, file, stack);
    }
    return out;
  };

  const target = splitRef(ref, "");
  const id = `${target.file}#${target.pointer}`;
  const root = pointerGet(await load(target.file), target.pointer, id);
  return await walk(root, target.file, [id]) as JsonSchema;
}

/** Reads schema files from a folder (default: packages/contracts/schemas). */
export function fileSchemaReader(
  base: URL = new URL("../../../../packages/contracts/schemas/", import.meta.url),
): SchemaReader {
  return async (path) => JSON.parse(await Deno.readTextFile(new URL(path, base)));
}

/** A SchemaSource over a reader, caching each resolved schema per isolate. */
export function schemaSource(read: SchemaReader = fileSchemaReader()): SchemaSource {
  const cache = new Map<string, Promise<JsonSchema>>();
  return {
    forTask(task) {
      const s = task.response_schema;
      if (s === null || s === undefined) {
        return Promise.reject(
          new AiError("schema_missing", `AI task ${task.key} has no response schema`),
        );
      }
      if (typeof s === "object") {
        const key = `inline:${task.key}`;
        if (!cache.has(key)) {
          cache.set(
            key,
            resolveSchema("inline.json", (p) => p === "inline.json" ? Promise.resolve(s) : read(p)),
          );
        }
        return cache.get(key)!;
      }
      if (!cache.has(s)) {
        const p = resolveSchema(s, read);
        p.catch(() => cache.delete(s));
        cache.set(s, p);
      }
      return cache.get(s)!;
    },
  };
}

const GEMINI_TYPES: Readonly<Record<string, string>> = {
  string: "STRING",
  number: "NUMBER",
  integer: "INTEGER",
  boolean: "BOOLEAN",
  array: "ARRAY",
  object: "OBJECT",
};
const GEMINI_KEEP = [
  "description",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minProperties",
  "maxProperties",
] as const;

/**
 * A self-contained JSON Schema → Gemini's `responseSchema` (OpenAPI 3.0 subset): type names in
 * upper case, ["x", "null"] and anyOf-with-null as `nullable`, const as a one-value enum, and the
 * keywords Gemini rejects ($schema, additionalProperties, pattern, format…) dropped.
 */
export function toGeminiSchema(schema: unknown): JsonSchema {
  if (schema === true || schema === undefined || schema === null || typeof schema !== "object") {
    return { type: "STRING" };
  }
  const s = schema as Record<string, unknown>;
  const out: JsonSchema = {};
  let nullable = false;

  const branches = (Array.isArray(s.anyOf) ? s.anyOf : Array.isArray(s.oneOf) ? s.oneOf : null) as
    | unknown[]
    | null;
  if (branches) {
    const isNull = (b: unknown) => (b as { type?: unknown })?.type === "null";
    const real = branches.filter((b) => !isNull(b));
    nullable = real.length < branches.length;
    if (real.length === 1) {
      const one = toGeminiSchema(real[0]);
      if (nullable) one.nullable = true;
      if (typeof s.description === "string" && one.description === undefined) {
        one.description = s.description;
      }
      return one;
    }
    out.anyOf = real.map(toGeminiSchema);
  }

  let type = s.type;
  if (Array.isArray(type)) {
    nullable ||= type.includes("null");
    const real = type.filter((t) => t !== "null");
    type = real.length === 1 ? real[0] : undefined;
    if (real.length > 1) out.anyOf = real.map((t) => toGeminiSchema({ ...s, type: t }));
  }
  if (s.const !== undefined && type === undefined) type = typeof s.const;
  if (typeof type === "string" && GEMINI_TYPES[type]) out.type = GEMINI_TYPES[type];
  else if (!out.anyOf && type === undefined && s.properties) out.type = "OBJECT";

  for (const k of GEMINI_KEEP) if (s[k] !== undefined) out[k] = s[k];
  if (s.const !== undefined && typeof s.const === "string") out.enum = [s.const];
  else if (Array.isArray(s.enum) && s.enum.every((e) => typeof e === "string" || e === null)) {
    const values = s.enum.filter((e): e is string => typeof e === "string");
    if (values.length < s.enum.length) nullable = true;
    out.enum = values;
    out.type ??= "STRING";
  }
  if (s.properties && typeof s.properties === "object") {
    const props: Record<string, JsonSchema> = {};
    for (const [name, sub] of Object.entries(s.properties)) props[name] = toGeminiSchema(sub);
    out.properties = props;
    out.propertyOrdering = Object.keys(props);
    if (Array.isArray(s.required)) out.required = s.required.filter((r) => r in props);
  }
  if (s.items !== undefined && typeof s.items === "object") out.items = toGeminiSchema(s.items);
  if (nullable) out.nullable = true;
  return out;
}
