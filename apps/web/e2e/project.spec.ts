// T20a · WebProject (WORK_BREAKDOWN §4 T20a accept). Fixture mode, the
// Aurelia Heights, Phase 2 page: the central screen's hero, risk answer, next
// steps, the replay tower (the signature) and records.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const URL = "/gurugram/projects/aurelia-heights-phase-2";

test.describe("WebProject: Aurelia Heights, Phase 2", { tag: "@smoke" }, () => {
  test("one heading, the hero and the risk answer", async ({ page }) => {
    const res = await page.goto(URL);
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aurelia Heights, Phase 2");
    await expect(page.getByTestId("risk-chip")).toHaveText("Elevated");
    await expect(page.getByRole("heading", { name: "Will it be delivered on time?" })).toBeVisible();
    await expect(
      page.getByText("Between 30 and 45 of 100 similar Gurugram projects", { exact: false }),
    ).toBeVisible();
    await expect(page.getByText("after Apr 2029", { exact: false }).first()).toBeVisible();

    await expect(page.getByRole("contentinfo")).toContainText("No developer pays us. Ever.");
  });

  test("the 'On this page' rail lists the ten chapters", async ({ page }) => {
    await page.goto(URL);
    const rail = page.getByRole("navigation", { name: "On this page" });
    await expect(rail.getByRole("link")).toHaveCount(10);
    await expect(rail.getByRole("link", { name: "Delivery risk" })).toHaveAttribute(
      "href",
      "#risk",
    );
  });

  test("so what do we do now? gives Elevated's steps", async ({ page }) => {
    await page.goto(URL);
    const next = page.locator("#next");
    await expect(next.getByRole("heading", { name: "So what do we do now?" })).toBeVisible();
    await expect(next.getByText("Ask for it in writing.")).toBeVisible();
    await expect(next.getByRole("link", { name: "Kestrel Park" })).toHaveAttribute(
      "href",
      "/gurugram/projects/kestrel-park",
    );
  });

  test("the replay tower: never Elevated before the latest QPR, Elevated only at today", async ({
    page,
  }) => {
    await page.goto(URL);
    const built = page.locator("#built");
    await expect(built.getByRole("heading", { name: "How much is built?" })).toBeVisible();

    // Resting state: the latest filed quarter, Apr–Jun 2026, band then Moderate.
    const slider = built.getByRole("slider");
    await expect(slider).toHaveAttribute("aria-valuetext", "Apr–Jun 2026");
    await expect(built.getByText("Band then: Moderate")).toBeVisible();
    await expect(built).not.toContainText("Elevated");

    // Step through every earlier quarter: still never Elevated.
    const earlier = built.getByRole("button", { name: "Earlier report" });
    for (let i = 0; i < 7; i++) await earlier.click();
    await expect(slider).toHaveAttribute("aria-valuetext", "Apr–Jun 2023");
    await expect(built).not.toContainText("Elevated");

    // The one extra stop past the last QPR: today's real, current band.
    const later = built.getByRole("button", { name: "Later report" });
    for (let i = 0; i < 8; i++) await later.click();
    await expect(slider).toHaveAttribute("aria-valuetext", "Today");
    await expect(built.getByText("Elevated since 2 Oct 2026")).toBeVisible();
  });

  test("picking Tower A shows its own slab count", async ({ page }) => {
    await page.goto(URL);
    const built = page.locator("#built");
    await built.getByRole("button", { name: "A", exact: true }).click();
    await expect(built.getByText("Tower A, slab 9 of 20")).toBeVisible();
  });

  test("a source chip opens the evidence drawer", async ({ page }) => {
    await page.goto(URL);
    const risk = page.locator("#risk");
    await risk.getByRole("button", { name: "HARERA QPR · Apr–Jun 2026" }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleDescription(/^Filed 15 Jul 2026/);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("what do the records show? lists the sourced facts", async ({ page }) => {
    await page.goto(URL);
    const records = page.locator("#records");
    await expect(records.getByRole("heading", { name: "What do the records show?" })).toBeVisible();
    await expect(records.getByText("Registered Dec 2022", { exact: false })).toBeVisible();

    const preRera = records.getByText("Before RERA · from court orders and news");
    await expect(records.getByText("Northfield Greens, Sector 52")).toBeHidden();
    await preRera.click();
    await expect(records.getByText("Northfield Greens, Sector 52")).toBeVisible();
  });

  test("carries Residence and BreadcrumbList JSON-LD, server-rendered (M1 polish)", async ({
    page,
  }) => {
    await page.goto(URL);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((b) => JSON.parse(b) as Record<string, unknown>);

    const residence = parsed.find((b) => b["@type"] === "Residence");
    expect(residence?.name).toBe("Aurelia Heights, Phase 2");
    expect((residence?.additionalProperty as { value: string }[] | undefined)?.[0]?.value).toBe(
      "GGM/673/405/2022/117",
    );

    const breadcrumb = parsed.find((b) => b["@type"] === "BreadcrumbList");
    const items = breadcrumb?.itemListElement as { name: string }[] | undefined;
    expect(items?.map((i) => i.name)).toEqual(["Home", "Aurelia Heights, Phase 2"]);
  });

  test("axe finds no serious or critical violations", async ({ page }) => {
    await page.goto(URL);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("Night theme carries the band colours through", async ({ page }) => {
    await page.goto(URL);
    await page.getByRole("button", { name: "Night theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    await expect(page.getByTestId("risk-chip")).toBeVisible();
  });
});
