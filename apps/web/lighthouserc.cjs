// Lighthouse CI (T05; BUILD_PLAN §7 "Performance"): the fixture build, mobile
// preset with simulated throttled 4G, 3 runs per URL, best run asserted.
// Run after `npm run build`: `npm run -w @plinth/web lhci`. Reports stay on disk
// (.lighthouseci/), never on a public server.
//
// Budgets (BUILD_PLAN §7): project page ≤ 150 KB JS (gzip), LCP ≤ 2.5 s,
// CLS < 0.1. JS, CLS and accessibility are errors from day one.
//
// T20a: the project page is real now (src/features/project), so its LCP
// budget is an error, not a warning, as BUILD_PLAN §7 asks ("the 2.5 s
// load-time budget becomes a hard check on this page", INTEGRATION_NOTES).
// Home and Methodology are still stubs at this wave, so they keep LCP as a
// warning until their own tasks (T21, T25) replace them.
const BASE = "http://127.0.0.1:3200";
const PROJECT_URL = `${BASE}/gurugram/projects/aurelia-heights-phase-2`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start -- --port 3200",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 60000,
      url: [`${BASE}/`, PROJECT_URL, `${BASE}/methodology`],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --headless=new",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        // Stubs are noindex on purpose (placeholderMetadata).
        skipAudits: ["is-crawlable"],
      },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: ".*",
          assertions: {
            "resource-summary:script:size": ["error", { maxNumericValue: 150 * 1024 }],
            "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
            "categories:accessibility": ["error", { minScore: 0.9 }],
            "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
            "categories:performance": ["warn", { minScore: 0.9 }],
          },
        },
        {
          matchingUrlPattern: `^${PROJECT_URL}$`,
          assertions: {
            "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
          },
        },
      ],
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
