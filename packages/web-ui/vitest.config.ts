import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Component tests in jsdom with the fixture world (packages/fixtures/expected)
// and jest-axe. The frozen clock and IST are set like apps/web's.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    env: { TZ: "Asia/Kolkata" },
    // axe over a few hundred renders: give the matrix room on slow CI runners.
    testTimeout: 20_000,
  },
});
