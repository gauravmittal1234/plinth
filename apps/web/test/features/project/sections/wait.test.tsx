// T20b acceptance (brief Accept line): the wait section shows ₹1,18,077 and
// ₹2,00,563 — rent + pre-EMI now and by completion, at the wait defaults.
import type { ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WaitSection } from "@/src/features/project/sections/wait/wait-section";

const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2");

describe("WaitSection", () => {
  it("shows ₹1,18,077 now and ₹2,00,563 by completion", () => {
    render(<WaitSection waitDefaults={page.wait_defaults} affordDefault={page.afford_default} />);
    expect(screen.getAllByText((t) => t.includes("₹1,18,077")).length).toBeGreaterThan(0);
    expect(screen.getAllByText((t) => t.includes("₹2,00,563")).length).toBeGreaterThan(0);
  });

  it("shows the 12 and 24 month delay costs and the frequency line", () => {
    render(<WaitSection waitDefaults={page.wait_defaults} affordDefault={page.afford_default} />);
    expect(screen.getByText(/₹24\.1 L more, in all\./)).toBeInTheDocument();
    expect(screen.getByText(/₹48\.1 L more, in all\./)).toBeInTheDocument();
    expect(
      screen.getByText("Between 30 and 45 of 100 similar projects were more than 12 months late."),
    ).toBeInTheDocument();
  });

  it("keeps the take-home and rent inputs on the page but disabled", () => {
    render(<WaitSection waitDefaults={page.wait_defaults} affordDefault={page.afford_default} />);
    const takeHome = screen.getByLabelText("Household take-home pay, a month");
    expect(takeHome).toBeDisabled();
    expect(takeHome).toHaveValue("₹4,50,000");
    const rent = screen.getByLabelText("Rent you pay now, a month");
    expect(rent).toBeDisabled();
    expect(rent).toHaveValue("₹55,000");
  });
});
