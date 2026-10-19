// @plinth/contracts: the one contract (BUILD_PLAN §1 rule 2). Types and
// validators are generated from ../schemas by scripts/gen.mjs; this file only
// re-exports them with the catalogues and two small helpers.
//
//   import type { RiskSummary } from "@plinth/contracts";
//   import { validate, refPattern } from "@plinth/contracts";
//
// Plain .mjs scripts (no TypeScript) import the JS directly:
//   import { VALIDATORS, validatorForPayload } from "@plinth/contracts/validators";
export type * from "../gen/ts/types";
export {
  EXPORTED_TYPES,
  SCHEMA_IDS,
  VALIDATORS,
  validatorForPayload,
} from "../gen/ts/validators.js";
export type {
  ExportedTypeName,
  PayloadBySchemaId,
  SchemaId,
  TypeByName,
} from "../gen/ts/validators.js";
export * from "./catalogues";
export * from "./validate";

/** The contract envelope prefix every payload carries (`plinth.<type>/<major>`). */
export const SCHEMA_PREFIX = "plinth.";
