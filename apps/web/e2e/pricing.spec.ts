// T26 · WebPricing (WORK_BREAKDOWN T26 accept). Free at launch (founder
// decision, 20 Oct 2026): a short, server-rendered "Plinth is free" page.
// No sample, no buy flow, no refund policy; "Never on a Plinth paywall"
// stays. Proves "₹999", "Pro" and "refund" never appear on the page.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const URL = "/pricing";

test.describe("WebPricing", () => {
  test("the h1 and the lead line", async ({ page }) => {
    const res = await page.goto(URL);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What does Plinth cost?");
    await expect(page.getByText("Nothing. Plinth is free while we launch.")).toBeVisible();
  });

  test("Never on a Plinth paywall, and who pays us", async ({ page }) => {
    await page.goto(URL);
    const main = page.locator("#main");
    await expect(page.getByRole("heading", { name: "Never on a Plinth paywall" })).toBeVisible();
    await expect(page.getByText("A countdown, or an offer", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Who pays us?" })).toBeVisible();
    await expect(main.getByText("No developer pays us. Ever.")).toBeVisible();
    await expect(main.getByText("No lender or agent pays us at launch either.")).toBeVisible();
  });

  test("no Pro plan, no price and no refund policy anywhere on the page", async ({ page }) => {
    await page.goto(URL);
    const body = await page.locator("body").innerText();
    expect(body).not.toContain("₹999");
    expect(body).not.toMatch(/\bPro\b/);
    expect(body.toLowerCase()).not.toContain("refund");
    // No leftover paid-plan promises (one payment, renewals, checkout).
    expect(body).not.toMatch(/One payment|renews|checkout/i);
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
