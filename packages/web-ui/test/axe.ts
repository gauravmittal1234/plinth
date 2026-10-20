// jest-axe under Vitest. jsdom computes no colours, so axe's colour-contrast
// rule can only return "incomplete" here; contrast is held by @plinth/tokens'
// WCAG tests (T01) and the Playwright axe runs on rendered routes (apps/web).
import { configureAxe } from "jest-axe";
import { expect } from "vitest";

const axe = configureAxe({
  rules: {
    // A component renders without its page: no landmarks or <h1> around it.
    region: { enabled: false },
  },
});

/** Runs axe on a rendered fragment and fails with a readable list of violations. */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe(container);
  const found = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`,
  );
  expect(found, found.join("\n")).toEqual([]);
}
