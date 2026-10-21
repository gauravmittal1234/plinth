// Fact tiles (DESIGN §4 item 11): a label and one big number on a tone step,
// square-ish (radius ≤ 8), no border. Tiles are <div>s of <dt>/<dd> inside one
// <dl> (FactTiles), so "Built 41%" reads as a term and its value.
import type { BandCode } from "@plinth/contracts";
import type { ReactNode } from "react";
import { bandStyle } from "../lib/band";
import { cx } from "../lib/cx";

export type FactTilesProps = {
  children: ReactNode;
  /** Columns: a fixed count (the Built / Sold / Time used row) or auto-fit. */
  columns?: 2 | 3 | 4 | "auto";
  className?: string;
};

const COLUMNS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  auto: "grid-cols-[repeat(auto-fit,minmax(min(9rem,100%),1fr))]",
} as const;

export function FactTiles({ children, columns = "auto", className }: FactTilesProps) {
  return <dl className={cx("m-0 grid gap-2", COLUMNS[columns], className)}>{children}</dl>;
}

export type FactTileProps = {
  label: ReactNode;
  value: ReactNode;
  /** The tile's ground: `track` on the page ground, `bg` on a track band. */
  tone?: "track" | "bg";
  /** The number's colour: ink, the accent (Built), or a band's text colour (Sold, when it leads). */
  emphasis?: "ink" | "accent" | "band";
  /** The band for `emphasis="band"`. */
  band?: BandCode | null;
  className?: string;
};

export function FactTile({
  label,
  value,
  tone = "track",
  emphasis = "ink",
  band,
  className,
}: FactTileProps) {
  const banded = emphasis === "band" && band;
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col gap-0.5 rounded-panel px-3.5 py-2.5",
        tone === "bg" ? "bg-bg-solid" : "bg-track",
        className,
      )}
      style={banded ? bandStyle(band) : undefined}
    >
      <dt className="text-caption leading-snug text-ink2">{label}</dt>
      <dd
        className={cx(
          "m-0 font-sans text-number font-bold",
          emphasis === "accent" && "text-accent-text",
          banded ? "text-(--ui-band-text)" : emphasis !== "accent" && "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
