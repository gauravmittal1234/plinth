import type { ErrorObject } from "ajv";
import {
  VALIDATORS,
  type ExportedTypeName,
  type PayloadBySchemaId,
  type SchemaId,
  type TypeByName,
  validatorForPayload,
} from "../gen/ts/validators.js";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: ErrorObject[] };

/** Validates `data` as the named contract type (first error only). */
export function validate<N extends ExportedTypeName>(
  name: N,
  data: unknown,
): ValidationResult<TypeByName[N]> {
  const fn = VALIDATORS[name];
  if (fn(data)) return { ok: true, value: data as TypeByName[N] };
  return { ok: false, errors: [...(fn.errors ?? [])] };
}

/** Validates a payload by its "schema" envelope. Unknown envelopes fail. */
export function validatePayload(data: unknown): ValidationResult<PayloadBySchemaId[SchemaId]> {
  const fn = validatorForPayload(data);
  if (!fn)
    return {
      ok: false,
      errors: [
        {
          instancePath: "/schema",
          schemaPath: "#/properties/schema",
          keyword: "const",
          params: {},
          message: "unknown or missing schema envelope",
        },
      ],
    };
  if (fn(data)) return { ok: true, value: data as PayloadBySchemaId[SchemaId] };
  return { ok: false, errors: [...(fn.errors ?? [])] };
}

/** One-line description of validation errors, for logs and test output. */
export function formatErrors(errors: readonly ErrorObject[]): string {
  return errors.map((e) => `${e.instancePath || "/"} ${e.message ?? e.keyword}`).join("; ");
}
