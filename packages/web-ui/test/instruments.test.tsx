// Data and instruments: fact tiles, the cost table, the 3D tower, the replay slider.
import type { ProjectPage } from "@plinth/contracts";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CostTable, FactTile, FactTiles, ReplaySlider, TowerStack, slabsFromPct } from "../src";
import { COPY, fixture } from "./fixtures";

const aurelia = fixture("aurelia-heights-phase-2");
const laurel = fixture("laurel-residency");
const juniper = fixture("juniper-enclave");

describe("FactTiles", () => {
  it("pairs each label with its value as a term and its definition", () => {
    const { risk } = aurelia;
    const { container } = render(
      <FactTiles columns={3}>
        <FactTile label="Built" value={`${risk.progress.built_pct}%`} emphasis="accent" />
        <FactTile
          label="Sold"
          value={`${risk.progress.sold_pct}%`}
          emphasis="band"
          band="elevated"
        />
        <FactTile label="Time used" value={`${risk.progress.time_used_pct}%`} />
      </FactTiles>,
    );
    const dl = container.querySelector("dl")!;
    expect([...dl.querySelectorAll("dt")].map((d) => d.textContent)).toEqual([
      "Built",
      "Sold",
      "Time used",
    ]);
    expect([...dl.querySelectorAll("dd")].map((d) => d.textContent)).toEqual(["41%", "72%", "77%"]);
    expect(dl.querySelectorAll("dd")[0]!.className).toContain("text-accent-text");
    expect(dl.querySelectorAll("dd")[1]!.className).toContain("text-(--ui-band-text)");
  });
});

describe("CostTable", () => {
  it("Aurelia: every rules-engine line, the tags, the all-in total and the comparison", () => {
    render(<CostTable cost={aurelia.page.cost} totalLabel={COPY.allIn} tagLabels={COPY.tags} />);
    const terms = screen.getAllByRole("term").map((t) => t.textContent);
    expect(terms).toEqual([
      "Base",
      "PLC (park-facing)",
      "Club",
      "Parking",
      "IFMS",
      "GST 5%",
      "Stamp duty + registration",
      "All-in",
    ]);
    const total = screen.getByText("All-in").parentElement!;
    expect(within(total).getByText("₹2.74 Cr")).toBeInTheDocument();
    expect(screen.getAllByText("Often negotiable")).toHaveLength(2);
    expect(screen.getAllByText("Set by law")).toHaveLength(2);
    expect(screen.getByText("17% more than quoted · ₹18,900 per sq ft carpet")).toBeInTheDocument();
  });

  it("nothing without a cost sheet (Laurel, Juniper)", () => {
    for (const f of [laurel, juniper]) {
      expect(
        render(<CostTable cost={f.page.cost} totalLabel={COPY.allIn} />).container,
      ).toBeEmptyDOMElement();
    }
  });
});

describe("TowerStack", () => {
  it("Aurelia: 20 slabs, 8 built (41%), the sold outline at slab 14 (72%) in the band ink", () => {
    const { risk, page } = aurelia;
    const { container } = render(
      <TowerStack
        floors={page.progress.floors_per_tower}
        built={slabsFromPct(risk.progress.built_pct)}
        sold={slabsFromPct(risk.progress.sold_pct)}
        band={risk.band?.code}
      />,
    );
    const tower = container.querySelector("[data-tower]") as HTMLElement;
    expect(tower).toHaveAttribute("aria-hidden", "true");
    expect(tower.querySelectorAll("[data-slab]")).toHaveLength(20);
    expect(tower.querySelectorAll('[data-built="true"]')).toHaveLength(8);
    const sold = tower.querySelector('[data-sold-level="true"]') as HTMLElement;
    expect(sold).toHaveAttribute("data-slab", "14");
    expect(sold.className).toContain("outline-(--ui-band-ink)");
    expect(tower.style.getPropertyValue("--ui-band-ink")).toBe("var(--pl-risk-elevated-ink)");
    expect((tower.querySelector('[data-slab="3"]') as HTMLElement).style.transform).toBe(
      "translateZ(14px)",
    );
  });

  it("a tower's slab from the QPR: Tower A at slab 9 of 20", () => {
    const last = aurelia.page.progress.quarters.at(-1)!;
    const { container } = render(<TowerStack floors={20} built={last.towers!.A!} />);
    expect(container.querySelectorAll('[data-built="true"]')).toHaveLength(9);
    expect(container.querySelector("[data-sold-level]")).toBeNull();
  });

  it("phases without a floor count draw 20 floors (Laurel, Juniper)", () => {
    for (const f of [laurel, juniper]) {
      const { container } = render(
        <TowerStack
          floors={f.page.progress.floors_per_tower}
          built={slabsFromPct(f.risk.progress.built_pct)}
          band={f.risk.band?.code}
        />,
      );
      expect(container.querySelectorAll("[data-slab]")).toHaveLength(20);
    }
  });

  it("slabsFromPct rounds to whole slabs and stays inside the tower", () => {
    expect(slabsFromPct(41)).toBe(8);
    expect(slabsFromPct(72)).toBe(14);
    expect(slabsFromPct(9)).toBe(2);
    expect(slabsFromPct(null)).toBe(0);
    expect(slabsFromPct(130)).toBe(20);
  });
});

function Replay({ page, onChange }: { page: ProjectPage; onChange?: (i: number) => void }) {
  const stops = page.progress.quarters;
  const [i, setI] = useState(stops.length - 1);
  return (
    <ReplaySlider
      stops={stops}
      value={i}
      onChange={(n) => {
        setI(n);
        onChange?.(n);
      }}
      label={
        <>
          Quarter on record: <strong>{stops[i]?.label}</strong>
        </>
      }
      previousLabel={COPY.earlier}
      nextLabel={COPY.later}
    />
  );
}

describe("ReplaySlider", () => {
  it("is a labelled range over the quarters that reads out the quarter's name", () => {
    render(<Replay page={aurelia.page} />);
    const range = screen.getByRole("slider", { name: "Quarter on record: Apr–Jun 2026" });
    expect(range).toHaveAttribute("min", "0");
    expect(range).toHaveAttribute("max", "7");
    expect(range).toHaveAttribute("aria-valuetext", "Apr–Jun 2026");
    fireEvent.change(range, { target: { value: "3" } });
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "Oct–Dec 2024");
  });

  it("steps one report at a time with the arrow buttons, which stay focusable at the ends", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Replay page={aurelia.page} onChange={onChange} />);
    const later = screen.getByRole("button", { name: COPY.later });
    const earlier = screen.getByRole("button", { name: COPY.earlier });
    expect(later).toHaveAttribute("aria-disabled", "true");
    await user.click(later);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(earlier);
    expect(onChange).toHaveBeenLastCalledWith(6);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "Jan–Mar 2026");
    expect(later).toHaveAttribute("aria-disabled", "false");
    earlier.focus();
    for (let k = 0; k < 10; k++) await user.keyboard("{Enter}");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "Apr–Jun 2023");
    expect(earlier).toHaveAttribute("aria-disabled", "true");
    expect(earlier).toHaveFocus();
  });

  it("Juniper's single report: the range and both buttons are inert", () => {
    render(<Replay page={juniper.page} />);
    expect(screen.getByRole("slider")).toBeDisabled();
    expect(screen.getByRole("button", { name: COPY.earlier })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: COPY.later })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("shows the first and last stops under the track", () => {
    const { container } = render(<Replay page={laurel.page} />);
    const ends = container.querySelector('[aria-hidden="true"].flex.justify-between')!;
    expect(ends).toHaveTextContent(laurel.page.progress.quarters[0]!.label);
    expect(ends).toHaveTextContent(laurel.page.progress.quarters.at(-1)!.label);
  });
});
