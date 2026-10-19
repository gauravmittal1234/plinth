// Route smoke (T05): every WORK_BREAKDOWN §2.1 route answers 200 in fixture
// mode, carries the shell where it should, and has no serious or critical axe
// violations. While a route is still a stub it must show its artboard name.
// Once a task replaces the stub (no [data-screen] any more), the row only asks
// for 200, one <main> with an <h1>, and axe, so no later task has to edit this
// file; a non-HTML route (a share-card PNG) only has to answer 200.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { SCREENS, hasShell } from "../src/shell/screens";

const routes = SCREENS.flatMap((s) => [
  ...s.routes.map((r) => ({ name: s.name, sample: r.sample, shell: hasShell(r) })),
  ...("variants" in s ? s.variants : []).map((v) => ({
    name: s.name,
    sample: v.sample,
    shell: hasShell(s.routes[0]!),
  })),
]);

async function expectNoSeriousA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
}

test.describe("every §2.1 route", { tag: "@smoke" }, () => {
  for (const r of routes) {
    test(`${r.sample} → ${r.name}`, async ({ page }) => {
      const res = await page.goto(r.sample);
      expect(res?.status()).toBe(200);
      if (!res?.headers()["content-type"]?.includes("text/html")) return;

      const stub = page.locator("[data-screen]");
      if ((await stub.count()) > 0) {
        await expect(stub).toHaveAttribute("data-screen", r.name);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(r.name);
      } else {
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      }
      await expect(page.getByRole("main")).toHaveCount(1);
      if (r.shell) {
        await expect(page.getByRole("contentinfo")).toContainText("No developer pays us. Ever.");
        await expect(page.getByRole("link", { name: "Plinth" }).first()).toBeVisible();
      }
      await expectNoSeriousA11yViolations(page);
    });
  }
});

test.describe("shell", { tag: "@smoke" }, () => {
  test("Day by default; the Night toggle sticks across reloads without a flash", async ({
    page,
  }) => {
    await page.goto("/methodology");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "day");
    const toggle = page.getByRole("button", { name: "Night theme" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await toggle.click();
    await expect(html).toHaveAttribute("data-theme", "night");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    // The head script applies the saved theme before first paint: check the
    // attribute as soon as the document is parsed, before hydration.
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector("html[data-theme]", { state: "attached" });
    await expect(html).toHaveAttribute("data-theme", "night");
    await expect(page.getByRole("button", { name: "Night theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("an unknown URL gets the 404 page inside the shell", async ({ page }) => {
    const res = await page.goto("/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn't find that page.");
    await expect(page.getByRole("contentinfo")).toContainText("No developer pays us. Ever.");
  });
});

test.describe("non-page routes", { tag: "@smoke" }, () => {
  test("GET /api/health", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"]).toContain("no-store");
    expect(await res.json()).toEqual({ status: "ok", service: "plinth-web", data: "fixtures" });
  });

  test("GET /.well-known/assetlinks.json", async ({ request }) => {
    const res = await request.get("/.well-known/assetlinks.json");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/json");
    expect(Array.isArray(await res.json())).toBe(true);
  });
});
