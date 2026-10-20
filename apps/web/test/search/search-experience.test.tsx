// WebSearch, end to end against the real fixtures (no network, no accounts):
// packages/fixtures/expected/search_projects/{canonical,unknown-project}.json.
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchExperience } from "@/src/features/search/search-experience";
import type { SearchResults } from "@/src/data";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => push.mockClear());

const canonical = loadExpected<SearchResults>("search_projects", "canonical");
const unknownProject = loadExpected<SearchResults>("search_projects", "unknown-project");

function renderCanonical() {
  return render(
    <SearchExperience
      query={canonical.query ?? ""}
      sort="lowest_risk"
      items={canonical.items}
      parsed={canonical.parsed}
      sortLine={canonical.sort_line}
      legendLine={canonical.legend_line!}
      hiddenCount={canonical.hidden_count}
      hidden={canonical.hidden ?? []}
      zeroResults={null}
      tilesEnabled={false}
    />,
  );
}

describe("SearchExperience: the canonical query", () => {
  it("shows Kestrel Park with the all-in price first, and the single page h1", () => {
    renderCanonical();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("4 projects match");
    expect(screen.getByText("₹2.44 Cr all-in · quoted ₹2.10 Cr")).toBeInTheDocument();
  });

  it("the risk filter shows Low and Moderate as two separate, removable tiles", () => {
    renderCanonical();
    const sentence = screen.getByText("Ask Plinth read your search as").closest("div")!;
    expect(within(sentence).getByRole("button", { name: /Drop Low from the search/ })).toBeInTheDocument();
    expect(
      within(sentence).getByRole("button", { name: /Drop Moderate from the search/ }),
    ).toBeInTheDocument();
  });

  it("dropping a tile asks for a real search without that word, never a silently edited list", async () => {
    renderCanonical();
    await userEvent.click(screen.getByRole("button", { name: "Drop 3 BHK from the search" }));
    expect(push).toHaveBeenCalledTimes(1);
    const href = push.mock.calls[0]![0] as string;
    expect(href.startsWith("/search?q=")).toBe(true);
    expect(decodeURIComponent(href.replace("/search?q=", "").replace(/\+/g, " "))).toBe(
      "dwarka expressway under 2.5 cr low risk",
    );
  });

  it("names the 2 hidden projects (Aurelia, Heron Point Ph 2), never silently", () => {
    renderCanonical();
    expect(screen.getByText(/2 projects hidden by your filters/)).toBeInTheDocument();
    expect(screen.getByText(/Aurelia Heights, Phase 2/)).toBeInTheDocument();
    expect(screen.getByText(/Heron Point, Phase 2/)).toBeInTheDocument();
  });

  it("the sort line only shows after 'How ranking works' is opened, and is the server's own words", async () => {
    renderCanonical();
    expect(screen.queryByText(canonical.sort_line)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "How ranking works" }));
    expect(screen.getByText(canonical.sort_line)).toBeInTheDocument();
  });
});

describe("SearchExperience: the unknown-project zero-results state", () => {
  it("shows only the guidance panel (no empty list or map chrome)", () => {
    render(
      <SearchExperience
        query={unknownProject.query ?? ""}
        sort="lowest_risk"
        items={unknownProject.items}
        parsed={unknownProject.parsed}
        sortLine={unknownProject.sort_line}
        legendLine={unknownProject.legend_line!}
        hiddenCount={unknownProject.hidden_count}
        hidden={unknownProject.hidden ?? []}
        zeroResults={unknownProject.zero_results}
        tilesEnabled={false}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(unknownProject.zero_results!.line);
    expect(screen.queryByTestId("search-map")).not.toBeInTheDocument();
  });
});
