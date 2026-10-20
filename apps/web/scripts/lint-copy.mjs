#!/usr/bin/env node
// Copy lint for apps/web (T05; BUILD_PLAN §12.11, DESIGN §0, §2, §6). Runs the
// repo's banned-word lint (scripts/ci/lint-copy.mjs, owned by T00) over this
// app's source only, so `npm run -w @plinth/web lint` catches banned copy
// ("safe", "guaranteed", "% chance", "Learn more"…) before ci-guard does.
//
// Usage: node scripts/lint-copy.mjs        (from apps/web, or via npm -w)
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const LINT = resolve(ROOT, "scripts/ci/lint-copy.mjs");

// Same exclusions as the repo lint: tests and build output never reach a reader.
const SKIP = [
  /(^|\/)(node_modules|\.next|test|tests|e2e|__tests__|playwright-report|test-results)\//,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /\.d\.ts$/,
];

const files = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard", "--", "apps/web"],
  { cwd: ROOT, encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)
  .filter((f) => !SKIP.some((re) => re.test(f)));

if (files.length === 0) {
  console.log("lint-copy (apps/web): no files");
  process.exit(0);
}

try {
  execFileSync(process.execPath, [LINT, ...files], { cwd: ROOT, stdio: "inherit" });
} catch {
  process.exit(1);
}
