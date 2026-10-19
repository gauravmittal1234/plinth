import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit and component tests (fixture mode). Playwright covers rendered routes
// (e2e/), so Vitest never boots Next. The workspace resolves a single React
// (19.3.1, aligned at the T07 gate), so no React aliases are needed.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./", import.meta.url)) },
      // `server-only` throws outside a React Server build; tests import server modules directly.
      {
        find: "server-only",
        replacement: fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    env: { PLINTH_DATA: "fixtures", TZ: "Asia/Kolkata" },
  },
});
