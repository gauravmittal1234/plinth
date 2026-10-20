// T14 acceptance: reduced motion renders the final state. Every instrument puts
// its answer in the markup; motion only decorates the way there. With
// prefers-reduced-motion the components drop their animation classes and
// delays, the tokens zero every duration, and each animated utility in
// styles.css stops.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REDUCED_MOTION_QUERY, Riskometer, Toast, TowerStack, slabsFromPct } from "../src";
import { fixture } from "./fixtures";

const aurelia = fixture("aurelia-heights-phase-2");

function prefersReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: reduce && q === REDUCED_MOTION_QUERY,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

describe("with prefers-reduced-motion: reduce", () => {
  beforeEach(() => prefersReducedMotion(true));

  it("the riskometer shows the needle at the band, with no sweep", () => {
    const { container } = render(
      <Riskometer band={aurelia.risk.band} label={aurelia.risk.share.card_alt} />,
    );
    const needle = container.querySelector("[data-needle]") as SVGGElement;
    expect(needle).toHaveAttribute("data-motion", "reduce");
    expect(needle.getAttribute("class")).toBeNull();
    expect(needle.style.transform).toBe("rotate(0deg)");
  });

  it("the tower shows every built slab at once, with no fade and no stagger", () => {
    const { container } = render(
      <TowerStack
        floors={20}
        built={slabsFromPct(aurelia.risk.progress.built_pct)}
        sold={slabsFromPct(aurelia.risk.progress.sold_pct)}
        band="elevated"
      />,
    );
    const built = container.querySelectorAll('[data-built="true"]');
    expect(built).toHaveLength(8);
    for (const slab of container.querySelectorAll<HTMLElement>("[data-slab]")) {
      expect(slab.className).not.toContain("ui-slab-build");
      expect(slab.style.getPropertyValue("--ui-slab-delay")).toBe("0ms");
    }
  });
});

describe("with motion allowed", () => {
  beforeEach(() => prefersReducedMotion(false));

  it("built slabs fade in with a 45 ms stagger; the final state is still in the markup", () => {
    const { container } = render(<TowerStack floors={20} built={8} sold={14} band="elevated" />);
    const slabs = [...container.querySelectorAll<HTMLElement>("[data-slab]")];
    expect(slabs.filter((s) => s.className.includes("ui-slab-build"))).toHaveLength(8);
    expect(slabs[3]!.style.getPropertyValue("--ui-slab-delay")).toBe("135ms");
    expect(slabs.filter((s) => s.dataset.built === "true")).toHaveLength(8);
  });

  it("the toast rises in", () => {
    const { getByText } = render(
      <Toast message={aurelia.risk.share.caption} onDismiss={() => {}} />,
    );
    expect(getByText(aurelia.risk.share.caption).className).toContain("ui-rise");
  });
});

describe("the CSS side", () => {
  const css = readFileSync(resolve(__dirname, "../src/styles.css"), "utf8");
  const tokensCss = readFileSync(
    createRequire(import.meta.url).resolve("@plinth/tokens/css"),
    "utf8",
  );

  it("every animated utility stops under reduced motion", () => {
    const utilities = [...css.matchAll(/@utility ([a-z0-9-]+) \{([\s\S]*?)\n\}/g)];
    const animated = utilities.filter(([, , body]) => /animation:/.test(body!));
    expect(animated.map(([, name]) => name)).toEqual(
      expect.arrayContaining([
        "ui-needle-sweep",
        "ui-slab-build",
        "ui-rise",
        "ui-sheet",
        "ui-fade",
      ]),
    );
    for (const [, name, body] of animated) {
      expect(body, name).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*animation: none;/);
    }
  });

  it("every duration the kit animates with is a token the tokens zero under reduced motion", () => {
    const used = new Set(
      [...css.matchAll(/var\((--pl-motion-(?:duration|stagger|distance)-[a-z-]+)\)/g)].map(
        (m) => m[1]!,
      ),
    );
    expect(used.size).toBeGreaterThan(0);
    const reduced = tokensCss.slice(tokensCss.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const v of used) expect(reduced, v).toMatch(new RegExp(`${v}: 0(ms|px)?;`));
  });
});
