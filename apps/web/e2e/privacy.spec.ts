// WebPrivacy (T51; WORK_BREAKDOWN §4 accept): withdrawing C-1012-04 changes
// the active count to 2, every consent ref matches C-MMDD-NN, and no lender
// ever appears among the parties who can reach the buyer.
import { expect, test } from "@playwright/test";

const REF_RE = /^C-\d{4}-\d{2}$/;

test.describe("WebPrivacy", () => {
  test("loads with 3 active parties, no lender among them, and every ref matches C-MMDD-NN", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Who has my number?");
    await expect(page.getByTestId("active-count")).toContainText("3 parties can reach you right now");

    const partyNames = await page.getByTestId("party-list").locator("li span.font-semibold").allTextContents();
    expect(partyNames.length).toBeGreaterThan(0);
    for (const name of partyNames) expect(name.toLowerCase()).not.toContain("lender");

    const refs = await page.locator("[data-ref]").allTextContents();
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ref).toMatch(REF_RE);
  });

  test("withdrawing C-1012-04 changes the count to 2", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByTestId("active-count")).toContainText("3 parties");

    await page.getByRole("button", { name: "Revoke Orbis Land site office's access to your number" }).click();
    await expect(page.getByRole("heading", { name: "Stop sharing your number with Orbis Land site office?" })).toBeVisible();
    await page.getByRole("button", { name: "Stop sharing" }).click();

    await expect(page.getByTestId("active-count")).toContainText("2 parties can reach you right now");
    await expect(page.getByTestId("party-list")).not.toContainText("Orbis Land site office");
    await expect(page.getByTestId("history-list")).toContainText("withdrawn");
  });

  test("download and delete are honest about fixture mode: no confirmation without a record", async ({
    page,
  }) => {
    await page.goto("/privacy");

    await page.getByTestId("download-panel").getByRole("button", { name: "Prepare download" }).click();
    await expect(page.getByTestId("download-panel")).toContainText("nothing was saved");

    await page.getByTestId("delete-panel").getByRole("button", { name: "Delete my account" }).first().click();
    await page.getByLabel("I understand this can’t be undone.").check();
    await page.getByRole("button", { name: "Yes, delete my account" }).click();
    await expect(page.getByTestId("delete-panel")).toContainText("nothing was saved");
  });
});
