// T23 · WebDeveloper (WORK_BREAKDOWN §4 T23 accept). Fixture mode, the
// Northfield Estates and Elmstone Developers pages: the claim line, the
// facts-only mode explainer, the complaints rate and the reply.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const NORTHFIELD = "/gurugram/developers/northfield-estates";
const ELMSTONE = "/gurugram/developers/elmstone-developers";

test.describe("WebDeveloper: Northfield Estates", { tag: "@smoke" }, () => {
  test("one heading, the claim line and the complaints rate", async ({ page }) => {
    const res = await page.goto(NORTHFIELD);
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Northfield Estates");
    await expect(page.getByText("Claimed by Northfield", { exact: false })).toBeVisible();
    await expect(
      page.getByText("24 decided against the group, or 0.7 per 100 units.", { exact: false }),
    ).toBeVisible();

    await expect(page.getByRole("contentinfo")).toContainText("No developer pays us. Ever.");
  });

  test("does Northfield deliver on time? gives the timeline and insolvency line", async ({
    page,
  }) => {
    await page.goto(NORTHFIELD);
    const trackRecord = page.locator("#track-record");
    await expect(
      trackRecord.getByRole("heading", { name: "Does Northfield Estates deliver on time?" }),
    ).toBeVisible();
    await expect(trackRecord.getByText("Aurelia Heights, Phase 1")).toBeVisible();
    await expect(trackRecord.getByText("No insolvency found", { exact: false })).toBeVisible();
  });

  test("what is Northfield building now? lists its ongoing phases", async ({ page }) => {
    await page.goto(NORTHFIELD);
    const ongoing = page.locator("#ongoing");
    await expect(ongoing.getByText("Aurelia Heights, Phase 2")).toBeVisible();
    await expect(ongoing.getByRole("link", { name: "Open project" }).first()).toHaveAttribute(
      "href",
      "/gurugram/projects/aurelia-heights-phase-2",
    );
  });

  test("what has HARERA decided on complaints? gives the 24-month rate and the fairness line", async ({
    page,
  }) => {
    await page.goto(NORTHFIELD);
    const complaints = page.locator("#complaints");
    await expect(
      complaints.getByRole("heading", { name: "What has HARERA decided on complaints?" }),
    ).toBeVisible();
    await expect(complaints).toContainText("24 decided against the group, or 0.7 per 100 units.");
    await expect(complaints).toContainText("A bigger group isn't penalised");
    // This fixture's `half_years` is empty, so the Count / Per 100 units
    // toggle has nothing to draw yet; ComplaintsChart only renders once a
    // group's half-year breakdown is non-empty.
    await expect(complaints.getByText("Count", { exact: true })).toHaveCount(0);
  });

  test("what does Northfield say? shows the published reply", async ({ page }) => {
    await page.goto(NORTHFIELD);
    const reply = page.locator("#reply");
    await expect(
      reply.getByRole("heading", { name: "What does Northfield Estates say?" }),
    ).toBeVisible();
    await expect(
      reply.getByText("Heron Point, Phase 1 was ready in March 2024", { exact: false }),
    ).toBeVisible();
    await expect(reply.getByText("Records show", { exact: false })).toBeVisible();
  });

  test("facts-only (?state=facts_only): every project chip is withheld, and the explainer is reachable", async ({
    page,
  }) => {
    await page.goto(`${NORTHFIELD}?state=facts_only`);
    await expect(page.getByText("Bands withheld pending review, from 18 Oct 2026")).toBeVisible();

    const withheldChips = page.locator('[data-chip-kind="withheld"]');
    await expect(withheldChips).toHaveCount(3);
    for (const chip of await withheldChips.all()) {
      await expect(chip).toHaveText("Band withheld · facts only");
    }

    await page.getByRole("link", { name: "How facts-only works" }).click();
    await expect(page.locator("#facts-only")).toContainText("Why is there no band on this page?");
    await expect(page.locator("#facts-only")).toContainText(
      "Since 18 Oct 2026 we show facts only for Northfield's projects",
    );
  });

  test("the ?state= preview is noindex; the canonical page is not", async ({ page }) => {
    // `?state=` is a next.config.ts rewrite to the internal `~preview` route,
    // so the canonical page stays static and indexable.
    await page.goto(`${NORTHFIELD}?state=facts_only`);
    await expect(page).toHaveURL(`${NORTHFIELD}?state=facts_only`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await page.goto(NORTHFIELD);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test("carries a BreadcrumbList, server-rendered (M1 polish)", async ({ page }) => {
    await page.goto(NORTHFIELD);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const breadcrumb = blocks
      .map((b) => JSON.parse(b) as Record<string, unknown>)
      .find((b) => b["@type"] === "BreadcrumbList");
    const items = breadcrumb?.itemListElement as { name: string }[] | undefined;
    expect(items?.map((i) => i.name)).toEqual(["Home", "Northfield Estates"]);
  });

  test("axe finds no serious or critical violations", async ({ page }) => {
    await page.goto(NORTHFIELD);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe("WebDeveloper: Elmstone Developers (not yet claimed)", { tag: "@smoke" }, () => {
  test("the claim line reads invited, not yet claimed, with a way to claim", async ({ page }) => {
    const res = await page.goto(ELMSTONE);
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Elmstone Developers");
    await expect(page.getByText("invited 24 Nov 2025 · not yet claimed")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Are you Elmstone Developers? Claim this page, free" }),
    ).toHaveAttribute("href", "/workspace/claim?slug=elmstone-developers");
  });

  test("no reply yet shows a plain line, never an invented date", async ({ page }) => {
    await page.goto(ELMSTONE);
    await expect(page.locator("#reply")).toContainText("No reply published yet");
  });
});
