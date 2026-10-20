// T14 acceptance: each component renders the Aurelia, Laurel, Juniper and
// facts-only fixtures, in Day and Night, and jest-axe finds no violations.
// Colour is never literal: every inline colour is a token variable.
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "./axe";
import { CASES } from "./cases";
import { FIXTURES } from "./fixtures";

const THEMES = ["day", "night"] as const;

/** A colour written out (hex, rgb(), hsl(), a named colour in an SVG paint) rather than a token. */
const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(/i;
const PAINT_OK = /^(none|currentColor|transparent|var\(--(pl|ui)-[a-z0-9-]+\))$/;

function literalColours(root: Element): string[] {
  const found: string[] = [];
  for (const el of [root, ...root.querySelectorAll("*")]) {
    const style = el.getAttribute("style");
    if (style && LITERAL_COLOUR.test(style)) found.push(`${el.tagName} style="${style}"`);
    for (const attr of ["fill", "stroke", "color", "stop-color"]) {
      const v = el.getAttribute(attr);
      if (v != null && !PAINT_OK.test(v)) found.push(`${el.tagName} ${attr}="${v}"`);
    }
    if (/#[0-9a-f]{3,8}\b/i.test(el.getAttribute("class") ?? ""))
      found.push(`${el.tagName} class="${el.getAttribute("class")}"`);
  }
  return found;
}

describe.each(THEMES)("%s theme", (theme) => {
  describe.each(FIXTURES.map((f) => [f.key, f] as const))("%s", (_key, fx) => {
    it.each(CASES.map((c) => [c.name, c] as const))(
      "%s renders, axe-clean, tokens only",
      async (_name, c) => {
        document.documentElement.setAttribute("data-theme", theme);
        const { baseElement } = render(c.render(fx));
        await expectNoAxeViolations(baseElement);
        expect(literalColours(baseElement)).toEqual([]);
      },
    );
  });
});

describe("the matrix", () => {
  it("fails on a real violation (axe is live)", async () => {
    const { container } = render(
      <button type="button">
        <svg aria-hidden="true" />
      </button>,
    );
    await expect(expectNoAxeViolations(container)).rejects.toThrow(/button-name/);
  });

  it("covers the 23 components T14 lists", () => {
    expect(CASES.map((c) => c.name).sort()).toEqual(
      [
        "RiskChip",
        "RiskHeader",
        "BandScale",
        "Meter",
        "ConfidenceDots",
        "IconArray",
        "Riskometer",
        "ReasonList",
        "SourceChip",
        "EvidenceDrawer",
        "DeveloperSaysField",
        "FromDeveloperBlock",
        "PendingFact",
        "DisclaimerLine",
        "FactTile",
        "CostTable",
        "TowerStack",
        "ReplaySlider",
        "SectionBand",
        "Pill",
        "Button",
        "Sheet",
        "Toast",
      ].sort(),
    );
  });
});
