import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Playwright runs against the production build in fixture mode (`next start`).
// It reuses .next when a build exists (ci-web builds first; turbo's e2e tasks
// depend on build) and builds once when there is none (nightly). Rebuild after
// changing code locally.
//   npm run -w @plinth/web e2e:smoke   tests tagged @smoke (every PR, ci-web)
//   npm run -w @plinth/web e2e         everything (nightly)
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const BUILT = existsSync(join(__dirname, ".next", "BUILD_ID"));
const START = `npm run start -- --port ${PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: BUILT ? START : `npm run build && ${START}`,
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: BUILT ? 60_000 : 300_000,
    env: { PLINTH_DATA: "fixtures", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
