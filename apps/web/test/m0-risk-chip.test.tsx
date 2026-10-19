// M0 gate stand-in (T07): the fixture RiskSummary read and the borderless chip.
// e2e/gates/m0.spec.ts checks the rendered route; this checks the pieces.
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_RISK_SLUGS, fixtureRiskSummary } from "@/src/m0/fixture-risk";
import { RiskChip } from "@/src/m0/risk-chip";
import { PHASE_SLUGS } from "@plinth/fixtures";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("fixtureRiskSummary", () => {
  it("covers exactly the 8 seeded phases", () => {
    expect([...FIXTURE_RISK_SLUGS].sort()).toEqual([...PHASE_SLUGS].sort());
  });

  it("reads the expected RiskSummary: Aurelia Elevated, Kestrel Low", () => {
    expect(fixtureRiskSummary("aurelia-heights-phase-2")?.chip).toMatchObject({
      kind: "band",
      label: "Elevated",
      meter_filled: 3,
    });
    expect(fixtureRiskSummary("kestrel-park")?.band?.code).toBe("low");
  });

  it("has nothing for other slugs, or outside fixture mode", () => {
    expect(fixtureRiskSummary("no-such-phase")).toBeNull();
    expect(fixtureRiskSummary("toString")).toBeNull();
    vi.stubEnv("PLINTH_DATA", "supabase");
    expect(fixtureRiskSummary("aurelia-heights-phase-2")).toBeNull();
  });
});

describe("RiskChip", () => {
  it("shows the fixture label with a 5-segment meter filled to the step", () => {
    const summary = fixtureRiskSummary("aurelia-heights-phase-2")!;
    render(<RiskChip chip={summary.chip} band={summary.band?.code ?? null} />);
    const chip = screen.getByTestId("risk-chip");
    expect(chip).toHaveTextContent(/^Elevated$/);
    expect(chip).toHaveAttribute("data-band", "elevated");
    expect(chip.className).toContain("bg-risk-elevated-fill");
    expect(chip.className).not.toMatch(/\bborder\b/);
    expect(chip.querySelectorAll("[aria-hidden] > span")).toHaveLength(5);
    expect(chip.querySelectorAll("[data-on]")).toHaveLength(3);
  });

  it("uses the state tone for a phase without a band", () => {
    const summary = fixtureRiskSummary("heron-point-phase-2")!;
    render(<RiskChip chip={summary.chip} band={summary.band?.code ?? null} />);
    const chip = screen.getByTestId("risk-chip");
    expect(chip).toHaveAttribute("data-band", "not_scored");
    expect(chip).toHaveTextContent(summary.chip.label);
    expect(chip.querySelectorAll("[data-on]")).toHaveLength(0);
  });
});
