// "2 projects hidden by your filters" (C-21): Aurelia and Heron Point Ph 2,
// from the canonical fixture, named, never silently dropped.
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HiddenList } from "@/src/features/search/hidden-list";
import type { SearchResults } from "@/src/data";

const canonical = loadExpected<SearchResults>("search_projects", "canonical");

describe("HiddenList", () => {
  it("names both hidden projects and why, from the fixture's own hidden[]", () => {
    render(<HiddenList count={canonical.hidden_count} hidden={canonical.hidden ?? []} />);
    expect(screen.getByText(/2 projects hidden by your filters/)).toBeInTheDocument();
    for (const h of canonical.hidden ?? []) {
      expect(screen.getByText(new RegExp(h.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(h.why_line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    }
  });

  it("renders nothing when nothing is hidden", () => {
    const { container } = render(<HiddenList count={0} hidden={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
