import base from "@plinth/config/eslint";

export default [
  ...base,
  {
    // The Style Dictionary build runs in Node.
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
];
