// Generated files are committed and never drift: the authored JSON, the seed SQL and the Dart
// assets all rebuild byte-for-byte, and the seed is deterministic.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSeed } from "../scripts/build-seed.mjs";
import { plan as dartPlan } from "../scripts/sync-dart.mjs";
import { structuralProblems, listExpected } from "../scripts/validate.mjs";
import { buildAll } from "./author/build.mjs";
import { FIXTURES_DIR } from "./node";

const ROOT = join(FIXTURES_DIR, "../..");
const sha = (files: Record<string, string>) =>
  createHash("sha256")
    .update(
      Object.keys(files)
        .sort()
        .map((k) => `${k}\n${files[k]}`)
        .join("\n"),
    )
    .digest("hex");

describe("authored JSON", () => {
  it("canonical, expected and vectors rebuild with no diff", async () => {
    const files = (await buildAll()) as Record<string, string>;
    const drift = Object.entries(files)
      .filter(
        ([p, c]) =>
          !existsSync(join(FIXTURES_DIR, p)) || readFileSync(join(FIXTURES_DIR, p), "utf8") !== c,
      )
      .map(([p]) => p);
    expect(drift).toEqual([]);
  }, 30_000);
});

describe("seed", () => {
  it("builds deterministically (stable hash)", async () => {
    const a = (await buildSeed({ all: true })) as Record<string, string>;
    const b = (await buildSeed({ all: true })) as Record<string, string>;
    expect(sha(a)).toBe(sha(b));
    expect(Object.keys(a).sort()).toEqual([
      "10_catalogue.sql",
      "20_evidence.sql",
      "30_scoring.sql",
      "33_developer_says.sql",
      "35_developer_content.sql",
    ]);
    for (const c of Object.values(a))
      expect(c).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  it("skips a seedmap until its migrations exist", async () => {
    const t04 = (await buildSeed({
      migrations: ["20261020000400_t04_core_catalogue.sql"],
    })) as Record<string, string>;
    expect(t04["10_catalogue.sql"]).toContain("insert into core.phases");
    expect(t04["30_scoring.sql"]).toContain("insert into core.score_runs");
    expect(t04["35_developer_content.sql"]).toContain("-- SKIPPED");
    expect(t04["33_developer_says.sql"]).toContain("-- SKIPPED");
    // Claims and replies need only T12's tables (20261101), not T13's.
    const t12 = (await buildSeed({
      migrations: [
        "20261020000400_t04_core_catalogue.sql",
        "20261101000100_t12_ws_developer_claims_replies.sql",
      ],
    })) as Record<string, string>;
    expect(t12["33_developer_says.sql"]).toContain("insert into ws.developer_replies");
    expect(t12["33_developer_says.sql"]).toContain("'Ananya Rao'");
    expect(t12["33_developer_says.sql"]).toContain("'group'");
    expect(t12["35_developer_content.sql"]).toContain("-- SKIPPED");
    const none = (await buildSeed({ migrations: [] })) as Record<string, string>;
    for (const c of Object.values(none)) expect(c).toContain("-- SKIPPED");
  });

  it("the committed supabase/seed matches this branch's migrations", async () => {
    const files = (await buildSeed()) as Record<string, string>;
    for (const [f, c] of Object.entries(files))
      expect(readFileSync(join(ROOT, "supabase", "seed", f), "utf8"), f).toBe(c);
  });

  it("turns bands on for the fixture world and freezes the clock env", async () => {
    const all = (await buildSeed({ all: true })) as Record<string, string>;
    expect(all["30_scoring.sql"]).toContain(
      "update ops.feature_flags set enabled = true where key = 'bands_public'",
    );
    expect(all["10_catalogue.sql"]).toContain(
      "insert into ops.runtime_settings (key, value) values ('env', 'fixture')",
    );
    expect(all["10_catalogue.sql"]).not.toMatch(/alter database/i);
    expect(all["30_scoring.sql"]).toContain(
      "update ops.feature_flags set enabled = false where key in ('ai_ask', 'ai_doc_check', 'ai_staging')",
    );
    expect(all["10_catalogue.sql"]).not.toContain("PENDING");
  });
});

describe("Dart assets", () => {
  it("packages/fixtures/dart mirrors expected/ and vectors/", () => {
    const files = dartPlan() as unknown as Record<string, string>;
    const drift = Object.entries(files)
      .filter(
        ([p, c]) =>
          !existsSync(join(FIXTURES_DIR, "dart", p)) ||
          readFileSync(join(FIXTURES_DIR, "dart", p), "utf8") !== c,
      )
      .map(([p]) => p);
    expect(drift).toEqual([]);
  });
});

describe("expected payloads", () => {
  it("pass the structural contract checks (JSON Schema runs once T02 lands)", () => {
    const problems: string[] = [];
    for (const it of listExpected() as { fn: string; key: string; path: string }[])
      for (const p of structuralProblems(
        it.fn,
        JSON.parse(readFileSync(it.path, "utf8")),
      ) as string[])
        problems.push(`${it.fn}/${it.key}: ${p}`);
    expect(problems).toEqual([]);
  });
});
