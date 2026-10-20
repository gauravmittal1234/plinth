// T26 · WebPricing (WORK_BREAKDOWN T26 accept). Fixture mode, the Free/Pro
// switch on the Aurelia sample: toggling the tab changes only the right
// half, never the left (the signature); no countdown and no pre-ticked box
// anywhere on the page; the buy button is a sample, never a real charge.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const URL = "/pricing";

test.describe("WebPricing", () => {
  test("one heading and the sample's Free/Pro tabs", async ({ page }) => {
    const res = await page.goto(URL);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's free, and what's Pro?");
    await expect(page.getByText("₹999", { exact: false }).first()).toBeVisible();
  });

  test("toggling Free/Pro changes only the right half of the sample", async ({ page }) => {
    await page.goto(URL);
    const left = page.getByTestId("sample-left");
    const right = page.getByTestId("sample-right");

    await expect(left).toContainText("Aurelia Heights, Phase 2");
    await expect(left).toContainText("Elevated");
    const leftBefore = await left.innerHTML();
    const rightBefore = await right.innerHTML();
    expect(rightBefore).not.toContain("Your Pro report");

    await page.getByTestId("pricing-tab-pro").click();

    const leftAfter = await left.innerHTML();
    expect(leftAfter).toBe(leftBefore);
    await expect(left).toContainText("Aurelia Heights, Phase 2");
    await expect(left).toContainText("Elevated");

    const rightAfter = await right.innerHTML();
    expect(rightAfter).not.toBe(rightBefore);
    await expect(right).toContainText("Your Pro report");

    // Back to Free: the left half is still exactly the same.
    await page.getByTestId("pricing-tab-free").click();
    expect(await left.innerHTML()).toBe(leftBefore);
  });

  test("no countdown and no pre-ticked box", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByTestId("pricing-whatsapp-checkbox")).not.toBeChecked();
    // A ticking countdown would render an HH:MM:SS (or similar) clock face;
    // this page never does, even though the "never" list names one as a thing
    // Plinth doesn't do.
    await expect(page.getByText(/\d{1,2}:\d{2}:\d{2}/)).toHaveCount(0);
    await expect(page.getByText("A countdown, or an offer", { exact: false })).toBeVisible();
  });

  test("the buy button raises a sample-only toast, never a real charge", async ({ page }) => {
    await page.goto(URL);
    await page.getByTestId("pricing-buy").click();
    await expect(page.getByRole("status")).toContainText("Sample only: nothing was charged");
    // Pressing buy previews the Pro view, as a buyer would see it.
    await expect(page.getByTestId("sample-right")).toContainText("Your Pro report");
  });

  test("Never on a Plinth paywall, and the refund policy", async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole("heading", { name: "Never on a Plinth paywall" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What if Pro wasn't worth it?" })).toBeVisible();
    await expect(page.getByText("Full refund within 7 days", { exact: false }).first()).toBeVisible();
  });

  test("no serious or critical a11y violations", async ({ page }) => {
    await page.goto(URL);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
