#!/usr/bin/env node
// Initial-load JS budget (T39 M1 gate; BUILD_PLAN §3 M1, DECISIONS E-11).
//
// Counts the JavaScript a route loads before it is interactive: the chunks its
// build manifests name for the first load, gzipped as `next start` serves
// them. It leaves out what arrives *after* load: the client chunks the App
// Router preloads when it prefetches the links in view (PR #50 named them:
// /search and /compare, home islands, the developer chart). Lighthouse's
// `resource-summary:script:size` counts those too, because they finish inside
// its capture window, so it stays in lighthouserc.cjs as the looser
// whole-window ceiling.
//
// The chunk set comes from two places that must agree:
//   1. the manifests: build-manifest.json `rootMainFiles` plus the route's
//      page_client-reference-manifest.js `entryJSFiles` for its layouts and page;
//   2. the prerendered HTML: every `<script src>` except the `noModule`
//      polyfill (modern browsers skip it).
// A chunk in one set and not the other fails the run: the count would be wrong.
//
// Run after `npm run build`:  node scripts/initial-js.mjs   (from apps/web)
// Exit 1 when a route with an error budget is over it, or the sets disagree.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { gzipSync } from "node:zlib";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NEXT = join(APP, ".next");
const KB = 1024;

/**
 * The routes measured. Over `budget` (KB gzip): "error" fails the run, "warn"
 * prints a warning (and a GitHub annotation in CI), "info" only reports.
 * The project page measured 152.3 KB at the M1 gate (20 Oct 2026; DECISIONS
 * E-11), so its 150 KB budget is a warning until the page is under it; then
 * make it "error".
 */
const ROUTES = [
  {
    url: "/gurugram/projects/aurelia-heights-phase-2",
    segment: "(public)/gurugram/projects/[slug]",
    html: "gurugram/projects/aurelia-heights-phase-2.html",
    budget: 150,
    level: "warn",
  },
  { url: "/", segment: "(public)", html: "index.html", budget: 150, level: "info" },
  {
    url: "/methodology",
    segment: "(public)/methodology",
    html: "methodology.html",
    budget: 150,
    level: "info",
  },
];

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/** `entryJSFiles` of a route's client reference manifest (a script that sets a global). */
function entryJsFiles(segment) {
  const file = join(NEXT, "server", "app", segment, "page_client-reference-manifest.js");
  const sandbox = {};
  sandbox.globalThis = sandbox;
  runInNewContext(readFileSync(file, "utf8"), sandbox);
  const entries = Object.values(sandbox.__RSC_MANIFEST ?? {})[0]?.entryJSFiles;
  if (!entries) throw new Error(`no entryJSFiles in ${file}`);
  return entries;
}

function manifestChunks(segment) {
  const build = readJson(join(NEXT, "server", "app", segment, "page", "build-manifest.json"));
  const chunks = new Set(build.rootMainFiles);
  for (const [key, files] of Object.entries(entryJsFiles(segment))) {
    // The route's own tree: every layout above it and the page itself.
    if (/\/(layout|page)$/.test(key)) for (const f of files) chunks.add(f);
  }
  return chunks;
}

function htmlChunks(htmlFile) {
  const html = readFileSync(join(NEXT, "server", "app", htmlFile), "utf8");
  const chunks = new Set();
  for (const m of html.matchAll(/<script\b([^>]*)\bsrc="\/_next\/([^"]+\.js)"([^>]*)>/g)) {
    if (/\bnoModule\b/i.test(`${m[1]} ${m[3]}`)) continue;
    chunks.add(m[2]);
  }
  return chunks;
}

const gz = (file) => gzipSync(readFileSync(join(NEXT, file))).length;
const kb = (bytes) => (bytes / KB).toFixed(1);

if (!existsSync(join(NEXT, "BUILD_ID"))) {
  console.error("initial-js: no build in apps/web/.next. Run `npm run build` first.");
  process.exit(1);
}

let failed = false;
for (const r of ROUTES) {
  const fromManifest = manifestChunks(r.segment);
  const fromHtml = htmlChunks(r.html);
  const onlyManifest = [...fromManifest].filter((c) => !fromHtml.has(c));
  const onlyHtml = [...fromHtml].filter((c) => !fromManifest.has(c));
  const chunks = [...new Set([...fromManifest, ...fromHtml])].sort();
  const sizes = chunks.map((c) => ({ c, bytes: gz(c) }));
  const total = sizes.reduce((s, x) => s + x.bytes, 0);
  const over = total > r.budget * KB;
  const verdict = !over
    ? "ok"
    : { error: "FAIL", warn: "WARN over budget", info: "over (info)" }[r.level];
  const line = `${r.url}: ${kb(total)} KB gzip initial JS in ${chunks.length} chunks · budget ${r.budget} KB (${r.level}) · ${verdict}`;
  console.log(line);
  if (over && r.level === "warn" && process.env.GITHUB_ACTIONS)
    console.log(`::warning title=Initial JS budget::${line}`);
  for (const { c, bytes } of sizes.sort((a, b) => b.bytes - a.bytes))
    console.log(`    ${kb(bytes).padStart(6)} KB  ${c.replace("static/chunks/", "")}`);
  if (onlyManifest.length || onlyHtml.length) {
    failed = true;
    console.log(
      `    FAIL manifest and HTML disagree: manifest only [${onlyManifest.join(", ")}], HTML only [${onlyHtml.join(", ")}]`,
    );
  }
  if (over && r.level === "error") failed = true;
}
process.exit(failed ? 1 : 0);
