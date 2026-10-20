// T20b acceptance: "What will I really pay?" shows the static cost table and
// the From-the-developer plan, with slab 12 flagged against the latest QPR.
import type { ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CostSection } from "@/src/features/project/sections/cost/cost-section";

const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2");

describe("CostSection", () => {
  it("shows the all-in and its negotiable charges", () => {
    render(
      <CostSection
        cost={page.cost}
        fromDeveloper={page.from_developer}
        waitDefaults={page.wait_defaults}
        affordDefault={page.afford_default}
      />,
    );
    expect(screen.getByText("Where the ₹2.74 Cr goes")).toBeInTheDocument();
    expect(screen.getByText("₹2.74 Cr")).toBeInTheDocument();
    expect(screen.getByText("Often negotiable: PLC and club (₹4.4 L).")).toBeInTheDocument();
  });

  it("flags the slab 12 demand against the latest QPR", () => {
    render(
      <CostSection
        cost={page.cost}
        fromDeveloper={page.from_developer}
        waitDefaults={page.wait_defaults}
        affordDefault={page.afford_default}
      />,
    );
    expect(
      screen.getByText("A demand for Tower A slab 12 went out on 10 Oct 2026, while the latest QPR shows slab 9."),
    ).toBeInTheDocument();
  });

  it("lists the price history and links to the before-you-pay check", () => {
    render(
      <CostSection
        cost={page.cost}
        fromDeveloper={page.from_developer}
        waitDefaults={page.wait_defaults}
        affordDefault={page.afford_default}
      />,
    );
    expect(screen.getByText("Price lists we have on file")).toBeInTheDocument();
    expect(screen.getByText("Launch, Jan 2023")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Check before you pay anything" })).toHaveAttribute(
      "href",
      "/check/before-you-pay",
    );
  });
});
