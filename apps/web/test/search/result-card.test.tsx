// ResultCard renders exactly the fixture's own words (all-in first, G-21):
// packages/fixtures/expected/search_projects/canonical.json → Kestrel Park.
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResultCard } from "@/src/features/search/result-card";
import type { SearchResults } from "@/src/data";

const canonical = loadExpected<SearchResults>("search_projects", "canonical");
const kestrel = canonical.items.find((i) => i.slug === "kestrel-park")!;
const cedarWalk = canonical.items.find((i) => i.slug === "cedar-walk-phase-2")!;

describe("ResultCard", () => {
  it("leads with the all-in price, quoted second, from the card's own price_line", () => {
    render(
      <ul>
        <ResultCard card={kestrel} selected={false} onHover={() => {}} />
      </ul>,
    );
    expect(screen.getByText("₹2.44 Cr all-in · quoted ₹2.10 Cr")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kestrel Park/ })).toHaveAttribute(
      "href",
      "/gurugram/projects/kestrel-park",
    );
  });

  it("shows the borderless risk chip with the server's own label", () => {
    render(
      <ul>
        <ResultCard card={kestrel} selected={false} onHover={() => {}} />
      </ul>,
    );
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getByText(kestrel.chip_note!)).toBeInTheDocument();
  });

  it("a Northfield card without a cost sheet still reads quoted-only, and notes less certainty", () => {
    render(
      <ul>
        <ResultCard card={cedarWalk} selected={false} onHover={() => {}} />
      </ul>,
    );
    expect(screen.getByText("Quoted ₹1.85 Cr · all-in not known yet")).toBeInTheDocument();
    expect(screen.getByText(/less certain about this one/)).toBeInTheDocument();
  });

  it("hovering or focusing a row reports its slug, so the map can follow it", async () => {
    const onHover = vi.fn();
    render(
      <ul>
        <ResultCard card={kestrel} selected={false} onHover={onHover} />
      </ul>,
    );
    await userEvent.hover(screen.getByRole("link"));
    expect(onHover).toHaveBeenCalledWith("kestrel-park");
    await userEvent.unhover(screen.getByRole("link"));
    expect(onHover).toHaveBeenLastCalledWith(null);
  });
});
