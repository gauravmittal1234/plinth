// Risk components against the fixture world (DESIGN §3.2, §4 items 4–7, §4b).
import type { Band, BandCode, Chip, RiskSummary } from "@plinth/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  BAND_CODES,
  BandScale,
  ConfidenceDots,
  IconArray,
  Meter,
  RiskChip,
  RiskHeader,
  Riskometer,
  iconCells,
  needleAngle,
} from "../src";
import { BANDS, COPY, fixture } from "./fixtures";
import { loadExpected } from "@plinth/fixtures/node";

const aurelia = fixture("aurelia-heights-phase-2").risk;
const laurel = fixture("laurel-residency").risk;
const juniper = fixture("juniper-enclave").risk;
const factsOnly = fixture("aurelia-heights-phase-2--facts-only").risk;
const kestrel = loadExpected<RiskSummary>("risk_summary", "kestrel-park");
const heron = loadExpected<RiskSummary>("risk_summary", "heron-point-phase-2");

function bandChip(code: BandCode, step: number): Chip {
  return { kind: "band", label: code, step, meter_filled: step };
}

function band(code: BandCode, step: number): Band {
  return { code, label: code, step, since: "2026-10-02", set_by: "model", rule: null };
}

describe("Meter", () => {
  it.each(BAND_CODES.map((code, i) => [code, i + 1] as const))(
    "fills %s's step: %i segments",
    (code, step) => {
      const { container } = render(<Meter band={code} />);
      const meter = container.querySelector("[data-meter]")!;
      expect(meter).toHaveAttribute("data-filled", String(step));
      expect(meter.querySelectorAll("[data-segment]")).toHaveLength(5);
      expect(meter.querySelectorAll("[data-on]")).toHaveLength(step);
      // Filled cumulatively from the left.
      const on = [...meter.querySelectorAll("[data-segment]")].map((s) =>
        s.hasAttribute("data-on"),
      );
      expect(on).toEqual([1, 2, 3, 4, 5].map((n) => n <= step));
    },
  );

  it.each(BAND_CODES.map((code, i) => [code, i + 1] as const))(
    "fills a %s chip's step (%i)",
    (code, step) => {
      const { container } = render(<Meter chip={bandChip(code, step)} size="m" />);
      expect(container.querySelectorAll("[data-on]")).toHaveLength(step);
    },
  );

  it("fills the fixture chips: Aurelia 3, Laurel 5 (rule), none for the unscored states", () => {
    const filled = (risk: RiskSummary) =>
      render(<Meter chip={risk.chip} />).container.querySelectorAll("[data-on]").length;
    expect(filled(aurelia)).toBe(3);
    expect(filled(laurel)).toBe(5);
    expect(filled(juniper)).toBe(0);
    expect(filled(factsOnly)).toBe(0);
    expect(filled(heron)).toBe(0);
  });

  it("draws the states' own segments: dashed (limited), outlined (not scored), plain (withheld)", () => {
    const seg = (risk: RiskSummary) =>
      render(<Meter chip={risk.chip} />).container.querySelector("[data-segment]")!;
    expect(seg(juniper).closest("[data-meter]")).toHaveAttribute("data-meter", "limited");
    expect(seg(juniper).className).toContain("border-dashed");
    expect(seg(heron).closest("[data-meter]")).toHaveAttribute("data-meter", "not_scored");
    expect(seg(heron).className).toContain("border-risk-not-scored-ink");
    expect(seg(factsOnly).closest("[data-meter]")).toHaveAttribute("data-meter", "withheld");
    expect(seg(factsOnly).className).not.toContain("--ui-band");
  });

  it("is hidden from assistive tech: the name beside it is the text", () => {
    const { container } = render(<Meter chip={aurelia.chip} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("RiskChip", () => {
  it("Aurelia: the band fill, the mini meter and the name, borderless", () => {
    const { container } = render(<RiskChip chip={aurelia.chip} srPrefix={COPY.srDeliveryRisk} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip).toHaveTextContent(/^Delivery risk: Elevated$/);
    expect(chip).toHaveAttribute("data-tone", "elevated");
    expect(chip.className).toContain("bg-(--ui-band-fill)");
    expect(chip.className).not.toMatch(/(^|\s)border(\s|-)/);
    expect(chip.style.getPropertyValue("--ui-band-fill")).toBe("var(--pl-risk-elevated-fill)");
    expect(chip.querySelectorAll("[data-on]")).toHaveLength(3);
  });

  it("Laurel: Severe, all five segments", () => {
    const { container } = render(<RiskChip chip={laurel.chip} />);
    expect(container.firstElementChild).toHaveTextContent(/^Severe$/);
    expect(container.firstElementChild).toHaveAttribute("data-tone", "severe");
  });

  it("Juniper: the limited-history label on the neutral track, no band colour", () => {
    const { container } = render(<RiskChip chip={juniper.chip} />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip).toHaveTextContent("Not enough history to score · no penalty");
    expect(chip).toHaveAttribute("data-tone", "limited");
    expect(chip.className).toContain("bg-track");
    expect(chip.getAttribute("style")).toBeNull();
  });

  it("facts-only: Band withheld · facts only, no colour and no meter fill", () => {
    const { container } = render(<RiskChip chip={factsOnly.chip} surface="track" />);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip).toHaveTextContent(/^Band withheld · facts only$/);
    expect(chip).toHaveAttribute("data-tone", "withheld");
    expect(chip.className).toContain("bg-chip-fill-on-track");
    expect(chip.querySelectorAll("[data-on]")).toHaveLength(0);
  });
});

describe("RiskHeader", () => {
  it("Aurelia: Elevated in the band's text colour, then the low-confidence line apart from the name", () => {
    render(<RiskHeader risk={aurelia} size="l" srPrefix={COPY.srDeliveryRisk} />);
    const name = screen.getByText("Elevated");
    expect(name.className).toContain("text-(--ui-band-text)");
    expect(name).toHaveTextContent(/^Delivery risk: Elevated$/);
    expect(screen.getByText(aurelia.confidence!.line)).toBeInTheDocument();
    expect(name).not.toHaveTextContent("less certain");
  });

  it("Laurel: the red-flag rule's line, and no 'of 100'", () => {
    const { container } = render(<RiskHeader risk={laurel} />);
    expect(container).toHaveTextContent("Set by red-flag rule 1, not our model");
    expect(container).not.toHaveTextContent("of 100");
    expect(container.querySelector("[data-rule]")).toHaveAttribute("data-rule", "RF1_GROUP_CIRP");
  });

  it("Juniper and facts-only: the chip's own words, quiet, no band colour", () => {
    const j = render(<RiskHeader risk={juniper} />);
    expect(j.container).toHaveTextContent("Not enough history to score · no penalty");
    expect(j.container.querySelector("[data-risk-header]")).toHaveAttribute(
      "data-risk-header",
      "limited_history",
    );
    j.unmount();
    const f = render(<RiskHeader risk={factsOnly} />);
    expect(f.container).toHaveTextContent("Band withheld · facts only");
    expect(f.container.querySelector("[data-risk-header]")!.getAttribute("style")).toBeNull();
  });
});

describe("BandScale", () => {
  it("lists the five server band names in order and marks Aurelia's as current", () => {
    render(<BandScale bands={BANDS} current={aurelia.band!.code} label={COPY.scaleLabel} />);
    const list = screen.getByRole("list", { name: COPY.scaleLabel });
    const items = [...list.querySelectorAll("li")];
    expect(items.map((li) => li.textContent)).toEqual([
      "Low",
      "Moderate",
      "Elevated",
      "High",
      "Severe",
    ]);
    expect(
      items.filter((li) => li.getAttribute("aria-current") === "true").map((li) => li.textContent),
    ).toEqual(["Elevated"]);
  });

  it("marks nothing without a public band (Juniper, facts-only)", () => {
    const { container } = render(<BandScale bands={BANDS} current={juniper.band?.code ?? null} />);
    expect(container.querySelector("[aria-current]")).toBeNull();
  });
});

describe("ConfidenceDots", () => {
  it("low: one filled, one hollow, beside the server's line", () => {
    const { container } = render(<ConfidenceDots confidence={aurelia.confidence} />);
    expect(
      [...container.querySelectorAll("[data-dot]")].map((d) => d.getAttribute("data-dot")),
    ).toEqual(["filled", "hollow"]);
    expect(container).toHaveTextContent(aurelia.confidence!.line);
  });

  it("high: two filled; dots alone carry the line as their name", () => {
    render(<ConfidenceDots confidence={kestrel.confidence} withLine={false} />);
    const img = screen.getByRole("img", { name: kestrel.confidence!.line });
    expect(img.querySelectorAll('[data-dot="filled"]')).toHaveLength(2);
  });

  it("draws nothing without a confidence (Laurel, Juniper, facts-only)", () => {
    for (const risk of [laurel, juniper, factsOnly]) {
      expect(
        render(<ConfidenceDots confidence={risk.confidence} />).container,
      ).toBeEmptyDOMElement();
    }
  });
});

describe("IconArray", () => {
  it("Aurelia: 30 filled, 15 hatched, 55 empty, row by row, named by the server's sentence", () => {
    render(<IconArray frequency={aurelia.frequency} band="elevated" legend={COPY.legend} />);
    const fig = screen.getByRole("img", {
      name: /^Between 30 and 45 of 100 similar Gurugram projects/,
    });
    const cells = [...fig.querySelectorAll("[data-cell]")].map((c) => c.getAttribute("data-cell"));
    expect(cells).toHaveLength(100);
    expect(cells.filter((c) => c === "filled")).toHaveLength(30);
    expect(cells.filter((c) => c === "hatched")).toHaveLength(15);
    expect(cells.filter((c) => c === "empty")).toHaveLength(55);
    expect(cells.indexOf("hatched")).toBe(30);
    expect(cells.indexOf("empty")).toBe(45);
    expect(screen.getByText("Hatched: the 15 of 100 we're less certain about")).toBeInTheDocument();
    expect(fig.querySelector('[data-cell="hatched"]')!.className).toContain("ui-hatch");
  });

  it("a point estimate has no hatch and no hatch legend (Kestrel)", () => {
    render(<IconArray frequency={kestrel.frequency} band="low" legend={COPY.legend} />);
    expect(iconCells(kestrel.frequency!.icon_array).filter((c) => c === "hatched")).toHaveLength(0);
    expect(screen.queryByText(/Hatched/)).toBeNull();
  });

  it("draws nothing when a rule sets the band or there is no band (Laurel, Juniper, facts-only)", () => {
    for (const risk of [laurel, juniper, factsOnly]) {
      const { container } = render(<IconArray frequency={risk.frequency} band={risk.band?.code} />);
      expect(container).toBeEmptyDOMElement();
    }
  });
});

describe("Riskometer", () => {
  it.each([
    [1, -72],
    [2, -36],
    [3, 0],
    [4, 36],
    [5, 72],
  ])("rests the needle for step %i at %i°", (step, angle) => {
    expect(needleAngle(step)).toBe(angle);
    const code = BAND_CODES[step - 1]!;
    const { container } = render(<Riskometer band={band(code, step)} label="dial" />);
    const needle = container.querySelector("[data-needle]") as SVGGElement;
    expect(needle.style.transform).toBe(`rotate(${angle}deg)`);
    const current = container.querySelector('[data-current="true"]')!;
    expect(current).toHaveAttribute("data-arc", code);
    expect(current).toHaveAttribute("stroke-width", "30");
    expect(container.querySelectorAll('path[stroke-width="20"]')).toHaveLength(4);
  });

  it("Aurelia: an image named by the page's sentence, with the band names under it", () => {
    render(<Riskometer band={aurelia.band} label={aurelia.share.card_alt} bands={BANDS} />);
    expect(screen.getByRole("img", { name: aurelia.share.card_alt })).toBeInTheDocument();
    expect(screen.getByText("Elevated").className).toContain("font-bold");
  });

  it("draws nothing without a public band (Juniper, facts-only)", () => {
    for (const risk of [juniper, factsOnly]) {
      expect(render(<Riskometer band={risk.band} label="dial" />).container).toBeEmptyDOMElement();
    }
  });

  it("sweeps on first paint when motion is allowed (the final angle is still in the markup)", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    }));
    const { container } = render(<Riskometer band={laurel.band} label="dial" />);
    const needle = container.querySelector("[data-needle]") as SVGGElement;
    expect(needle).toHaveAttribute("data-motion", "sweep");
    expect(needle.getAttribute("class")).toBe("ui-needle-sweep");
    expect(needle.style.transform).toBe("rotate(72deg)");
  });
});
