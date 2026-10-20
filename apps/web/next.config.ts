import type { NextConfig } from "next";

// WebProject's fixture previews (T20c; src/features/project/page/preview.ts)
// keep their public query URLs, but render from internal `~preview` routes so
// the canonical /gurugram/projects/[slug] never reads `searchParams` and stays
// prerendered. The state list is PROJECT_PREVIEW_STATES: keep them in step.
// `beforeFiles`, so the rewrite wins over the prerendered canonical page.
const projectPreviewRewrites = [
  {
    source: "/gurugram/projects/:slug",
    has: [
      {
        type: "query" as const,
        key: "state",
        value: "(?<state>severe|stalled|limited_history|not_scored|stale|rescoring|facts_only)",
      },
    ],
    destination: "/gurugram/projects/:slug/~preview/state/:state",
  },
  {
    source: "/gurugram/projects/:slug",
    has: [{ type: "query" as const, key: "view", value: "simple" }],
    destination: "/gurugram/projects/:slug/~preview/simple",
  },
];

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
  experimental: {
    // M1 perf gate: merge the small client chunks Turbopack emits by default
    // (raised from 50 KB of raw source). Same code, fewer requests: measured
    // 11 -> 8 script requests on / and /methodology, 14 -> 10 on the project
    // page, and 2.4-2.9 KB less JS transfer (headers and merged prefetch
    // chunks). `optimizePackageImports: ["@plinth/web-ui"]` was also tried
    // and left out: it produced byte-identical chunks, because web-ui's
    // `sideEffects` field already lets Turbopack drop unused barrel exports.
    turbopackChunking: { minChunkSize: 200000 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return { beforeFiles: [...projectPreviewRewrites, ...developerPreviewRewrites] };
  },
};

export default nextConfig;
