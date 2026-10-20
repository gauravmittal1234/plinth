// T39 · M1 exit gate, web side (BUILD_PLAN §3 "M1: Know the builder";
// WORK_BREAKDOWN T39). It checks each M1 item the web owns and points at the
// tests that already prove the rest, so nothing is asserted twice:
//   - every §2.1 route answers 200 with no serious axe violation: smoke.spec.ts;
//   - page content: home, search, project(-sections, -states), developer,
//     compare, trust and pricing specs; the cards and SEO units in test/;
//   - API deep-equal, S1 on the server: ci-db (`test:api`, supabase/tests/gates/m1.sql);
//   - the JS and LCP budgets: ci-web (scripts/initial-js.mjs, lighthouserc.cjs).
//
// Three groups:
//   @smoke @gate  fixture mode, every PR (ci-web): the M1 screens are built
//                 (no stub left), all 8 seeded phases show their server chip,
//                 and the SEO and share plumbing is served.
//   @live         only in ci-gate-m1, against a PLINTH_DATA=supabase build on
//                 CI's seeded database. Skipped elsewhere.
//                 - PLINTH_GATE_TEXT_OUT=<file>: write Aurelia's visible text,
//                   once per build; the workflow diffs fixture against live.
//                 - PLINTH_GATE_S1=1: with bands_public off in the database,
//                   the page renders the S1 state the server sends.
import { expect, test, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GROUP_SLUGS, PHASE_SLUGS } from "@plinth/fixtures";
import { SCREENS } from "../../src/shell/screens";

const EXPECTED = join(__dirname, "../../../../packages/fixtures/expected");
const AURELIA = "/gurugram/projects/aurelia-heights-phase-2";

type Chip = { kind: string; label: string; meter_filled: number };
const expectedRisk = (slug: string) =>
  JSON.parse(readFileSync(join(EXPECTED, "risk_summary", `${slug}.json`), "utf8")) as {
    chip: Chip;
    phase: { name: string };
  };

/** The page's visible text, one trimmed line per line of text, blanks dropped. */
async function visibleText(page: Page): Promise<string> {
  const text = await page.locator("body").innerText();
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// BUILD_PLAN §3 M1: "Web: Home, Search, Project + States, Developer, Compare,
// Methodology, About, Pricing … Share cards, SEO plumbing".
const M1_WEB = [
  "WebHome",
  "WebSearch",
  "WebProject",
  "WebDeveloper",
  "WebCompare",
  "WebMethodology",
  "WebAbout",
  "WebPricing",
  "Share cards",
];

test.describe("M1 gate: the web screens", { tag: ["@smoke", "@gate"] }, () => {
  const m1 = SCREENS.filter((s) => s.milestone === "M1");

  test("the M1 screen list is BUILD_PLAN §3's", () => {
    expect(m1.map((s) => s.name).sort()).toEqual([...M1_WEB].sort());
  });

  const samples = m1.flatMap((s) => [
    ...s.routes.map((r) => ({ name: s.name, sample: r.sample })),
    ...("variants" in s && s.variants ? s.variants : []).map((v) => ({
      name: v.name,
      sample: v.sample,
    })),
  ]);
  for (const { name, sample } of samples) {
    test(`${name} is built: ${sample}`, async ({ page, request }) => {
      if (sample.endsWith(".png")) {
        const res = await request.get(sample);
        expect(res.status()).toBe(200);
        expect(res.headers()["content-type"]).toContain("image/png");
        return;
      }
      const res = await page.goto(sample);
      expect(res?.status()).toBe(200);
      // A stub carries [data-screen] (src/shell/placeholder); no M1 screen may.
      await expect(page.locator("[data-screen]")).toHaveCount(0);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    });
  }

  for (const slug of PHASE_SLUGS) {
    test(`${slug} shows the chip its RiskSummary sends`, async ({ page }) => {
      const want = expectedRisk(slug);
      const res = await page.goto(`/gurugram/projects/${slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(want.phase.name);
      const chip = page.getByTestId("risk-chip");
      await expect(chip).toHaveText(want.chip.label);
      await expect(chip).toHaveAttribute("data-chip-kind", want.chip.kind);
      // The band scale marks the band only when there is one (the S1 test below relies on it).
      await expect(page.locator('#risk [aria-current="true"]')).toHaveCount(
        want.chip.kind === "band" ? 1 : 0,
      );
    });
  }

  test("SEO plumbing: robots, the sitemap and canonical URLs", async ({ page, request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/^Sitemap: https:\/\/\S+\/sitemap\.xml$/m);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      new URL(m[1]!).pathname.replace(/\/$/, ""),
    );
    // The entity pages T28 lists (src/seo/routes.ts). The trust pages are not
    // in the sitemap today; that is noted in the T39 PR, not asserted here.
    for (const path of [
      ...PHASE_SLUGS.map((s) => `/gurugram/projects/${s}`),
      ...GROUP_SLUGS.map((s) => `/gurugram/developers/${s}`),
    ])
      expect(locs, path).toContain(path);

    for (const path of [AURELIA, "/gurugram/developers/northfield-estates"]) {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`^https://[^/]+${path}$`),
      );
    }
  });
});

test.describe("M1 gate: live mode against CI's seeded database", { tag: "@live" }, () => {
  test("Aurelia's visible text, for the fixture-vs-live diff", async ({ page }) => {
    const out = process.env.PLINTH_GATE_TEXT_OUT;
    test.skip(!out, "ci-gate-m1 only: set PLINTH_GATE_TEXT_OUT");
    const res = await page.goto(AURELIA, { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.getByTestId("risk-chip")).toBeVisible();
    writeFileSync(out!, `${await visibleText(page)}\n`);
  });

  test.describe("S1: bands_public off in the database", () => {
    test.skip(!process.env.PLINTH_GATE_S1, "ci-gate-m1 only: set PLINTH_GATE_S1=1");

    /** One api.* read as the anonymous visitor, from the same API the build reads. */
    async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and _PUBLISHABLE_KEY are needed");
      const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          apikey: key,
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
          "content-profile": "api",
        },
        body: JSON.stringify(args),
      });
      expect(res.status, `api.${fn}`).toBe(200);
      return (await res.json()) as T;
    }

    type S1Risk = { display: { bands_public: boolean }; band: unknown; chip: Chip };
    type S1Page = { risk: S1Risk; hero: { summary_line: string } };

    for (const slug of ["aurelia-heights-phase-2", "kestrel-park"]) {
      test(`${slug}: the page shows what the server sends, and no band`, async ({ page }) => {
        const server = await rpc<S1Page>("project_page", { p_slug: slug });
        expect(server.risk.display.bands_public, "the database has bands_public off").toBe(false);
        expect(server.risk.band).toBeNull();
        expect(server.risk.chip.kind).toBe("withheld");

        await page.goto(`/gurugram/projects/${slug}`);
        const chip = page.getByTestId("risk-chip");
        await expect(chip).toHaveText(server.risk.chip.label);
        await expect(chip).toHaveAttribute("data-chip-kind", "withheld");
        await expect(chip.locator("[data-on]")).toHaveCount(0);
        // The band scale still lists the five bands, with none marked current.
        await expect(page.locator('#risk [aria-current="true"]')).toHaveCount(0);

        const text = await visibleText(page);
        expect(text).toContain(server.hero.summary_line);
        const fixtureBand = expectedRisk(slug).chip.label; // what bands-on shows (Elevated, Low)
        expect(text).not.toMatch(new RegExp(`Delivery risk:? ${fixtureBand}\\b`, "i"));
        expect(text).not.toMatch(/\b\d+ of 100 similar\b/);
      });
    }
  });
});
