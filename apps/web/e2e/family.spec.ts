// T52 · /j/[code] family opt-in (WORK_BREAKDOWN T52 Accept). Fixture mode:
// AH2-7KQ (Aurelia, one phase, a RERA number) and RC4-2MW (all 4 phases, no
// RERA number) are the two live invites (DESIGN §5b); any other code is the
// one honest "not active" state this page gives an expired, used or unknown
// code alike.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("WebFamilyJoin: a live invite", { tag: "@smoke" }, () => {
  test("AH2-7KQ renders Rohan's invite, the RERA number and the WhatsApp join link", async ({
    page,
  }) => {
    const res = await page.goto("/j/AH2-7KQ");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rohan invited you");
    await expect(page.getByText("to follow Aurelia Heights, Phase 2.")).toBeVisible();
    await expect(page.getByText("RERA GGM/673/405/2022/117")).toBeVisible();
    await expect(
      page.getByText("An alert when its band changes, a QPR is filed or missed", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Rohan sees that you joined, never your number.", { exact: false }),
    ).toBeVisible();

    const waLink = page.getByRole("link", { name: /JOIN AH2-7KQ/ });
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toContain("wa.me/");
    expect(href).toContain("text=JOIN%20AH2-7KQ");

    // No phone number is ever asked for on this page.
    await expect(page.locator("input")).toHaveCount(0);

    await expect(new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).resolves.toMatchObject(
      { violations: [] },
    );
  });

  test('"Not now" reveals the honest decline line without a confirmation', async ({ page }) => {
    await page.goto("/j/AH2-7KQ");
    const notNow = page.getByRole("button", { name: "Not now" });
    await expect(notNow).toBeVisible();
    await notNow.click();
    await expect(
      page.getByText("We don’t have your number, and Rohan won’t be told."),
    ).toBeVisible();
    await expect(notNow).toHaveCount(0);
  });

  test("RC4-2MW covers all 4 projects and has no RERA line", async ({ page }) => {
    await page.goto("/j/RC4-2MW");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rohan invited you");
    await expect(
      page.getByText("to follow 4 projects: Aurelia Heights Ph 2, Kestrel Park", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page.getByText("RERA", { exact: false })).toHaveCount(0);
    const waLink = page.getByRole("link", { name: /JOIN RC4-2MW/ });
    await expect(waLink).toHaveAttribute("href", /text=JOIN%20RC4-2MW/);
  });
});

test.describe("WebFamilyJoin: expired, used or unknown code", { tag: "@smoke" }, () => {
  test("a code with no active invite shows the one honest 'not active' state", async ({
    page,
  }) => {
    const res = await page.goto("/j/ZZ9-000");
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This invite link isn’t active",
    );
    await expect(
      page.getByText("has expired, was already used, or doesn’t exist", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /JOIN/ })).toHaveCount(0);
    await expect(page.locator("input")).toHaveCount(0);
  });

  // RC4-8TD (packages/fixtures/canonical/family.json) is a real invite code
  // that has already been used (Meera joined with it); the fixture layer has
  // no payload keyed on it, so it resolves the same honest way as a code
  // that was never issued (API_CONTRACTS §4.11: expired, used and unknown
  // alike get a neutral reply).
  test("an already-used code gets the same honest state as an unknown one", async ({ page }) => {
    await page.goto("/j/RC4-8TD");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This invite link isn’t active",
    );
  });
});
