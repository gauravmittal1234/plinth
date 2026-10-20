import type { NextConfig } from "next";

// WebDeveloper's fixture preview (src/features/developer/page/preview.ts)
// keeps its public query URL, but renders from an internal `~preview` route
// so the canonical /gurugram/developers/[slug] never reads `searchParams` and
// stays prerendered. The state list is DEVELOPER_PREVIEW_STATES: keep them in
// step. `beforeFiles`, so the rewrite wins over the prerendered canonical page.
const developerPreviewRewrites = [
  {
    source: "/gurugram/developers/:slug",
    has: [{ type: "query" as const, key: "state", value: "(?<state>facts_only)" }],
    destination: "/gurugram/developers/:slug/~preview/state/:state",
  },
];

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
  async rewrites() {
    return { beforeFiles: [...developerPreviewRewrites] };
  },
};

export default nextConfig;
