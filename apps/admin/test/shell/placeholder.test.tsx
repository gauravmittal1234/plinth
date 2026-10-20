import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Placeholder } from "@/src/shell/placeholder";

describe("Placeholder", () => {
  it("names the screen and when it's coming", () => {
    render(<Placeholder title="Review queue" milestone="M3" />);
    expect(screen.getByRole("heading", { level: 1, name: "Review queue" })).toBeInTheDocument();
    expect(screen.getByText(/Planned for M3/)).toBeInTheDocument();
  });

  it("names a different milestone for a different screen", () => {
    render(<Placeholder title="Disputes" milestone="M4" />);
    expect(screen.getByText(/Planned for M4/)).toBeInTheDocument();
  });
});
