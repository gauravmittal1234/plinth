// The eval runner CLI (T63). Recorded mode only; record.ts is the one live path.
//
//   deno task eval -- self-test                 the harness's own toy sets (must pass / must fail)
//   deno task eval -- --all                     every set under evals/ (CI)
//   deno task eval -- evals/claims/extract.marketing_claims [--json]
// Exit 1 when any set misses a gate (or the self-test does not behave), 2 on a usage error.

import type { SetReport } from "./runner.ts";
import { formatReport, runSet } from "./runner.ts";
import { discoverSets, EVALS_DIR, loadSet, REPO_ROOT } from "./sets.ts";

export const SELF_TEST_PASS = new URL("selftest/toy/", import.meta.url);
export const SELF_TEST_FAIL = new URL("selftest/toy-fail/", import.meta.url);

/** The gates the failing toy set must miss: a shared mistake and a recorded miss. */
export const SELF_TEST_EXPECTED_MISSES = [/^agreed_but_wrong 1 > 0$/, /^errors 1 > 0$/];

export interface SelfTestResult {
  ok: boolean;
  reports: SetReport[];
  problems: string[];
}

/** Runs the toy sets: the good one must pass, the broken one must fail for the right reasons. */
export async function selfTest(): Promise<SelfTestResult> {
  const good = await runSet(await loadSet(SELF_TEST_PASS));
  const bad = await runSet(await loadSet(SELF_TEST_FAIL));
  const problems: string[] = [];
  if (!good.passed) problems.push(`${good.set} should pass: ${good.misses.join("; ")}`);
  if (bad.passed) problems.push(`${bad.set} should fail but passed`);
  for (const re of SELF_TEST_EXPECTED_MISSES) {
    if (!bad.misses.some((m) => re.test(m))) problems.push(`${bad.set} should miss ${re.source}`);
  }
  return { ok: problems.length === 0, reports: [good, bad], problems };
}

function resolveSetArg(arg: string): URL {
  const clean = arg.replace(/\/+$/, "");
  if (clean.startsWith("/")) return new URL(`file://${clean}/`);
  return new URL(`${clean}/`, REPO_ROOT);
}

async function main(args: string[]): Promise<number> {
  const rest = args.filter((a) => a !== "--");
  const json = rest.includes("--json");
  const names = rest.filter((a) => a !== "--json");
  if (Deno.env.get("AI_MODE") === "live") {
    console.error("evals run recorded only; record.ts is the live path (nightly or dev)");
    return 2;
  }

  if (names[0] === "self-test") {
    const r = await selfTest();
    if (json) console.log(JSON.stringify(r, null, 2));
    else for (const rep of r.reports) console.log(formatReport(rep));
    console.log(r.ok ? "self-test ok" : `self-test FAILED:\n  ${r.problems.join("\n  ")}`);
    return r.ok ? 0 : 1;
  }

  const dirs = names.includes("--all") ? await discoverSets(EVALS_DIR) : names.map(resolveSetArg);
  if (!names.length) {
    console.error("usage: deno task eval -- self-test | --all | <set folder>… [--json]");
    return 2;
  }
  if (!dirs.length) {
    console.log("no eval sets yet (each AI task adds evals/<group>/<task>/gates.json)");
    return 0;
  }
  const reports: SetReport[] = [];
  for (const dir of dirs) reports.push(await runSet(await loadSet(dir)));
  if (json) console.log(JSON.stringify(reports, null, 2));
  else for (const r of reports) console.log(formatReport(r));
  const failed = reports.filter((r) => !r.passed).length;
  console.log(`${reports.length - failed} of ${reports.length} eval sets passed`);
  return failed ? 1 : 0;
}

if (import.meta.main) Deno.exit(await main(Deno.args));
