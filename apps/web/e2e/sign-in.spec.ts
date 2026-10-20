// WebSignIn (T47; WORK_BREAKDOWN §4 T47 accept): "a 9-digit number shows the
// validation copy; Bring them here merges 2 follows; no checkbox starts
// ticked." The phone number is Rohan's fixture test number (+919900000318,
// packages/fixtures/canonical/people.json) — never a real one (AGENTS.md §6).
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const TEST_NUMBER = "9900000318";
const PROJECT_PATH = "/sign-in?next=/gurugram/projects/sapphire-grove-phase-1";

async function sendValidCode(page: import("@playwright/test").Page) {
  await page.getByLabel("Mobile number").fill(TEST_NUMBER);
  await page.getByRole("button", { name: "Send code on WhatsApp" }).click();
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible();
}

async function reachBringStep(page: import("@playwright/test").Page) {
  await sendValidCode(page);
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: /^Verify and (follow|continue)/ }).click();
  await expect(
    page.getByRole("heading", { name: "We found your WhatsApp follows" }),
  ).toBeVisible();
}

test.describe("WebSignIn", () => {
  test.use({ reducedMotion: "reduce" });

  test("the value card stays open, naming the project", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await expect(
      page.getByRole("heading", { level: 1, name: "Sign in to follow Sapphire Grove, Phase 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Sapphire Grove, Phase 1" }),
    ).toBeVisible();
    await expect(page.getByText("Moderate")).toBeVisible();
  });

  test("a 9-digit number shows the validation copy", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await page.getByLabel("Mobile number").fill("990000031");
    await page.getByRole("button", { name: "Send code on WhatsApp" }).click();
    await expect(
      page.getByText("Enter a 10-digit mobile number, starting with 6, 7, 8 or 9."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enter the code" })).toHaveCount(0);
  });

  test("a valid number moves to the code step, with a 10-minute, 30-second-resend code", async ({
    page,
  }) => {
    await page.goto(PROJECT_PATH);
    await sendValidCode(page);
    await expect(page.getByText(/It works for 10 minutes\./)).toBeVisible();
    await expect(page.getByRole("button", { name: /^New code in 0:/ })).toBeVisible();
  });

  test("an incomplete code shows its own validation copy", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await sendValidCode(page);
    await page.getByLabel("6-digit code").fill("123");
    await page.getByRole("button", { name: /^Verify and (follow|continue)/ }).click();
    await expect(page.getByText("Enter all 6 digits.")).toBeVisible();
  });

  test("no checkbox starts ticked on the Bring-follows step", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await reachBringStep(page);
    await expect(page.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
  });

  test('"Bring them here" merges 2 follows into the Done list', async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await reachBringStep(page);

    await expect(page.getByText("Aurelia Heights, Phase 2")).toBeVisible();
    await expect(page.getByText("Kestrel Park")).toBeVisible();
    await expect(page.getByText("Aurelia Heights, 3 BHK cost sheet")).toBeVisible();

    await page.getByRole("button", { name: "Bring them here" }).click();

    await expect(page.getByRole("heading", { name: "One account, three places" })).toBeVisible();
    const followed = page.getByRole("list", { name: "Projects you follow" });
    await expect(followed.getByText("Sapphire Grove, Phase 1")).toBeVisible();
    await expect(followed.getByText("Aurelia Heights, Phase 2")).toBeVisible();
    await expect(followed.getByText("Kestrel Park")).toBeVisible();
    await expect(
      page.getByText("Your WhatsApp follows are here now. The app and WhatsApp show the same list."),
    ).toBeVisible();
  });

  test('"Not now" on the Bring-follows step keeps WhatsApp untouched', async ({ page }) => {
    await page.goto(PROJECT_PATH);
    await reachBringStep(page);
    await page.getByRole("button", { name: "Not now" }).click();

    const followed = page.getByRole("list", { name: "Projects you follow" });
    await expect(followed.getByText("Sapphire Grove, Phase 1")).toBeVisible();
    await expect(followed.getByText("Aurelia Heights, Phase 2")).toHaveCount(0);
    await expect(
      page.getByText(
        "Your WhatsApp follows stay on WhatsApp. Bring them here any time from Your account.",
      ),
    ).toBeVisible();
  });

  test('"Not now, keep reading" leaves without an account, straight back to the project', async ({
    page,
  }) => {
    await page.goto(PROJECT_PATH);
    await page.getByRole("link", { name: "Not now, keep reading" }).click();
    await expect(page).toHaveURL(/\/gurugram\/projects\/sapphire-grove-phase-1$/);
  });

  test("a generic sign-in (no project in `next`) still runs the same flow", async ({ page }) => {
    await page.goto("/sign-in?next=/following");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in to Plinth" })).toBeVisible();
    await reachBringStep(page);
    await page.getByRole("button", { name: "Bring them here" }).click();
    const followed = page.getByRole("list", { name: "Projects you follow" });
    await expect(followed.getByText("Aurelia Heights, Phase 2")).toBeVisible();
    await expect(followed.getByText("Kestrel Park")).toBeVisible();
  });

  test("axe is clean", async ({ page }) => {
    await page.goto(PROJECT_PATH);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
