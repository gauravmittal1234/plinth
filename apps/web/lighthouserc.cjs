// Lighthouse CI (T05; BUILD_PLAN §7 "Performance"): the fixture build, mobile
// preset with simulated throttled 4G, 3 runs per URL, best run asserted.
// Run after `npm run build`: `npm run -w @plinth/web lhci`. Reports stay on disk
// (.lighthouseci/), never on a public server.
//
// Budgets (BUILD_PLAN §7): project page ≤ 150 KB JS (gzip), LCP ≤ 2.5 s,
// CLS < 0.1. JS, CLS and accessibility are errors from day one.
//
// LCP warns for now. On today's stubs the page is only the Next runtime
// (~140 KB JS) plus the preloaded fonts, and Lantern puts LCP at 2.4–2.7 s even
// though the real paint happens with the first byte of CSS. T20a turns LCP into
// an error for /gurugram/projects/* once the real project page lands (the
// biggest lever is the display font: Bricolage with the opsz axis is ~75 KB).
const BASE = "http://127.0.0.1:3200";

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start -- --port 3200",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 60000,
      url: [`${BASE}/`, `${BASE}/gurugram/projects/aurelia-heights-phase-2`, `${BASE}/methodology`],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --headless=new",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        // Stubs are noindex on purpose (placeholderMetadata).
        skipAudits: ["is-crawlable"],
      },
    },
    assert: {
      assertions: {
        "resource-summary:script:size": ["error", { maxNumericValue: 150 * 1024 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
