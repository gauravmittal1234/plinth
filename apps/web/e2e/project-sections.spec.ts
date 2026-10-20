// T20b · WebProject sections (WORK_BREAKDOWN §4 T20b accept): homes, cost,
// wait, before booking, picture and ask, over T20a's merged project page.
// A new file, not T20a's e2e/project.spec.ts (OWNERSHIP.md), so the two
// tasks' Playwright specs never collide.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const URL = "/gurugram/projects/aurelia-heights-phase-2";

test.describe("WebProject sections (T20b)", { tag: "@smoke" }, () => {
  test("homes: the 4 BHK has no cost sheet, so no all-in yet", async ({ page }) => {
    await page.goto(URL);
    const homes = page.locator("#homes");
    await expect(homes.getByRole("heading", { name: "What are the homes like?" })).toBeVisible();
    await expect(homes.getByText("No 4 BHK cost sheet, so no all-in yet.")).toBeVisible();
    await expect(homes.getByText("Reported waterlogging near Sector 37D")).toBeVisible();
  });

  test("cost: the all-in, and the from-developer plan with slab 12 flagged", async ({ page }) => {
    await page.goto(URL);
    const cost = page.locator("#cost");
    await expect(cost.getByRole("heading", { name: "What will I really pay?" })).toBeVisible();
    await expect(cost.getByText("Where the ₹2.74 Cr goes")).toBeVisible();
    await expect(
      cost.getByText("A demand for Tower A slab 12 went out on 10 Oct 2026, while the latest QPR shows slab 9."),
    ).toBeVisible();
    await expect(cost.getByRole("link", { name: "Check before you pay anything" })).toHaveAttribute(
      "href",
      "/check/before-you-pay",
    );
  });

  test("wait: shows ₹1,18,077 now and ₹2,00,563 by Dec 2027", async ({ page }) => {
    await page.goto(URL);
    const wait = page.locator("#wait");
    await expect(wait.getByRole("heading", { name: "Can we afford the wait?" })).toBeVisible();
    await expect(wait.getByText("₹1,18,077", { exact: false }).first()).toBeVisible();
    await expect(wait.getByText("₹2,00,563", { exact: false }).first()).toBeVisible();
  });

  test("before booking: loan copy stays to 2027, and never names a lender", async ({ page }) => {
    await page.goto(URL);
    const book = page.locator("#book");
    await expect(book.getByRole("heading", { name: "What else before booking?" })).toBeVisible();
    await expect(book.getByText("Loan checks arrive in 2027", { exact: true })).toBeVisible();
    const text = await book.innerText();
    for (const lender of ["HDFC", "SBI", "ICICI", "Axis Bank", "Kotak"]) {
      expect(text).not.toContain(lender);
    }
  });

  test("picture: drag reveals the AI-generated illustration over the original", async ({ page }) => {
    await page.goto(URL);
    const picture = page.locator("#picture");
    await expect(picture.getByRole("heading", { name: "Picture yourself here" })).toBeVisible();
    const slider = picture.getByRole("slider");
    await expect(slider).toHaveValue("0");
    await slider.focus();
    await slider.press("End");
    await expect(slider).toHaveValue("100");
  });

  test("ask: discloses it is an AI and shows a cited, worked example", async ({ page }) => {
    await page.goto(URL);
    const ask = page.locator("#ask");
    await expect(ask.getByRole("heading", { name: "Ask Plinth anything" })).toBeVisible();
    await expect(ask.getByText("Ask Plinth is an AI.", { exact: false })).toBeVisible();
    await expect(ask.getByText("Will it be delivered on time?", { exact: true }).first()).toBeVisible();
  });

  test("axe finds no serious or critical violations on the new sections", async ({ page }) => {
    await page.goto(URL);
    const { violations } = await new AxeBuilder({ page })
      .include("#homes,#cost,#wait,#book,#picture,#ask")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
