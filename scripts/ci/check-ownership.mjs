#!/usr/bin/env node
// Ownership check (BUILD_PLAN §8 ci-guard; WORK_BREAKDOWN §1 rules 1–2).
// Parses OWNERSHIP.md, finds the PR's task from the branch name
// (task/T05-web-skeleton → T05) and WARNS for every changed path that the task
// does not own, and for frozen files. It never fails the build unless --strict.
//
// Usage:
//   node scripts/ci/check-ownership.mjs [--task T05] [--base origin/main] [--strict] [--self-test]
// Env: TASK_ID, GITHUB_HEAD_REF (set by Actions on pull_request), BASE_REF.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, globToRegExp, isMain, report } from "./lib.mjs";

const FROZEN = new Map([
  ["package.json", "root dependencies are frozen after T00 (a workspace's own scripts are fine)"],
  [
    "package-lock.json",
    "the lockfile is frozen after T00: dependencies change only in the lead's integrator PR",
  ],
  ["turbo.json", "the task graph is frozen after T00"],
  ["apps/mobile/pubspec.lock", "pub dependencies are frozen after T00"],
  ["apps/mobile/pubspec.yaml", "dependency lines are frozen after T00 (other lines belong to T06)"],
  ["pipelines/pyproject.toml", "Python dependencies are frozen after T00"],
  ["pipelines/uv.lock", "Python dependencies are frozen after T00"],
]);

export function parseOwnership(md) {
  const rows = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    const globs = [...cells[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    const owners = cells[1].match(/\bT\d+[a-z]?\b|\blead\b/g) ?? [];
    if (!globs.length || !owners.length) continue;
    for (const g of globs) rows.push({ glob: g, re: globToRegExp(g), owners });
  }
  return rows;
}

export function ownersOf(rows, file) {
  const owners = new Set();
  for (const r of rows) if (r.re.test(file)) r.owners.forEach((o) => owners.add(o));
  return owners;
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function currentBranch() {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

function changedFiles(base) {
  const out = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return out.split("\n").filter(Boolean);
}

function selfTest() {
  const rows = parseOwnership(readFileSync(join(ROOT, "OWNERSHIP.md"), "utf8"));
  const cases = [
    ["apps/web/src/features/home/hero.tsx", "T21", true],
    ["apps/web/src/features/home/hero.tsx", "T05", true],
    ["apps/web/src/features/home/hero.tsx", "T22", false],
    ["apps/web/app/(public)/gurugram/projects/[slug]/page.tsx", "T20a", true],
    ["apps/web/src/features/project/sections/cost/table.tsx", "T20b", true],
    ["apps/web/src/features/project/sections/hero/index.tsx", "T20b", false],
    ["supabase/migrations/20261020093000_T04_core.sql", "T04", true],
    ["supabase/migrations/20261101093000_T12_risk.sql", "T04", false],
    ["pipelines/plinth/scoring/engine.py", "T11", true],
    ["pipelines/plinth/core/fetch.py", "T10", true],
    ["packages/fixtures/expected/risk_summary/aurelia-heights-phase-2.json", "T03", true],
    ["packages/fixtures/expected/following_feed/rohan.json", "T03b", true],
    ["packages/fixtures/expected/following_feed/rohan.json", "T03", false],
    ["supabase/functions/wa-webhook/handlers/risk_card.test.ts", "T46a", true],
    ["apps/mobile/lib/features/project/states/stale.dart", "T31b", true],
  ];
  let failed = 0;
  for (const [file, task, want] of cases) {
    const got = ownersOf(rows, file).has(task);
    if (got !== want) {
      failed++;
      console.log(`self-test FAIL: ${file} owned by ${task}? got ${got}, want ${want}`);
    }
  }
  console.log(
    `check-ownership self-test: ${cases.length - failed}/${cases.length} passed (${rows.length} globs)`,
  );
  return failed === 0;
}

function main() {
  if (process.argv.includes("--self-test")) process.exit(selfTest() ? 0 : 1);
  const strict = process.argv.includes("--strict");
  const branch = currentBranch();
  const task = arg("--task") ?? process.env.TASK_ID ?? branch.match(/^task\/(T\d+[a-z]?)\b/)?.[1];
  if (!task) {
    console.log(`check-ownership: branch "${branch}" is not task/Txx-…; nothing to check.`);
    return;
  }
  if (task === "T00") {
    console.log("check-ownership: T00 creates the placeholders of every area; skipped.");
    return;
  }
  const base = arg("--base") ?? process.env.BASE_REF ?? "origin/main";
  let files;
  try {
    files = changedFiles(base);
  } catch {
    console.log(`check-ownership: cannot diff against ${base} (fetch it first); skipped.`);
    return;
  }
  const mdPath = join(ROOT, "OWNERSHIP.md");
  if (!existsSync(mdPath)) {
    console.log("check-ownership: OWNERSHIP.md missing; skipped.");
    return;
  }
  const rows = parseOwnership(readFileSync(mdPath, "utf8"));
  let warnings = 0;
  for (const f of files) {
    if (FROZEN.has(f)) {
      warnings++;
      report(
        "warning",
        f,
        0,
        `${task} touches a frozen file: ${FROZEN.get(f)}. Move it to a Handoff note.`,
      );
      continue;
    }
    const owners = ownersOf(rows, f);
    if (!owners.has(task)) {
      warnings++;
      const who = owners.size ? [...owners].join(", ") : "nobody listed (lead)";
      report(
        "warning",
        f,
        0,
        `${task} does not own this path (owner: ${who}). Use a Handoff note instead.`,
      );
    }
  }
  console.log(`check-ownership: ${task}, ${files.length} changed file(s), ${warnings} warning(s)`);
  if (strict && warnings) process.exit(1);
}

if (isMain(import.meta.url)) main();
