// Base flat config for the shared TS packages (packages/*). The Next apps use
// eslint-config-next plus the Plinth rules (see apps/web/eslint.config.mjs).
// Owner: T05.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import { noHexColourConfig } from "./plinth-plugin.mjs";

export default defineConfig([
  globalIgnores(["dist/**", "gen/**", "coverage/**", "dart/**", "python/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // No hex colours outside @plinth/tokens. packages/tokens turns this off in its
  // own eslint.config.mjs: { rules: { "plinth/no-hex-colour": "off" } }.
  noHexColourConfig,
  prettier,
]);
