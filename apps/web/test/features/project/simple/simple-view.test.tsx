// T20b acceptance (brief Accept line): Simple view renders at 24 px body
// (fix-project2.md §1 G-27: "24 px body on web, 21 px on phone"). The
// header's "Simple view" toggle and the route's `?view=` switch are a
// handoff (see the PR body); this is the screen itself, ready to mount.
import type { Methodology, ProjectPage } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SimpleView } from "@/src/features/project/simple/simple-view";

const page = loadExpected<ProjectPage>("project_page", "aurelia-heights-phase-2");
const bands = loadExpected<Methodology>("methodology", "default").bands;

describe("SimpleView", () => {
  it("renders its body at 24 px on web (21 px on phone)", () => {
    render(<SimpleView page={page} bands={bands} />);
    const main = screen.getByRole("main");
    expect(main.className).toContain("text-[21px]");
    expect(main.className).toContain("sm:text-[24px]");
  });

  it("gives the band, a one-sentence step and the keys range", () => {
    render(<SimpleView page={page} bands={bands} />);
    expect(screen.getByText("Elevated")).toBeInTheDocument();
    expect(screen.getByText(/Step 3 of our five, from Low to Severe\./)).toBeInTheDocument();
    expect(screen.getByText(page.risk.late12.line)).toBeInTheDocument();
  });

  it("shows 3 reasons with plain sources, and 3 next steps", () => {
    render(<SimpleView page={page} bands={bands} />);
    for (const reason of page.risk.reasons.slice(0, 3)) {
      expect(screen.getByText(reason.text)).toBeInTheDocument();
    }
    for (const step of page.next_steps.steps.slice(0, 3)) {
      expect(screen.getByText(step.heading)).toBeInTheDocument();
    }
  });

  it("steps the built report with Earlier/Later buttons, not a drag", () => {
    render(<SimpleView page={page} bands={bands} />);
    expect(screen.getByRole("button", { name: "Earlier report" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Later report" })).toBeInTheDocument();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("offers Follow and a link back to the full page", () => {
    render(<SimpleView page={page} bands={bands} />);
    expect(screen.getByRole("link", { name: "Follow" })).toHaveAttribute(
      "href",
      "/sign-in?next=/gurugram/projects/aurelia-heights-phase-2",
    );
    expect(screen.getByRole("link", { name: "Back to the full page" })).toHaveAttribute(
      "href",
      "/gurugram/projects/aurelia-heights-phase-2",
    );
  });

  it("offers Read this aloud", () => {
    render(<SimpleView page={page} bands={bands} />);
    expect(screen.getByRole("button", { name: /Read this aloud/ })).toBeInTheDocument();
  });
});
