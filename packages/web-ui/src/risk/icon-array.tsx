// The icon array (DESIGN §4 item 7): 100 circles, 10 by 10, filled row by row.
// Filled = band ink (late), hatched = the uncertain range (band ink stripes on
// the band fill; a data pattern, allowed by DESIGN §0), empty = within 12
// months. The counts are the contract's `frequency.icon_array`, and the whole
// figure is read out as the server's natural-frequency sentence.
import type { BandCode, Frequency } from "@plinth/contracts";
import { bandStyle } from "../lib/band";
import { cx } from "../lib/cx";

export type IconArrayProps = {
  frequency: Frequency | null;
  /** The band whose colours draw the figure; null (no public band) draws nothing. */
  band: BandCode | null | undefined;
  /** The figure's accessible name. Defaults to `frequency.sentence`. */
  label?: string;
  /**
   * Legend names for the filled and empty marks, from the artboard
   * ("More than 12 months late", "Within 12 months"). The hatched mark uses
   * `frequency.hatch_legend`. Omit to draw no legend.
   */
  legend?: { late: string; within: string };
  className?: string;
};

export type IconCell = "filled" | "hatched" | "empty";

/** The 100 cells in reading order, from the contract's counts (always exactly 100). */
export function iconCells(counts: Frequency["icon_array"]): IconCell[] {
  const filled = Math.max(0, Math.min(100, counts.filled));
  const hatched = Math.max(0, Math.min(100 - filled, counts.hatched));
  return Array.from({ length: 100 }, (_, i) =>
    i < filled ? "filled" : i < filled + hatched ? "hatched" : "empty",
  );
}

const CELL: Readonly<Record<IconCell, string>> = {
  filled: "bg-(--ui-band-ink)",
  hatched: "border border-(--ui-band-ink) ui-hatch",
  empty: "border border-empty-border bg-empty-cell",
};

function Swatch({ kind }: { kind: IconCell }) {
  return (
    <span
      aria-hidden="true"
      className={cx("box-border inline-block size-3 shrink-0 rounded-circle", CELL[kind])}
    />
  );
}

export function IconArray({ frequency, band, label, legend, className }: IconArrayProps) {
  if (!frequency || !band) return null;
  const cells = iconCells(frequency.icon_array);
  const hatched = cells.includes("hatched");
  return (
    <div
      data-icon-array={band}
      className={cx("flex flex-col gap-4", className)}
      style={bandStyle(band)}
    >
      <div
        role="img"
        aria-label={label ?? frequency.sentence}
        className="grid w-max grid-cols-[repeat(10,18px)] gap-1"
      >
        {cells.map((kind, i) => (
          <span
            key={i}
            data-cell={kind}
            className={cx("box-border block size-[18px] rounded-circle", CELL[kind])}
          />
        ))}
      </div>
      {legend ? (
        <ul
          role="list"
          className="m-0 flex list-none flex-wrap gap-x-4.5 gap-y-1.5 p-0 text-small text-ink2"
        >
          <li className="inline-flex items-center gap-2">
            <Swatch kind="filled" />
            {legend.late}
          </li>
          {hatched && frequency.hatch_legend ? (
            <li className="inline-flex items-center gap-2">
              <Swatch kind="hatched" />
              {frequency.hatch_legend}
            </li>
          ) : null}
          <li className="inline-flex items-center gap-2">
            <Swatch kind="empty" />
            {legend.within}
          </li>
        </ul>
      ) : null}
    </div>
  );
}
