// T07 · M0 gate (BUILD_PLAN §3 M0 exit; WORK_BREAKDOWN T07). In fixture mode the
// project route renders the borderless risk chip from the expected RiskSummary
// (packages/fixtures/expected/risk_summary): Aurelia Heights Phase 2 is
// Elevated, Kestrel Park is Low. Colours must come from @plinth/tokens.
// Tagged @smoke so ci-web runs it on every PR; T20a's project page keeps it green.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EXPECTED = join(__dirname, "../../../../packages/fixtures/expected/risk_summary");

type Expected = {
  band: { code: string; label: string } | null;
  chip: { kind: string; label: string; meter_filled: number };
};

function expected(slug: string): Expected {
  return JSON.parse(readFileSync(join(EXPECTED, `${slug}.json`), "utf8")) as Expected;
}

/** The colour a token custom property resolves to on this page, as computed CSS. */
async function tokenColour(page: Page, prop: string): Promise<string> {
  return page.evaluate((p) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = `var(${p})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  }, prop);
}

const css = (el: Locator, prop: string) =>
  el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop);

const CASES = [
  { slug: "aurelia-heights-phase-2", band: "elevated", label: "Elevated", filled: 3 },
  { slug: "kestrel-park", band: "low", label: "Low", filled: 1 },
] as const;

test.describe(
  "M0 gate: the project route shows the fixture risk chip",
  { tag: ["@smoke", "@gate"] },
  () => {
    for (const c of CASES) {
      test(`${c.slug} → ${c.label}`, async ({ page }) => {
        const want = expected(c.slug);
        // The fixture itself says so (the chip copy is server data, never client-made).
        expect(want.band?.code).toBe(c.band);
        expect(want.chip.label).toBe(c.label);
        expect(want.chip.meter_filled).toBe(c.filled);

        const res = await page.goto(`/gurugram/projects/${c.slug}`);
        expect(res?.status()).toBe(200);

        const chip = page.getByTestId("risk-chip");
        await expect(chip).toHaveCount(1);
        await expect(chip).toBeVisible();
        await expect(chip).toHaveText(want.chip.label);
        await expect(chip).toHaveAttribute("data-band", c.band);
        await expect(chip.locator("[data-on]")).toHaveCount(want.chip.meter_filled);
        await expect(chip.locator("span[aria-hidden] > span")).toHaveCount(5);

        // Borderless (DESIGN §0): band fill on a pill, no outline.
        expect(await css(chip, "border-top-width")).toBe("0px");
        const fill = await tokenColour(page, `--pl-risk-${c.band}-fill`);
        expect(fill, "the tokens CSS is loaded").not.toBe("rgba(0, 0, 0, 0)");
        expect(await css(chip, "background-color")).toBe(fill);
        expect(await css(chip, "color")).toBe(await tokenColour(page, `--pl-risk-${c.band}-text`));
        expect(await css(chip.locator("[data-on]").first(), "background-color")).toBe(
          await tokenColour(page, `--pl-risk-${c.band}-ink`),
        );
      });
    }

    test("the chip follows the Night theme (tokens, not fixed colours)", async ({ page }) => {
      await page.goto("/gurugram/projects/aurelia-heights-phase-2");
      const chip = page.getByTestId("risk-chip");
      const day = await css(chip, "background-color");
      await page.getByRole("button", { name: "Night theme" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "night");
      await expect.poll(() => css(chip, "background-color")).not.toBe(day);
      expect(await css(chip, "background-color")).toBe(
        await tokenColour(page, "--pl-risk-elevated-fill"),
      );
    });

    test("a phase without a fixture RiskSummary shows no chip", async ({ page }) => {
      const res = await page.goto("/gurugram/projects/no-such-phase");
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("WebProject");
      await expect(page.getByTestId("risk-chip")).toHaveCount(0);
    });
  },
);
