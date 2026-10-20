// T25 · WebMethodology + WebAbout (WORK_BREAKDOWN T25 accept). Fixture mode:
// the calibration backtest (DESIGN §5b C-15, about().calibration) and the
// founder-photo placeholder (about().identity, never an AI face).
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("WebAbout", () => {
  test("the calibration shows the base rate and Moderate's row", async ({ page }) => {
    const res = await page.goto("/about");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Who is Plinth?");

    const all = page.locator('[data-band="all"]');
    await expect(all).toContainText("212");
    await expect(all).toContainText("76");
    await expect(all).toContainText("36 of 100");
    await expect(page.getByText("About 36 of 100 past Gurugram", { exact: false })).toBeVisible();
    await expect(page.getByText("76 of 212", { exact: false }).first()).toBeVisible();

    const moderate = page.locator('[data-band="moderate"]');
    await expect(moderate).toContainText("Moderate");
    await expect(moderate).toContainText("15");
    await expect(moderate).toContainText("30");
    await expect(moderate).toContainText("31 of 100");
    await expect(moderate).toContainText("Above: more were late");

    await expect(page.getByText("Illustrative numbers")).toBeVisible();
  });

  test("the founder photo is a real photo, never AI-generated", async ({ page }) => {
    await page.goto("/about");
    await expect(
      page.getByText("A real photo, supplied by the founder", { exact: false }),
    ).toBeVisible();
  });

  test("the identity register names a checkable company and founder", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "Who runs Plinth?" })).toBeVisible();
    await expect(page.getByText("Founder and director")).toBeVisible();
    await expect(page.getByText("HARERA agent number")).toBeVisible();
  });

  test("the response-time board and coverage with Notify me", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "How fast do we answer?" })).toBeVisible();
    await expect(page.getByText("Report an error, from any page")).toBeVisible();

    await expect(page.getByRole("heading", { name: "What do we cover today?" })).toBeVisible();
    const notify = page.getByRole("button", { name: "Notify me" }).first();
    await notify.click();
    await expect(page.getByRole("status").first()).toContainText(
      "Waitlists aren’t open yet, so nothing was saved.",
    );
    await expect(page.getByText("On the waitlist")).not.toBeVisible();
  });

  test("no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/about");
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe("WebMethodology", () => {
  test("factor weights, red-flag rules, confidence states and the changelog", async ({ page }) => {
    const res = await page.goto("/methodology");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("How Delivery Risk works");

    // Factor weights (DESIGN §5b C-15: 30/30/20/15/5).
    const factors = page.locator("[data-factor]");
    await expect(factors).toHaveCount(5);
    await expect(page.locator('[data-factor="finances"]')).toContainText("30%");
    await expect(page.locator('[data-factor="site"]')).toContainText("5%");

    // Red-flag rules: 4 published rules.
    await expect(page.locator("[data-rule]")).toHaveCount(4);
    await expect(page.locator('[data-rule="RF1_GROUP_CIRP"]')).toContainText(
      "Insolvency (CIRP) admitted",
    );

    // Confidence states: high, low, limited_history, not_scored.
    await expect(page.locator("[data-confidence]")).toHaveCount(4);
    await expect(page.locator('[data-confidence="limited_history"]')).toContainText(
      "Not enough history to score",
    );

    // The changelog, v1.0 to v1.2, newest first with v1.2 marked Current.
    const versions = page.locator("[data-version]");
    await expect(versions).toHaveCount(3);
    await expect(versions.nth(0)).toHaveAttribute("data-version", "v1.2");
    await expect(versions.nth(0)).toContainText("Current");
    await expect(page.locator('[data-version="v1.0"]')).toContainText(
      "First public bands for Gurugram",
    );

    // A link to the calibration backtest.
    await expect(page.getByRole("link", { name: "See how we will check ourselves" })).toHaveAttribute(
      "href",
      "/about#calibration",
    );

    await expect(page.getByRole("contentinfo")).toContainText("No developer pays us. Ever.");
  });

  test("no serious or critical a11y violations", async ({ page }) => {
    await page.goto("/methodology");
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("carries Organization and BreadcrumbList JSON-LD, server-rendered (M1 polish)", async ({
    page,
  }) => {
    await page.goto("/methodology");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((b) => JSON.parse(b) as Record<string, unknown>);

    const organization = parsed.find((b) => b["@type"] === "Organization");
    expect(organization?.name).toBe("Plinth");

    const breadcrumb = parsed.find((b) => b["@type"] === "BreadcrumbList");
    const items = breadcrumb?.itemListElement as { name: string }[] | undefined;
    expect(items?.map((i) => i.name)).toEqual(["Home", "Methodology"]);
  });
});
