// WebHome (T21; WORK_BREAKDOWN §4 accept): typing "aure" assembles the
// Aurelia card (Elevated, the real all-in/quoted price line). No lender is
// named anywhere (loans are R2, DESIGN §5b "Loans are R2"). axe is clean.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Real Indian home-loan lenders a page must never name (R1: "no lender party,
// loan referral or lender fee as live", DESIGN §5b). Plinth's own fictional
// names (Northfield, Orbis, Meridian…) don't collide with any of these.
const LENDER_NAMES = [
  "HDFC",
  "SBI",
  "ICICI",
  "Axis Bank",
  "Kotak Mahindra",
  "PNB Housing",
  "LIC Housing Finance",
  "Bajaj Finserv",
  "Bank of Baroda",
  "Punjab National Bank",
  "Can Fin Homes",
  "Indiabulls",
];

test.describe("WebHome", () => {
  // The page's motion (the slab stack, the needle sweep) jumps straight to
  // its final state under reduced motion, which is what every assertion here
  // wants to read (DESIGN §0 motion layer; packages/web-ui/src/lib/motion.ts).
  test.use({ reducedMotion: "reduce" });

  test("loads with the Aurelia card already assembled", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("[data-hero-card]");
    await expect(card).toHaveAttribute("data-hero-card", "aurelia-heights-phase-2");
    await expect(card).toContainText("Elevated");
    await expect(card).toContainText("₹2.74 Cr all-in · quoted ₹2.35 Cr");
  });

  test('the Ask box has id="ask" (INTEGRATION_NOTES, nav /#ask link)', async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#ask")).toHaveCount(1);
  });

  test('typing "aure" shows the Aurelia card with Elevated and the all-in price', async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#ask").fill("aure");
    const card = page.locator("[data-hero-card]");
    await expect(card).toHaveAttribute("data-hero-card", "aurelia-heights-phase-2", {
      timeout: 5000,
    });
    await expect(card).toContainText("Elevated");
    await expect(card).toContainText("₹2.74 Cr all-in · quoted ₹2.35 Cr");
  });

  test("a query that matches nothing shows Ask Plinth's coming-soon state, not a fabricated answer", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#ask").fill("zzz not a real project");
    await expect(page.getByText("Ask Plinth is coming soon.")).toBeVisible();
  });

  test("no lender is named anywhere on the page", async ({ page }) => {
    await page.goto("/");
    const text = await page.locator("body").innerText();
    for (const name of LENDER_NAMES) {
      expect(text, `should not mention the lender "${name}"`).not.toMatch(
        new RegExp(name, "i"),
      );
    }
  });

  test("axe is clean in Day and Night", async ({ page }) => {
    await page.goto("/");
    const day = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(day.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    await page.getByRole("button", { name: "Night theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
    const night = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(night.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
