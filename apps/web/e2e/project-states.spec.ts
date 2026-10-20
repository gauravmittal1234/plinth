// T20c · WebProjectStates (WORK_BREAKDOWN §4 T20c accept). Fixture mode,
// over the 6 phase fixtures that carry a hard state plus the facts-only
// fixture (`?state=facts_only` on Aurelia, the same mechanism as
// WebDeveloper's e2e/developer.spec.ts), and the two lead-authorised extras:
// the Simple view toggle and the unknown-slug noindex behaviour.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LAUREL = "/gurugram/projects/laurel-residency";
const JUNIPER = "/gurugram/projects/juniper-enclave";
const HERON = "/gurugram/projects/heron-point-phase-2";
const CORAL = "/gurugram/projects/coral-towers";
const SAPPHIRE = "/gurugram/projects/sapphire-grove-phase-1";
const AURELIA = "/gurugram/projects/aurelia-heights-phase-2";

test.describe("WebProjectStates: Severe + Stalled (Laurel Residency)", { tag: "@smoke" }, () => {
  test("the rule sets the band, with no frequency, and the stall flag with its 4 slabs", async ({
    page,
  }) => {
    await page.goto(LAUREL);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laurel Residency");
    const risk = page.locator("#risk");
    await expect(
      risk.getByText("Set by red-flag rule 1, not our model", { exact: false }),
    ).toBeVisible();
    // No frequency sentence for a rule-set band: the risk answer never says
    // "of 100" for Laurel (the base-rate line in #next, a different, generic
    // statistic for every project, is out of scope here).
    await expect(risk.getByText(/\bof 100\b/)).toHaveCount(0);

    const states = page.locator("#booked-buyer");
    await expect(states.getByText("Stall flag")).toBeVisible();
    await expect(states.getByRole("heading", { name: "Is it still being built?" })).toBeVisible();
    await expect(
      states.getByText("No QPR progress for 4 quarters", { exact: false }),
    ).toBeVisible();
    for (const quarter of ["Jul–Sep 2025", "Oct–Dec 2025", "Jan–Mar 2026", "Apr–Jun 2026"]) {
      await expect(states.getByText(quarter, { exact: false }).first()).toBeVisible();
    }
    await expect(states.getByText("106%", { exact: false })).toBeVisible();

    await expect(
      states.getByText("The NCLT order of 12 Mar 2023 is against a group company", {
        exact: false,
      }),
    ).toBeVisible();
  });
});

test.describe("WebProjectStates: Limited history (Juniper Enclave)", { tag: "@smoke" }, () => {
  test("not enough history to score, no penalty, and what to check instead", async ({ page }) => {
    await page.goto(JUNIPER);
    await expect(page.getByTestId("risk-chip")).toHaveText("Not enough history to score · no penalty");

    const states = page.locator("#booked-buyer");
    await expect(states.getByRole("heading", { name: "What to check instead" })).toBeVisible();
    await expect(states.getByText("MCA company records")).toBeVisible();
    await expect(states.getByText("9% built", { exact: false })).toBeVisible();
  });
});

test.describe("WebProjectStates: Not scored (Heron Point, Phase 2)", { tag: "@smoke" }, () => {
  test("too new to score, and the group's record stands in for a check", async ({ page }) => {
    await page.goto(HERON);
    await expect(page.getByTestId("risk-chip")).toHaveText("Not scored");

    const states = page.locator("#booked-buyer");
    await expect(states.getByRole("heading", { name: "What to check instead" })).toBeVisible();
    // The group's record line is the page's own next_steps.steps line, not a
    // re-typed fact (T20c fix-up, PR #46).
    await expect(states.getByText("2 of 6 finished projects late", { exact: false })).toBeVisible();
    await expect(
      states.getByText("New HARERA orders on this project or Northfield Estates.", { exact: false }),
    ).toBeVisible();
    await expect(
      states.getByText("RERA s.13 caps what a developer can collect at 10% of the cost", {
        exact: false,
      }),
    ).toBeVisible();
  });
});

test.describe("WebProjectStates: Stale data (Coral Towers)", { tag: "@smoke" }, () => {
  test("how old is each record, against the 120-day line", async ({ page }) => {
    await page.goto(CORAL);
    const states = page.locator("#booked-buyer");
    await expect(states.getByRole("heading", { name: "How old is each record?" })).toBeVisible();
    await expect(states.getByText("187 days old", { exact: false })).toBeVisible();
    await expect(states.getByText("Stale", { exact: false }).first()).toBeVisible();
    await expect(states.getByText("The line marks 120 days", { exact: false })).toBeVisible();
  });
});

test.describe("WebProjectStates: Re-scoring (Sapphire Grove, Phase 1)", { tag: "@smoke" }, () => {
  test("reading the new filing: the step track and the 72-hour deadline", async ({ page }) => {
    await page.goto(SAPPHIRE);
    const states = page.locator("#booked-buyer");
    await expect(states.getByRole("heading", { name: "Reading the new filing" })).toBeVisible();
    await expect(states.getByText("by 19 Oct 2026, 7:40 pm", { exact: false }).first()).toBeVisible();
    await expect(
      states.getByText(
        "We show no figures from the new filing until two extractors agree and a person has checked them.",
      ),
    ).toBeVisible();
  });
});

test.describe("WebProjectStates: Facts-only (?state=facts_only, Aurelia)", { tag: "@smoke" }, () => {
  test("the band is withheld, and the records stay, each with its source", async ({ page }) => {
    await page.goto(`${AURELIA}?state=facts_only`);
    await expect(page.getByTestId("risk-chip")).toHaveText("Band withheld · facts only");

    const states = page.locator("#booked-buyer");
    await expect(states.getByText("Band withheld pending review, from 18 Oct 2026")).toBeVisible();
    await expect(
      states.getByRole("heading", { name: "The records, as they stand" }),
    ).toBeVisible();
    await expect(states.getByText("HARERA registration · 2022")).toBeVisible();
    await expect(
      states.getByRole("link", { name: "How facts-only works" }),
    ).toHaveAttribute("href", "/gurugram/developers/northfield-estates#facts-only");

    // No band word anywhere in the states section while the group's bands
    // are withheld (T20c fix-up, PR #46: "band words would leak when a group
    // is in facts-only mode"). The withheld chip itself never names a band.
    const statesText = (await states.innerText()).replace(/\s+/g, " ");
    for (const word of ["Low", "Moderate", "Elevated", "High", "Severe"]) {
      expect(statesText).not.toMatch(new RegExp(`\\b${word}\\b`));
    }
  });

  test("the plain, scored page shows none of this (Aurelia's default fixture)", async ({ page }) => {
    await page.goto(AURELIA);
    await expect(page.locator("#booked-buyer")).toHaveCount(0);
  });

  test("the preview is noindex; the canonical page is not", async ({ page }) => {
    // `?state=` is a next.config.ts rewrite to the internal `~preview` route,
    // so the canonical page stays static and indexable.
    await page.goto(`${AURELIA}?state=facts_only`);
    await expect(page).toHaveURL(`${AURELIA}?state=facts_only`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await page.goto(AURELIA);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});

test.describe("WebProjectStates: the booked-buyer panel and its toggle", { tag: "@smoke" }, () => {
  test("the rights every allottee has, and the I've-booked toggle", async ({ page }) => {
    await page.goto(LAUREL);
    const panel = page.locator("#booked-buyer");
    await expect(panel.getByRole("heading", { name: "If you've already booked here" })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Where to complain" })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Your money back, or interest" })).toBeVisible();

    const toggle = panel.getByRole("button", { name: "I've booked here" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(panel.getByText("As a booked buyer", { exact: false })).toHaveCount(0);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(panel.getByText("As a booked buyer", { exact: false })).toBeVisible();

    await expect(
      panel.getByRole("link", { name: "Haven't paid yet? Run the before-you-pay check" }),
    ).toHaveAttribute("href", "/check/before-you-pay");
  });
});

test.describe("WebProjectStates: Simple view (?view=simple)", { tag: "@smoke" }, () => {
  test("the header's Simple view link switches to the large-type page, and back", async ({
    page,
  }) => {
    await page.goto(AURELIA);
    await page.getByRole("link", { name: "Simple view" }).click();
    await expect(page).toHaveURL(`${AURELIA}?view=simple`);
    await expect(page.getByText("large-text view", { exact: false })).toBeVisible();

    await page.getByRole("link", { name: "Back to the full page" }).click();
    await expect(page).toHaveURL(AURELIA);
  });
});

test.describe("WebProjectStates: an unknown project slug", { tag: "@smoke" }, () => {
  test("renders the not-found UI, with noindex either way", async ({ page }) => {
    // The route reads only `params` (no `searchParams`; the `?state=` /
    // `?view=simple` previews are rewrites to `~preview` routes). A slug
    // outside `generateStaticParams` renders on request from the route's
    // prerendered shell, so `loadProject`'s `notFound()` can land after a
    // 200 has been sent: the "noindex, kept at 200" case
    // node_modules/next/dist/docs/01-app/02-guides/streaming.md describes
    // ("Status codes"). Assert the not-found UI and the noindex meta, not a
    // status code.
    await page.goto("/gurugram/projects/not-a-real-project");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "We couldn't find that page.",
    );
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", "noindex");
  });
});

test.describe("WebProjectStates: accessibility", { tag: "@smoke" }, () => {
  test("axe finds no serious or critical violations on a hard-state page", async ({ page }) => {
    await page.goto(LAUREL);
    const { violations } = await new AxeBuilder({ page })
      .include("#booked-buyer")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
