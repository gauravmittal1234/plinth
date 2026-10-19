import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ROOT = resolve(PKG, "..", "..");
export const GEN_TS = join(PKG, "gen", "ts");
export const DART = join(PKG, "dart");
export const PYTHON = join(PKG, "python");
export const CATALOGUES = join(PKG, "catalogues");
export const EXAMPLES = join(PKG, "examples");
export const OPENAPI = join(PKG, "openapi", "plinth.yaml");

export const CATALOGUE_NAMES = [
  "flags",
  "events",
  "reason_codes",
  "wa_templates",
  "ai_tasks",
  "purposes",
  "ref_formats",
];
