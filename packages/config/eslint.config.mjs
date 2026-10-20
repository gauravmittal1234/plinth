import base from "./eslint/base.mjs";

export default [
  ...base,
  {
    // The presets and their tests run in Node.
    files: ["**/*.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
  {
    // The rule's own test feeds it hex colours on purpose.
    files: ["eslint/plinth-plugin.test.mjs"],
    rules: { "plinth/no-hex-colour": "off" },
  },
];
