// T20b acceptance: "Picture yourself here" — the drag-to-compare mechanic
// (DESIGN §4b "Picture it furnished") and the style chips, over the shell's
// own illustrative placeholder panes until the real Visualise asset lands
// (DESIGN §5b "Visualise: under construction"; the feature itself is M5).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PictureSection } from "@/src/features/project/sections/picture/picture-section";

describe("PictureSection", () => {
  it("shows the original photo first, behind a drag-to-compare slider", () => {
    render(<PictureSection />);
    expect(screen.getByRole("slider")).toHaveValue("0");
    expect(screen.getByText(/Original photo/)).toBeInTheDocument();
    expect(screen.getByText("AI-generated illustration")).toBeInTheDocument();
  });

  it("lists the furnishing styles, with their budgets framed as rough estimates", () => {
    render(<PictureSection />);
    expect(screen.getByText("Modern Indian")).toBeInTheDocument();
    expect(screen.getByText("Minimal")).toBeInTheDocument();
    expect(screen.getByText("Warm wood")).toBeInTheDocument();
    expect(screen.getByText(/Prices are rough furnishing budgets; items are illustrative\./)).toBeInTheDocument();
  });
});
