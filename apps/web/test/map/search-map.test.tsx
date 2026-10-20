// The shared map (T22): pins placed from each card's own centroid, the
// server's legend line, and the labelled "Map placeholder" state the fixture
// world ships by default (`map_tiles` off). jsdom has no WebGL, so the
// `tilesEnabled` path also exercises the feature-detect fallback.
import { loadExpected } from "@plinth/fixtures/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchMap, type MapPin } from "@/src/features/map/search-map";
import { projectPct } from "@/src/features/map/geo";
import type { SearchResults } from "@/src/data";

const canonical = loadExpected<SearchResults>("search_projects", "canonical");

function pinsFromFixture(): MapPin[] {
  return canonical.items.map((c) => ({
    slug: c.slug,
    name: c.name,
    pinLabel: c.pin_label,
    centroid: c.centroid ? ([c.centroid[0], c.centroid[1]] as const) : null,
  }));
}

describe("SearchMap (map_tiles off: the fixture default)", () => {
  it("shows the labelled placeholder and the server's legend line", () => {
    render(
      <SearchMap
        pins={pinsFromFixture()}
        selected={null}
        onSelect={() => {}}
        legendLine={canonical.legend_line!}
        tilesEnabled={false}
      />,
    );
    expect(screen.getByText("Map placeholder · not to scale")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(canonical.legend_line!))).toBeInTheDocument();
  });

  it("places one pin per card, at its own projected position, with the all-in label", () => {
    const pins = pinsFromFixture();
    render(
      <SearchMap
        pins={pins}
        selected={null}
        onSelect={() => {}}
        legendLine={canonical.legend_line!}
        tilesEnabled={false}
      />,
    );
    const kestrel = pins.find((p) => p.slug === "kestrel-park")!;
    const pin = screen.getByRole("button", { name: `Kestrel Park, ${kestrel.pinLabel}` });
    expect(pin).toHaveTextContent(kestrel.pinLabel!);
    const { x, y } = projectPct(kestrel.centroid!);
    expect(pin.style.left).toBe(`${x}%`);
    expect(pin.style.top).toBe(`${y}%`);
  });

  it("a quoted-only project (no cost sheet) reads 'Quoted', not a bare price", () => {
    const pins = pinsFromFixture();
    render(
      <SearchMap
        pins={pins}
        selected={null}
        onSelect={() => {}}
        legendLine={canonical.legend_line!}
        tilesEnabled={false}
      />,
    );
    const cedar = pins.find((p) => p.slug === "cedar-walk-phase-2")!;
    expect(cedar.pinLabel).toBeNull();
    expect(screen.getByRole("button", { name: /Cedar Walk, Phase 2, quoted price/ })).toHaveTextContent(
      "Quoted Cedar Walk, Phase 2",
    );
  });

  it("clicking a pin selects it", async () => {
    const onSelect = vi.fn();
    const pins = pinsFromFixture();
    render(
      <SearchMap
        pins={pins}
        selected={null}
        onSelect={onSelect}
        legendLine={canonical.legend_line!}
        tilesEnabled={false}
      />,
    );
    await userEvent.click(screen.getAllByTestId("map-pin")[0]!);
    expect(onSelect).toHaveBeenCalled();
  });
});

describe("SearchMap (map_tiles on, no WebGL in this test environment)", () => {
  it("falls back to the same labelled placeholder rather than a blank map", async () => {
    render(
      <SearchMap
        pins={pinsFromFixture()}
        selected={null}
        onSelect={() => {}}
        legendLine={canonical.legend_line!}
        tilesEnabled
      />,
    );
    expect(await screen.findByText("Map placeholder · not to scale")).toBeInTheDocument();
  });
});
