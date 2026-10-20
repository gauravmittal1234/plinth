// Import for side effects at the top of a card-rendering test file that
// declares `// @vitest-environment node` (resvg's WASM PNG encoder needs a
// real Node Buffer/Uint8Array realm; it errors under jsdom's — see
// risk-card.test.ts history). Vitest's global test/setup.ts still runs its
// `afterEach` for every file regardless of that file's own environment, and
// assumes `document`/`localStorage` exist (true for every OTHER test file,
// which stay on the jsdom default). This fills in just enough of both so
// that shared hook is a no-op here, without touching test/setup.ts itself.
import { beforeAll } from "vitest";

beforeAll(() => {
  if (typeof document === "undefined") {
    Object.assign(globalThis, {
      document: { documentElement: { removeAttribute() {} } },
    });
  }
  if (typeof localStorage === "undefined") {
    Object.assign(globalThis, { localStorage: { clear() {} } });
  }
});
