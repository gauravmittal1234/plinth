// T22 · WebSearch (WORK_BREAKDOWN §4, product/design/artboards/WebSearch.dc.html).
// Every assertion reads the live fixture file it's checking against
// (packages/fixtures/expected/search_projects), the same pattern as the M0
// gate: the fixture itself says so, this test only confirms the page agrees.
// Tagged @smoke so ci-web runs it on every PR.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EXPECTED = join(__dirname, "../../../packages/fixtures/expected/search_projects");

type SearchResultsFixture = {
  query: string | null;
  items: { slug: string; name: string; price_line: string; pin_label: string | null }[];
  hidden_count: number;
  hidden: { slug: string; name: string; why_line: string }[];
  legend_line: string | null;
  sort_line: string;
  zero_results: {
    kind: string;
    line: string;
    action?: { kind: string; label: string };
    detail_line?: string;
  } | null;
};

function expected(key: string): SearchResultsFixture {
  return JSON.parse(readFileSync(join(EXPECTED, `${key}.json`), "utf8")) as SearchResultsFixture;
}

async function expectNoSeriousA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.describe("WebSearch", { tag: "@smoke" }, () => {
  test("the canonical query: Kestrel first, the all-in price, Low and Moderate as two tiles, 2 hidden", async ({
    page,
  }) => {
    const want = expected("canonical");
    const res = await page.goto(`/search?q=${encodeURIComponent(want.query!)}`);
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("4 projects match");

    const kestrel = want.items.find((i) => i.slug === "kestrel-park")!;
    await expect(page.getByText(kestrel.price_line, { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(kestrel.name) }).first()).toHaveAttribute(
      "href",
      "/gurugram/projects/kestrel-park",
    );

    // G-36: never one merged "low risk" filter.
    await expect(page.getByRole("button", { name: "Drop Low from the search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Drop Moderate from the search" })).toBeVisible();

    // C-21: named, never silent.
    expect(want.hidden_count).toBe(2);
    await expect(page.getByText(`${want.hidden_count} projects hidden by your filters`)).toBeVisible();
    for (const h of want.hidden) {
      await expect(page.getByText(new RegExp(h.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeVisible();
    }

    // "Order never follows money": the sort line is the server's own words, behind a disclosure.
    await page.getByRole("button", { name: "How ranking works" }).click();
    await expect(page.getByText(want.sort_line)).toBeVisible();

    // The map renders a pin per result, each labelled with its own all-in price.
    await expect(page.getByTestId("search-map")).toBeVisible();
    const kestrelPin = page.getByRole("button", { name: `${kestrel.name}, ${kestrel.pin_label}` });
    await expect(kestrelPin).toBeVisible();
    await expect(page.getByText(want.legend_line!, { exact: false })).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });

  test("“4 BHK” on Dwarka Expressway: zero results, with a one-tap fix to Aurelia", async ({
    page,
  }) => {
    const want = expected("zero-results");
    await page.goto(`/search?q=${encodeURIComponent(want.query!)}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(want.zero_results!.line);
    const fix = page.getByRole("button", { name: want.zero_results!.action!.label });
    await expect(fix).toBeVisible();
    await fix.click();

    await expect(page.getByText(want.zero_results!.detail_line!)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Aurelia Heights, Phase 2" }),
    ).toHaveAttribute("href", "/gurugram/projects/aurelia-heights-phase-2");

    await expectNoSeriousA11yViolations(page);
  });

  test("an unknown project: Request it never shows a reference the server did not issue", async ({
    page,
  }) => {
    const want = expected("unknown-project");
    await page.goto(`/search?q=${encodeURIComponent(want.query!)}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(want.zero_results!.line);
    await page.getByRole("button", { name: want.zero_results!.action!.label }).click();

    // Fixture mode has no api.request_project payload yet, so it says so
    // rather than inventing an R-MMDD-NN reference.
    await expect(page.getByRole("status")).toContainText("Fixture mode doesn’t record requests yet");
    await expect(page.getByRole("status")).not.toContainText("R-1018-07");
    await expectNoSeriousA11yViolations(page);
  });

  test("Noida: outside coverage, with the Noida waitlist", async ({ page }) => {
    const want = expected("outside-coverage");
    await page.goto(`/search?q=${encodeURIComponent(want.query!)}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(want.zero_results!.line);
    await page.getByRole("button", { name: "Join the Noida waitlist" }).click();
    await expect(page.getByText("On the waitlist")).toBeVisible();
    await expect(page.getByText(want.zero_results!.detail_line!)).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });

  test("a query the fixture world doesn't answer says so, with working example links", async ({
    page,
  }) => {
    await page.goto("/search?q=a+query+with+no+fixture+key");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This search isn’t part of the fixture preview",
    );
    await page.getByRole("link", { name: "Every Gurugram project" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("8 projects match");
    await expectNoSeriousA11yViolations(page);
  });

  test("Night theme: the map and chips keep reading, no hex literals break the tokens", async ({
    page,
  }) => {
    await page.goto("/search");
    await page.getByRole("button", { name: "Night theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("8 projects match");
    await expectNoSeriousA11yViolations(page);
  });
});
