// The one contract, at the edge (T29; BUILD_PLAN §1 rule 2, packages/contracts).
//
// Re-exports the generated TypeScript types and the ajv standalone validators from
// packages/contracts/gen/ts (T02's codegen; never edited by hand). The validators module is large
// (about 1 MB, one function per type), so only validate.ts imports this file at runtime; other
// modules import types from it with `import type`, which costs nothing at runtime.
//
// The relative path leaves supabase/functions: `supabase functions serve` and `deploy` follow
// relative imports and bundle the files they reach.

// @ts-types="../../../../packages/contracts/gen/ts/validators.d.ts"
import {
  EXPORTED_TYPES,
  validatorForPayload,
  VALIDATORS,
} from "../../../../packages/contracts/gen/ts/validators.js";
import type {
  ExportedTypeName,
  PayloadBySchemaId,
  SchemaId,
  TypeByName,
} from "../../../../packages/contracts/gen/ts/validators.d.ts";

export type * from "../../../../packages/contracts/gen/ts/types.ts";
export type { ExportedTypeName, PayloadBySchemaId, SchemaId, TypeByName };
export { EXPORTED_TYPES, validatorForPayload, VALIDATORS };
