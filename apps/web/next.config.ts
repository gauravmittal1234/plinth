import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The workspace packages ship TypeScript source (no build step), so Next
  // compiles them with the app. @plinth/contracts' ajv validators (~1 MB) are
  // for server code and tests only, never a client bundle (T02 handoff).
  transpilePackages: [
    "@plinth/calc",
    "@plinth/contracts",
    "@plinth/fixtures",
    "@plinth/tokens",
    "@plinth/web-ui",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
