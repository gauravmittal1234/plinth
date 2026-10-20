import base from "@plinth/config/eslint";

// Node globals for the codegen scripts (plain .mjs).
const node = {
  process: "readonly",
  console: "readonly",
  URL: "readonly",
  structuredClone: "readonly",
};

export default [
  ...base,
  { ignores: ["examples/**", "openapi/**"] },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: node } },
];
