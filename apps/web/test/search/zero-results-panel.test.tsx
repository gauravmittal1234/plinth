// The three zero-results states, each read verbatim from its own fixture
// (packages/fixtures/expected/search_projects): G-39's one-tap fix, G-30's
// Request it and the Noida waitlist.
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ZeroResultsPanel } from "@/src/features/search/zero-results-panel";
import type { SearchResults } from "@/src/data";
import type { ZeroResultsPayload } from "@/src/features/search/types";

const zeroResultsFixture = loadExpected<SearchResults>("search_projects", "zero-results");
const unknownProject = loadExpected<SearchResults>("search_projects", "unknown-project");
const outsideCoverage = loadExpected<SearchResults>("search_projects", "outside-coverage");

describe("ZeroResultsPanel: no_match (G-39)", () => {
  const zr = zeroResultsFixture.zero_results as ZeroResultsPayload;

  it("names the headline and the one-tap action from the fixture, with no result revealed yet", () => {
    render(<ZeroResultsPanel zeroResults={zr} name={null} hidden={zeroResultsFixture.hidden ?? []} />);
    expect(screen.getByRole("heading", { level: 1, name: zr.line })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Risk: add Elevated" })).toBeInTheDocument();
    expect(screen.queryByText(zr.detail_line!)).not.toBeInTheDocument();
  });

  it("one tap reveals the brought-back project, by name, with its own detail line", async () => {
    render(<ZeroResultsPanel zeroResults={zr} name={null} hidden={zeroResultsFixture.hidden ?? []} />);
    await userEvent.click(screen.getByRole("button", { name: "Risk: add Elevated" }));
    expect(screen.getByText(zr.detail_line!)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Aurelia Heights, Phase 2" });
    expect(link).toHaveAttribute("href", "/gurugram/projects/aurelia-heights-phase-2");
  });
});

describe("ZeroResultsPanel: unknown_project (G-30)", () => {
  const zr = unknownProject.zero_results as ZeroResultsPayload;

  it("offers Request it, and never shows a reference the server did not issue", async () => {
    render(<ZeroResultsPanel zeroResults={zr} name="Indigo Terraces" hidden={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: zr.line })).toBeInTheDocument();
    expect(screen.getByText(zr.detail_line!)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Request it" }));
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Fixture mode doesn’t record requests yet");
    expect(status).not.toHaveTextContent("R-1018-07");
  });
});

describe("ZeroResultsPanel: outside_coverage (G-30)", () => {
  const zr = outsideCoverage.zero_results as ZeroResultsPayload;

  it("offers the Noida waitlist with the fixture's own detail line", async () => {
    render(<ZeroResultsPanel zeroResults={zr} name={null} hidden={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: zr.line })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Join the Noida waitlist" }));
    expect(screen.getByText("On the waitlist")).toBeInTheDocument();
    expect(screen.getByText(zr.detail_line!)).toBeInTheDocument();
  });
});
