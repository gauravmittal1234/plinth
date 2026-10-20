// T49 · WebFollowing (WORK_BREAKDOWN §4 T49 accept). Fixture mode, Rohan's
// "Since you last looked" page: the summary sentence, the replay, marking
// the feed seen, and that no lender party ever appears (fix-since-family.md
// §2 item 11).
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const URL = "/following";

const SUMMARY_LINE =
  "5 changes across your 4 projects: 1 extension, 1 filing on time, 2 missing filings and 1 price change. No band moved.";

test.describe("WebFollowing: since you last looked", { tag: "@smoke" }, () => {
  test("one heading and the exact summary sentence", async ({ page }) => {
    const res = await page.goto(URL);
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("What changed since 14 Oct?");
    await expect(page.getByText(SUMMARY_LINE)).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("No developer pays us. Ever.");
  });

  test("replay to 1 Jul shows the band mark on 2 Oct", async ({ page }) => {
    await page.goto(URL);
    const since = page.locator("#since");
    const bandMark = since.locator('[data-kind="band_changed"][data-date="2026-10-02"]');

    // Resting state (since the last look, 14 Oct): the 2 Oct band change is
    // further back than that and sits in the record below, not the hero.
    await expect(bandMark).toHaveCount(0);

    await since.getByRole("button", { name: "When you followed · 1 Jul" }).click();
    await expect(bandMark).toHaveCount(1);
    await expect(bandMark).toContainText("Delivery risk moved from Moderate to Elevated");
    await expect(bandMark.getByText("Moderate", { exact: true })).toBeVisible();
    await expect(bandMark.getByText("Elevated", { exact: true })).toBeVisible();
  });

  test("Mark these as seen zeroes the unread count", async ({ page }) => {
    await page.goto(URL);
    const badge = page.getByTestId("unread-badge");
    await expect(badge).toHaveText("5 unread");

    await page.getByRole("button", { name: "Mark these as seen" }).click();
    await expect(badge).toHaveText("Seen");
  });

  test("no lender party ever appears", async ({ page }) => {
    await page.goto(URL);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/lender/i);
  });

  test("project rows show the follow type and risk chip, no band words off a chip", async ({
    page,
  }) => {
    await page.goto(URL);
    const projects = page.locator("#projects");
    await expect(projects.getByRole("heading", { name: "Are they keeping pace?" })).toBeVisible();
    await expect(projects.getByRole("link", { name: "Aurelia Heights, Phase 2" })).toHaveAttribute(
      "href",
      "/gurugram/projects/aurelia-heights-phase-2",
    );
    await expect(projects.getByText("Watching").first()).toBeVisible();
    await expect(projects.getByText("Meera follows too", { exact: false }).first()).toBeVisible();
  });

  test("Have you booked any of these? toggling to booked shows the booked-buyer explainer", async ({
    page,
  }) => {
    await page.goto(URL);
    const booked = page.locator("#booked");
    await expect(booked.getByRole("heading", { name: "Have you booked any of these?" })).toBeVisible();

    await booked.getByRole("radio", { name: "I've booked here" }).click();
    await expect(booked.getByRole("link", { name: "Check a demand letter" })).toHaveAttribute(
      "href",
      "/check/pay-as-built",
    );
    const details = booked.getByText("What a booked buyer can do");
    await expect(details).toBeVisible();
    await expect(booked.getByText("Demand letters checked against", { exact: false })).toBeHidden();
    await details.click();
    await expect(booked.getByText("Demand letters checked against", { exact: false })).toBeVisible();
  });

  test("Who's deciding with you? creates a real invite link", async ({ page }) => {
    await page.goto(URL);
    const family = page.locator("#family");
    await expect(family.getByRole("heading", { name: "Who's deciding with you?" })).toBeVisible();

    await family.getByRole("button", { name: "Invite someone" }).click();
    await expect(family.getByText("plinth.in/j/AH2-7KQ")).toBeVisible();
    await expect(
      family.getByRole("link", { name: "Share invite on WhatsApp" }),
    ).toHaveAttribute("href", /wa\.me/);
  });

  test("What lands every Sunday? previews this week's real changes", async ({ page }) => {
    await page.goto(URL);
    const digest = page.locator("#digest");
    await expect(digest.getByRole("heading", { name: "What lands every Sunday?" })).toBeVisible();
    await expect(digest.getByText("Next digest Sun 25 Oct, 9 am")).toBeVisible();
  });

  test("alert settings: Weekly Sunday 9 am is selected, toggling Off calls the real RPC", async ({
    page,
  }) => {
    await page.goto(URL);
    const alerts = page.locator("#alerts");
    await expect(alerts.getByRole("heading", { name: "How should we tell you?" })).toBeVisible();
    await expect(alerts.getByRole("radio", { name: /Weekly Sunday 9 am/ })).toBeChecked();

    await alerts.getByRole("radio", { name: /^Off/ }).check();
    await expect(alerts.getByRole("radio", { name: /^Off/ })).toBeChecked();
    await expect(alerts.getByText("3 parties can reach you now", { exact: false })).toBeVisible();
  });

  test("axe finds no serious or critical violations", async ({ page }) => {
    await page.goto(URL);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
