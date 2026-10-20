// Lighthouse CI (T05; BUILD_PLAN §7 "Performance"): the fixture build, mobile
// preset with simulated throttled 4G, 3 runs per URL, best run asserted.
// Run after `npm run build`: `npm run -w @plinth/web lhci`. Reports stay on disk
// (.lighthouseci/), never on a public server.
//
// Budgets (BUILD_PLAN §7): project page ≤ 150 KB JS (gzip), LCP ≤ 2.5 s,
// CLS < 0.1. JS, CLS and accessibility are errors from day one.
//
// T20a tried making the project page's LCP budget an error, not a warning,
// as BUILD_PLAN §7 asks ("the 2.5 s load-time budget becomes a hard check on
// this page", INTEGRATION_NOTES). On the ci-web runner it stayed a warning
// instead: a CI run measured LCP at 2720–2903 ms for the project page, but
// *also* 2890–2891 ms for the still-empty Home and Methodology stubs — i.e.
// every page on this runner, content or no content, currently lands past
// 2.5 s under the mobile/throttled-4G Lighthouse preset, so erroring only
// the project page would block this PR on a runner/throttle characteristic
// no page-level change here can fix, not a regression this task introduced
// (the project page's own best run was the fastest of the three). Left as a
// warning with this evidence; worth the lead's attention (preset tuning,
// runner tier, or revisiting the 2.5 s figure for CI specifically) before a
// later task turns it into a real error.
//
// The site-wide script-size budget is widened from 150 KB to 200 KB. The
// 150 KB figure was measured against an empty stub (next runtime + fonts
// only, ~140 KB, "JS headroom is about 11 KB" per INTEGRATION_NOTES); the
// real project page adds the signature replay tower (@plinth/web-ui's
// TowerStack/Riskometer/ReplaySlider) and the evidence drawer (a Radix
// Dialog), genuinely interactive client code the task asks for. Measured
// transfer size ran 156–170 KB across repeated `npm run lhci` runs (the
// resource-summary audit's capture window is timing-sensitive here, not a
// fixed number; it also varies with machine load). This widens the budget
// for every URL, not only the project page — an `assertMatrix` entry scoped
// to one URL for this one key proved unreliable (the override sometimes
// didn't apply; a shared, simple number is the robust fix). T21/T25 can
// tighten the budget again per page once Home and Methodology are real and
// their own costs are known.
//
// M1 perf gate (lead, 20 Oct 2026): investigated bringing LCP under 2.5 s and
// the project page's script budget back to 150 KB (BUILD_PLAN §7). Numbers
// below are repeat-measured `npm run lhci` best/worst runs, local machine
// (headroom left for CI being slower, per the task brief) — before → after
// this PR's changes:
//   /                        LCP 2.1–3.7 s → 1.7–3.5 s   JS 175.9 → 176.0 KB
//   /gurugram/.../aurelia-*  LCP 3.4–4.0 s → 3.3–3.5 s   JS 196.1 → 196.1 KB
//   /methodology             LCP 2.8–2.9 s → 2.48–2.49 s JS 175.9 → 176.0 KB
// (CLS stayed 0 on every page/run; accessibility 1.0; best-practices 0.96.)
//
// What actually moved LCP: `src/shell/fonts.ts` loaded Bricolage Grotesque
// as the full "variable" weight range (200..800) plus the `opsz` axis, when
// every `font-display` usage in the codebase is paired with `font-extrabold`
// (grep confirms no other weight is ever rendered, and the mobile app bundles
// the same family as a single static weight-800 instance for the same
// reason). Pinning `weight: "800"` and dropping `axes: ["opsz"]` (next/font
// only allows `axes` when the weight is "variable" — the font's own full
// variable range was otherwise unconditionally fetched) is a real, repeated,
// measured win on `/methodology`, whose LCP element is Mukta body text: every
// `npm run lhci` run after the change landed in a narrow 2.48–2.49 s band,
// down from 2.78–2.9 s. It is NOT a reliable win on `/` or the project page,
// whose LCP elements are the hero heading and the hero image respectively —
// both still show the same 300–900 ms of run-to-run variance this machine
// had before the change, so none of the three is promoted to "error" below;
// `/methodology`'s margin (~10 ms under 2500, not the ~300 ms of CI headroom
// the task brief asks to leave) isn't safe to gate on yet either.
//
// What did NOT move the script-size number, despite being exactly what the
// task asked to try, with the evidence for why: the project page's own JS
// (RiskInstrument/Riskometer, BuiltSection/TowerStack/ReplaySlider, the
// evidence drawer) is only ~20 KB of the ~196 KB total — the other ~176 KB is
// the Next.js/React App Router runtime, present identically on every page
// including the empty stubs (confirmed by grepping the two biggest shared
// chunks for `hydrateRoot`/`AppRouterContext`/`Suspense` and
// `createFromFetch`/`flushSync`/`preloadModule`/`useFormStatus` — this is
// framework baseline, not page content). So 150 KB is arithmetically out of
// reach without reducing that baseline, which is outside this task's
// Handoffs (next.config.ts isn't a lead-authorised path here). Still worth
// doing and left in: `apps/web/src/features/project/page/evidence-context.tsx`
// now loads `EvidenceDrawer` (and the Radix Dialog it's built on) with a
// plain `import()` inside `open()`, only once a source chip is actually
// clicked, instead of a static import that ships Radix Dialog's code to
// every visitor whether or not they ever open the drawer; and
// `packages/web-ui/src/primitives/{sheet,button}.tsx` import
// `radix-ui/dialog` / `radix-ui/slot` instead of the unified `radix-ui`
// package's root barrel, which re-exports all 30+ Radix primitives from one
// module. Measured with a clean `rm -rf .next && npm run build && npm run
// lhci` before and after each change (a stale `next start` left bound to
// :3200 from an earlier run gave false "big win" readings the first time
// through — always verify the port is free before trusting a number): in
// this Turbopack production build, the ~16 KB chunk holding the project
// page's own client code keeps the Radix Dialog internals in it regardless
// of `next/dynamic` (`ssr: true` or `false`) or a bare `import()` — Turbopack
// folds the small on-demand target back into the page's one client chunk
// rather than issuing a separate request for it. Two concrete next steps,
// both outside this task's Handoffs: add `@plinth/web-ui` (and maybe
// `radix-ui`) to `next.config.ts`'s `experimental.optimizePackageImports`
// (exists for exactly this barrel-import case, per
// node_modules/next/dist/docs/.../optimizePackageImports.md); or give
// `packages/web-ui/package.json` a subpath export for the evidence drawer
// specifically, so the dynamic import target is unambiguous to the bundler.
//
// M1 perf gate, part 2 (lead, 20 Oct 2026). Same tool, 3 runs per URL, local.
// Changes: home explore thumbnails get `sizes="128px"` (they were fetched at
// w=3840: 612 -> 92 KB of images on /); BuiltSection gets only the two
// slices it reads instead of the whole ProjectPage (project HTML 45.0 ->
// 40.4 KB gzip); turbopackChunking.minChunkSize 200 KB (fewer, merged chunks).
// Before -> after, all three runs:
//   /             LCP 1.70/3.49/3.55 -> 2.95/3.09/3.09 s   JS 176.0 -> 173.6 KB
//   project page  LCP 3.32/3.32/3.54 -> 3.16/3.16/3.24 s   JS 196.1 -> 193.2 KB
//   /methodology  LCP 2.48/2.48/2.49 -> 2.48/2.48/2.48 s   JS 176.0 -> 173.6 KB
// (/'s 1.70 s was one run where the scripts stalled until after first paint;
// the other runs, before and after, are the real figure.)
// Why neither gate is reached, so both stay as they are below:
// - JS: ~139 KB of every page is Next/React itself (react-dom + app
//   bootstrap ~70.7, router/segment cache ~45.0, other Next client code
//   ~10.5, runtime ~4.2, layout router ~3.9, next/link + ThemeToggle ~4.3).
//   The project page adds ~15.8 KB of its own, and ~38.8 KB more arrives
//   after load because the links in view are prefetched and the router
//   preloads their routes' client chunks (search/compare ~21.4, home ~13.7,
//   developer ~3.7). The shared layout pulls in no web-ui code; barrel
//   imports are already tree-shaken (optimizePackageImports changed nothing).
// - LCP: in Lighthouse's simulation everything that finished before the real
//   paint counts. Here that is always the document, five preloaded font
//   files (~77 KB), the CSS and all ~139 KB of framework JS, so even
//   /methodology (no page JS) sits at 2.48 s. `next start` also serves
//   HTTP/1.1. Re-auditing the same saved runs with the protocol set to h2
//   (what Vercel serves) gave / 2.25, project 2.48, /methodology 1.88 s.
//
// M1 exit gate (T39, lead decision, DECISIONS E-11). How the two M1 targets
// are measured from now on:
// - LCP over HTTP/2, as production serves it. `scripts/lhci-h2-server.mjs`
//   starts `next start` on :3201 and a TLS + h2 proxy on :3200 (a throwaway
//   self-signed certificate; Chrome runs with --ignore-certificate-errors).
//   Same bytes, same requests; only the protocol differs from before.
// - Project-page JS as initial-load JS: `scripts/initial-js.mjs` sums the
//   gzipped chunks the build manifests name for the route's first load (and
//   checks them against the prerendered HTML), so the link-prefetch chunks
//   that arrive after load (PR #50) are not counted. ci-web runs it after the
//   build. The whole-window figure below stays as a looser ceiling.
// The measured numbers and which assertions are errors are in DECISIONS E-11.
const BASE = "https://127.0.0.1:3200";
const PROJECT_URL = `${BASE}/gurugram/projects/aurelia-heights-phase-2`;

/** The assertions every URL gets; only the LCP level differs per URL (below). */
const assertions = (lcpLevel) => ({
  // Every script that finishes in Lighthouse's window, link prefetch
  // included. The 150 KB project-page budget is initial-load JS
  // (scripts/initial-js.mjs).
  "resource-summary:script:size": ["error", { maxNumericValue: 200 * 1024 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
  "categories:accessibility": ["error", { minScore: 0.9 }],
  "largest-contentful-paint": [lcpLevel, { maxNumericValue: 2500 }],
  "categories:performance": ["warn", { minScore: 0.9 }],
});

module.exports = {
  ci: {
    collect: {
      startServerCommand: "node scripts/lhci-h2-server.mjs --port 3200 --upstream 3201",
      startServerReadyPattern: "h2 proxy ready",
      startServerReadyTimeout: 60000,
      url: [`${BASE}/`, PROJECT_URL, `${BASE}/methodology`],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--no-sandbox --headless=new --ignore-certificate-errors",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        // Stubs are noindex on purpose (placeholderMetadata).
        skipAudits: ["is-crawlable"],
      },
    },
    assert: {
      // Two mutually exclusive URL groups, each with the full set, so exactly
      // one entry applies to every URL. They differ only in LCP's level.
      assertMatrix: [
        {
          // The project page: LCP over h2 measured 2517–2634 ms at the gate,
          // so it stays a warning until it is under 2500 (E-11).
          matchingUrlPattern: "/gurugram/projects/",
          assertions: assertions("warn"),
        },
        {
          // `/` and `/methodology`: under 2500 over h2, so LCP is an error.
          matchingUrlPattern: "^(?!.*/gurugram/projects/)",
          assertions: assertions("error"),
        },
      ],
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
