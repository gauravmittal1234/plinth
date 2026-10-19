import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);
/** The copy of a package this app resolves (apps/web pins react 19.3.0; the root may hoist another). */
const pkgDir = (name: string) => dirname(require.resolve(`${name}/package.json`));

// Unit and component tests (fixture mode). Playwright covers rendered routes
// (e2e/), so Vitest never boots Next.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./", import.meta.url)) },
      // One React for components and Testing Library alike: load Testing Library's
      // ESM build through Vite, so its react / react-dom imports hit these aliases.
      { find: /^react(\/.*)?$/, replacement: `${pkgDir("react")}$1` },
      { find: /^react-dom(\/.*)?$/, replacement: `${pkgDir("react-dom")}$1` },
      {
        find: /^@testing-library\/react$/,
        replacement: `${pkgDir("@testing-library/react")}/dist/@testing-library/react.esm.js`,
      },
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
    // Run Testing Library through Vite so the React aliases above apply to it too.
    server: { deps: { inline: [/@testing-library\//] } },
  },
});
