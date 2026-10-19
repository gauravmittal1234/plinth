#!/usr/bin/env node
// Root verification (WORK_BREAKDOWN §1 rule 9). Runs every check the local
// toolchain supports and SKIPS, with a clear message, any check whose tool is
// missing here. CI (one workflow per area, BUILD_PLAN §8) covers what is skipped.
//
//   node scripts/ci/verify.mjs all        # npm run verify
//   node scripts/ci/verify.mjs guard      # copy lint, secret guard, ownership (warn-only)
//   node scripts/ci/verify.mjs js         # turbo: lint, typecheck, test in every JS workspace
//   node scripts/ci/verify.mjs mobile     # flutter analyze + test (apps/mobile, packages/*/dart)
//   node scripts/ci/verify.mjs py         # ruff, ruff format --check, mypy, pytest (pipelines)
//   node scripts/ci/verify.mjs py-setup   # create pipelines/.venv and install (needs network)
//   node scripts/ci/verify.mjs db         # PGlite migration check; pgTAP when Docker + a local DB exist
//   node scripts/ci/verify.mjs edge       # Deno tests for supabase/functions (once T29 lands)
//
// VERIFY_SKIP=mobile,py skips steps by name.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { delimiter, join } from "node:path";
import { ROOT } from "./lib.mjs";

const results = [];
const skipped = new Set(
  (process.env.VERIFY_SKIP ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function onPath(bin) {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (dir && existsSync(join(dir, bin))) return true;
  }
  return false;
}

function run(cmd, args, opts = {}) {
  const pretty = [cmd, ...args].join(" ");
  console.log(
    `\n$ ${pretty}${opts.cwd && opts.cwd !== ROOT ? `   (in ${opts.cwd.replace(ROOT + "/", "")})` : ""}`,
  );
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    stdio: "inherit",
    env: { ...process.env, ...opts.env },
  });
  return r.status === 0;
}

function record(step, status, note = "") {
  results.push({ step, status, note });
}

function skip(step, note) {
  console.log(`\n-- skip ${step}: ${note}`);
  record(step, "skip", note);
}

function step(name, fn) {
  if (skipped.has(name)) return skip(name, "VERIFY_SKIP");
  console.log(`\n==== ${name} ====`);
  fn();
}

const STEPS = {
  guard() {
    step("guard", () => {
      const ok =
        run("node", ["scripts/ci/lint-copy.mjs", "--self-test"]) &&
        run("node", ["scripts/ci/lint-copy.mjs"]) &&
        run("node", ["scripts/ci/guard-secrets.mjs"]) &&
        run("node", ["scripts/ci/check-ownership.mjs", "--self-test"]) &&
        run("node", ["scripts/ci/check-ownership.mjs"]);
      record("guard", ok ? "pass" : "FAIL", "copy lint, secret guard, ownership (warn-only)");
      if (!onPath("gitleaks"))
        console.log("\n-- note: gitleaks is not installed locally; ci-guard runs it on every PR.");
    });
  },

  js() {
    step("js", () => {
      const turbo = join(ROOT, "node_modules", ".bin", "turbo");
      if (!existsSync(turbo)) {
        record("js", "FAIL", "node_modules missing: run `npm ci` first");
        return;
      }
      const ok = run(turbo, ["run", "lint", "typecheck", "test", "--output-logs=errors-only"], {
        env: { NEXT_TELEMETRY_DISABLED: "1", TURBO_TELEMETRY_DISABLED: "1", DO_NOT_TRACK: "1" },
      });
      record("js", ok ? "pass" : "FAIL", "turbo lint + typecheck + test (all workspaces)");
    });
  },

  mobile() {
    step("mobile", () => {
      if (!onPath("flutter")) return skip("mobile", "flutter not on PATH; ci-mobile runs it");
      const dartPkgs = readdirSync(join(ROOT, "packages"))
        .map((p) => join(ROOT, "packages", p, "dart"))
        .filter((d) => existsSync(join(d, "pubspec.yaml")));
      let ok = true;
      for (const d of dartPkgs) {
        ok =
          run("flutter", ["pub", "get"], { cwd: d }) &&
          run("flutter", ["analyze"], { cwd: d }) &&
          ok;
        if (existsSync(join(d, "test"))) ok = run("flutter", ["test"], { cwd: d }) && ok;
      }
      const app = join(ROOT, "apps", "mobile");
      ok =
        run("flutter", ["pub", "get"], { cwd: app }) &&
        run("flutter", ["analyze"], { cwd: app }) &&
        run("flutter", ["test"], { cwd: app }) &&
        ok;
      record(
        "mobile",
        ok ? "pass" : "FAIL",
        `flutter analyze + test (apps/mobile + ${dartPkgs.length} dart package(s))`,
      );
    });
  },

  py() {
    step("py", () => {
      const venvPy = join(ROOT, "pipelines", ".venv", "bin", "python");
      let py;
      if (existsSync(venvPy))
        py = (args) => run(venvPy, ["-m", ...args], { cwd: join(ROOT, "pipelines") });
      else if (onPath("uv"))
        py = (args) =>
          run("uv", ["run", "--frozen", "--extra", "dev", "python", "-m", ...args], {
            cwd: join(ROOT, "pipelines"),
          });
      else
        return skip(
          "py",
          "no pipelines/.venv and no uv: run `npm run py:setup` once (ci-pipelines runs it)",
        );
      const ok =
        py(["ruff", "check", "."]) &&
        py(["ruff", "format", "--check", "."]) &&
        py(["mypy"]) &&
        py(["pytest", "-q"]);
      record("py", ok ? "pass" : "FAIL", "ruff + ruff format + mypy + pytest (pipelines)");
    });
  },

  "py-setup"() {
    step("py-setup", () => {
      const python = ["python3.14", "python3"].find(onPath);
      if (!python) return record("py-setup", "FAIL", "python3.14 not found");
      const venv = join(ROOT, "pipelines", ".venv");
      const ok =
        (existsSync(join(venv, "bin", "python")) || run(python, ["-m", "venv", venv])) &&
        run(join(venv, "bin", "python"), ["-m", "pip", "install", "--quiet", "--upgrade", "pip"]) &&
        run(join(venv, "bin", "python"), [
          "-m",
          "pip",
          "install",
          "--quiet",
          "-e",
          join(ROOT, "packages", "contracts", "python"),
          "-e",
          `${join(ROOT, "pipelines")}[dev]`,
        ]);
      record(
        "py-setup",
        ok ? "pass" : "FAIL",
        "pipelines/.venv with plinth-pipelines[dev] + plinth-contracts (editable)",
      );
    });
  },

  db() {
    step("db", () => {
      const pglite = join(ROOT, "supabase", "tools", "pglite-check.mjs");
      if (existsSync(pglite))
        record("db:pglite", run("node", [pglite]) ? "pass" : "FAIL", "PGlite migration check");
      else skip("db:pglite", "supabase/tools/pglite-check.mjs arrives with T04");
      const hasDocker =
        onPath("docker") && spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
      if (!hasDocker)
        return skip(
          "db:pgtap",
          "pgTAP needs Docker (`supabase db start`); ci-db runs it on GitHub runners",
        );
      const status = spawnSync("supabase", ["status"], { cwd: ROOT, stdio: "ignore" }).status;
      if (status !== 0)
        return skip(
          "db:pgtap",
          "no local Supabase DB running: `supabase db start` first; ci-db runs it",
        );
      record(
        "db:pgtap",
        run("supabase", ["test", "db"]) ? "pass" : "FAIL",
        "supabase test db (pgTAP)",
      );
    });
  },

  edge() {
    step("edge", () => {
      const fnDir = join(ROOT, "supabase", "functions");
      if (!existsSync(join(fnDir, "deno.json")))
        return skip("edge", "supabase/functions/deno.json arrives with T29");
      const deno = onPath("deno") ? ["deno"] : ["npx", "--yes", "deno@2"];
      const ok = run(deno[0], [...deno.slice(1), "task", "test"], { cwd: fnDir });
      record("edge", ok ? "pass" : "FAIL", "deno task test (supabase/functions)");
    });
  },
};

const ORDER = ["guard", "js", "mobile", "py", "db", "edge"];
const target = process.argv[2] ?? "all";
const names = target === "all" ? ORDER : [target];
for (const n of names) {
  if (!STEPS[n]) {
    console.error(`unknown step "${n}". Use one of: all, ${Object.keys(STEPS).join(", ")}`);
    process.exit(2);
  }
  STEPS[n]();
}

console.log("\n==== verify summary ====");
for (const r of results) console.log(`${r.status.padEnd(5)} ${r.step.padEnd(10)} ${r.note}`);
const failed = results.filter((r) => r.status === "FAIL");
console.log(
  failed.length ? `\n${failed.length} step(s) failed.` : "\nverify: OK (skipped steps run in CI).",
);
process.exit(failed.length ? 1 : 0);
