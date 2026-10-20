// WebCompare (T24; WORK_BREAKDOWN §4 accept): adding Coral shows "progress
// 187 days old", the Aurelia cell shows the pending QPR line, and the URL
// state round-trips.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DEFAULT_PATH = "/compare?p=aurelia-heights-phase-2,kestrel-park,sapphire-grove-phase-1";

test.describe("WebCompare", () => {
  test.use({ reducedMotion: "reduce" });

  test("the default trio loads with the Aurelia cell showing the pending QPR line", async ({
    page,
  }) => {
    await page.goto(DEFAULT_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("How do these 3 compare?");
    await expect(page.locator('[data-compare-column="aurelia-heights-phase-2"]')).toBeVisible();

    const pendingCell = page.locator('[data-compare-cell="pending-aurelia-heights-phase-2"]');
    await expect(pendingCell).toContainText("Jul–Sep 2026 QPR not on HARERA yet (due 15 Oct)");
    await expect(pendingCell).toContainText("Developer says: filed 12 Oct, not yet verified.");
  });

  test('adding Coral shows "progress 187 days old", and the URL state round-trips', async ({
    page,
  }) => {
    await page.goto(DEFAULT_PATH);

    await page.getByRole("button", { name: "Add a project" }).first().click();
    await page.getByLabel("Search by name or RERA number").fill("Coral");
    await page.getByRole("button", { name: /Coral Towers/ }).click();

    const coralPending = page.locator('[data-compare-cell="pending-coral-towers"]');
    await expect(coralPending).toContainText("progress 187 days old", { timeout: 5000 });

    // The board's router.replace lands a tick after the re-render that the
    // assertion above already waited for, so wait for the URL itself too.
    await page.waitForURL((url) => url.searchParams.get("p")?.includes("coral-towers") ?? false);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/compare");
    expect(url.searchParams.get("p")?.split(",")).toEqual([
      "aurelia-heights-phase-2",
      "kestrel-park",
      "sapphire-grove-phase-1",
      "coral-towers",
    ]);

    // Round trip: reloading the URL the board just pushed reproduces the
    // same four-column state without replaying the add.
    await page.reload();
    await expect(page.locator('[data-compare-column="coral-towers"]')).toBeVisible();
    await expect(page.locator('[data-compare-cell="pending-coral-towers"]')).toContainText(
      "progress 187 days old",
    );
  });

  test("a column can be removed, and the URL drops back to 3 projects", async ({ page }) => {
    await page.goto(
      "/compare?p=aurelia-heights-phase-2,kestrel-park,sapphire-grove-phase-1,coral-towers",
    );
    await expect(page.locator('[data-compare-column="coral-towers"]')).toBeVisible();

    await page
      .locator('[data-compare-column="coral-towers"]')
      .getByRole("button", { name: /^Remove/ })
      .click();

    await expect(page.locator('[data-compare-column="coral-towers"]')).toHaveCount(0, {
      timeout: 5000,
    });
    await page.waitForURL((url) => !(url.searchParams.get("p")?.includes("coral-towers") ?? true));
    const url = new URL(page.url());
    expect(url.searchParams.get("p")?.split(",")).toEqual([
      "aurelia-heights-phase-2",
      "kestrel-park",
      "sapphire-grove-phase-1",
    ]);
  });

  test("the SEO pair route renders without crashing even without a fixture for that exact pair", async ({
    page,
  }) => {
    const res = await page.goto("/compare/aurelia-heights-phase-2-vs-kestrel-park");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    // A pair we can't show is never indexed.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("the SEO pair route names its projects in the title, with a canonical URL", async ({
    page,
  }) => {
    const pair = "aurelia-heights-phase-2-vs-kestrel-park-vs-sapphire-grove-phase-1";
    await page.goto(`/compare/${pair}`);
    await expect(page).toHaveTitle(
      /Aurelia Heights.* vs Kestrel Park vs Sapphire Grove.*: compare/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/compare/${pair}$`),
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("Ask Plinth's answer stays hidden while ai_ask is off", async ({ page }) => {
    await page.goto(DEFAULT_PATH);
    await expect(page.getByRole("button", { name: /^Ask Plinth/ })).toHaveCount(0);
  });

  test("axe is clean", async ({ page }) => {
    await page.goto(DEFAULT_PATH);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
