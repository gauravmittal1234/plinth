import base from "@plinth/config/eslint";

// The authoring, seed and sync scripts are plain Node ES modules.
const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  URL: "readonly",
};

export default [...base, { files: ["**/*.mjs"], languageOptions: { globals: nodeGlobals } }];
