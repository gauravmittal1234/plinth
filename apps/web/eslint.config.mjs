import { noHexColourConfig } from "@plinth/config/eslint/plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // No hex colours: every colour comes from @plinth/tokens (BUILD_PLAN §5.2).
  noHexColourConfig,
  {
    // Node scripts (copy lint) run outside the browser.
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Test and Lighthouse output.
    "playwright-report/**",
    "test-results/**",
    ".lighthouseci/**",
  ]),
]);

export default eslintConfig;
