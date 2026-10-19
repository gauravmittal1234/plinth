// Base flat config for the shared TS packages (packages/*). The Next apps use
// eslint-config-next. T05 owns this preset and adds the "no hex literals
// outside tokens" rule here.
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", "gen/**", "coverage/**", "dart/**", "python/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
]);
