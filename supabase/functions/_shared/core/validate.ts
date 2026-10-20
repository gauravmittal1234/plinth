// Body validation with ajv (T29; BUILD_PLAN §12.9 "JSON Schema validation at every edge function
// boundary").
//
//   const ask = await parseBody(req, "AskRequest");          // a contract type, fully typed
//   const hook = await parseBodyWith(req, await compileSchema<SmsHook>(SMS_HOOK_SCHEMA));
//
// Contract types use the ajv standalone validators generated from packages/contracts/schemas, so
// the edge, the web app and the tests validate against the same compiled code. A payload that is
// not in the contract (a provider's webhook body) is compiled at runtime with ajv (JSON Schema
// 2020-12, strict, ajv-formats); ajv loads lazily on the first compile. Either way a failure is
// invalid_input (422) naming the first failing path.

import type { ExportedTypeName, TypeByName } from "./contracts.ts";
import { VALIDATORS } from "./contracts.ts";
import { HttpError } from "./errors.ts";
import type { ReadJsonOptions } from "./http.ts";
import { readJson } from "./http.ts";

export interface SchemaIssue {
  instancePath: string;
  message?: string;
  keyword?: string;
}

/** An ajv ValidateFunction, or anything shaped like one. */
export interface Validator {
  (data: unknown): boolean;
  errors?: readonly SchemaIssue[] | null;
}

/** "/question must NOT have fewer than 1 characters" for the first issue. */
export function describeIssues(issues: readonly SchemaIssue[] | null | undefined): string {
  const first = issues?.[0];
  if (!first) return "the body does not match the schema";
  return `${first.instancePath || "/"} ${first.message ?? first.keyword ?? "is not valid"}`;
}

/** The value typed as T when the validator accepts it; invalid_input otherwise. */
export function check<T>(validator: Validator, value: unknown): T {
  if (validator(value)) return value as T;
  throw new HttpError("invalid_input", `Check ${describeIssues(validator.errors)}.`);
}

export function checkContract<N extends ExportedTypeName>(name: N, value: unknown): TypeByName[N] {
  return check<TypeByName[N]>(VALIDATORS[name] as Validator, value);
}

/** Reads the JSON body and validates it as a contract type. */
export async function parseBody<N extends ExportedTypeName>(
  req: Request,
  name: N,
  opts?: ReadJsonOptions,
): Promise<TypeByName[N]> {
  return checkContract(name, await readJson(req, opts));
}

/** Reads the JSON body and validates it with any ajv-style validator. */
export async function parseBodyWith<T>(
  req: Request,
  validator: Validator,
  opts?: ReadJsonOptions,
): Promise<T> {
  return check<T>(validator, await readJson(req, opts));
}

interface AjvLike {
  compile(schema: object): Validator;
}

let ajvPromise: Promise<AjvLike> | null = null;
const compiled = new WeakMap<object, Validator>();

async function loadAjv(): Promise<AjvLike> {
  const [ajvMod, formatsMod] = await Promise.all([
    import("npm:ajv@8.20.0/dist/2020.js"),
    import("npm:ajv-formats@3.0.1"),
  ]);
  // CommonJS interop: the class or function may sit one `default` deeper.
  const unwrap = (m: unknown): unknown => {
    const v = (m as { default?: unknown }).default ?? m;
    if (typeof v === "function") return v;
    return (v as { default?: unknown } | null)?.default ?? v;
  };
  const Ajv2020 = unwrap(ajvMod) as new (opts: object) => AjvLike;
  const addFormats = unwrap(formatsMod) as (ajv: AjvLike) => void;
  const ajv = new Ajv2020({ strict: true, allErrors: false });
  addFormats(ajv);
  return ajv;
}

/** Compiles an edge-local JSON Schema (2020-12) once per isolate and schema object. */
export async function compileSchema(schema: object): Promise<Validator> {
  const hit = compiled.get(schema);
  if (hit) return hit;
  ajvPromise ??= loadAjv();
  const fn = (await ajvPromise).compile(schema);
  compiled.set(schema, fn);
  return fn;
}
