import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "../../supabase/functions/_shared/testing/mod.ts";
import { selfTest } from "./run.ts";
import { formatReport, runSet } from "./runner.ts";
import { toyRecordings } from "./selftest/make.ts";
import { discoverSets, EVALS_DIR, loadSet, REPO_ROOT } from "./sets.ts";

Deno.test("self-test: the toy set passes and the broken one misses the right gates", async () => {
  const r = await selfTest();
  assertEquals(r.problems, []);
  const [good, bad] = r.reports;
  assertEquals(good!.score.overall.precision, 1);
  assertEquals(Math.round(good!.score.overall.recall * 1000) / 1000, 0.833);
  assertEquals(good!.score.agreed_but_wrong, 0);
  assertEquals(Math.round(good!.score.agreement_rate! * 1000) / 1000, 0.833);
  assert(bad!.misses.includes("agreed_but_wrong 1 > 0"), bad!.misses.join("; "));
  assertStringIncludes(formatReport(bad!), "case flyer-3: recorded_miss");
});

Deno.test("the committed toy recordings equal what make.ts builds (SHA rule unchanged)", async () => {
  const files = await toyRecordings();
  assertEquals(files.length, 4);
  for (const { path, file } of files) {
    const committed = JSON.parse(await Deno.readTextFile(new URL(path, REPO_ROOT)));
    assertEquals(committed, file, path);
  }
});

Deno.test("a recorded-mode run never fetches, even on a miss", async () => {
  const set = await loadSet(new URL("selftest/toy-fail/", import.meta.url));
  const report = await runSet(set);
  assert(report.cases.some((c) => c.error?.startsWith("recorded_miss")));
});

Deno.test("discovery skips evals/lib (the harness and its self-test)", async () => {
  const sets = await discoverSets(EVALS_DIR);
  assertEquals(sets.filter((u) => u.href.includes("/evals/lib/")), []);
});
