// T20b acceptance (WORK_BREAKDOWN §4): "What are the homes like?" renders the
// 4 BHK's "no all-in yet" note and the reported, unverified waterlogging.
import type { ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomesSection } from "@/src/features/project/sections/homes/homes-section";

const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2");

describe("HomesSection", () => {
  it("shows the 4 BHK has no cost sheet, so no all-in yet", () => {
    render(<HomesSection homes={page.homes} />);
    expect(screen.getByText("No 4 BHK cost sheet, so no all-in yet.")).toBeInTheDocument();
  });

  it("shows the 3 BHK's all-in and carpet area, each in its own lane", () => {
    render(<HomesSection homes={page.homes} />);
    expect(screen.getByText("₹2.74 Cr all-in")).toBeInTheDocument();
    expect(screen.getByText("1,450 sq ft carpet")).toBeInTheDocument();
  });

  it("draws a floor plan with the room list as real, readable text", () => {
    render(<HomesSection homes={page.homes} />);
    expect(screen.getByText("Living + dining 22′ × 13′")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Illustrative floor plan/ }).length).toBeGreaterThan(0);
  });

  it("lists the reported, unverified waterlogging near Sector 37D", () => {
    render(<HomesSection homes={page.homes} />);
    expect(screen.getByText("Reported waterlogging near Sector 37D")).toBeInTheDocument();
    expect(
      screen.getByText(/Reported, not verified by Plinth\. No report names the Aurelia site itself\./),
    ).toBeInTheDocument();
  });
});
