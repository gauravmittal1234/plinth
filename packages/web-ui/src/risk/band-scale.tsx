// The band scale (DESIGN §4 item 6): the five bands in order. The current band
// is a tall bar in its ink with an ink outline; the others are short bars in
// their fill. A real list, so a screen reader hears the five names in order and
// "current" on this project's band. Band names come from the server
// (Methodology.bands), never from this file.
import type { BandCode, BandRange } from "@plinth/contracts";
import { bandStyle } from "../lib/band";
import { cx } from "../lib/cx";

export type BandScaleProps = {
  /** The five bands with their names, as `api.methodology().bands` returns them. */
  bands: ReadonlyArray<Pick<BandRange, "code" | "label">>;
  /** This project's band; null draws the scale with no band marked. */
  current: BandCode | null;
  /** Names the list ("Delivery risk scale"), from the artboard. */
  label?: string;
  className?: string;
};

export function BandScale({ bands, current, label, className }: BandScaleProps) {
  return (
    <ol
      role="list"
      aria-label={label}
      className={cx("m-0 grid w-full list-none grid-cols-5 gap-2 p-0 sm:gap-3", className)}
    >
      {bands.map((b) => {
        const on = b.code === current;
        return (
          <li
            key={b.code}
            data-band={b.code}
            aria-current={on ? "true" : undefined}
            className="flex min-w-0 flex-col gap-2"
            style={bandStyle(b.code)}
          >
            <span aria-hidden="true" className="flex h-7 items-center">
              <span
                className={cx(
                  "box-border block w-full rounded-pill",
                  on
                    ? "h-[22px] bg-(--ui-band-ink) outline-2 outline-offset-3 outline-ink"
                    : "h-3 border border-(--ui-band-ink) bg-(--ui-band-fill)",
                )}
              />
            </span>
            <span
              className={cx(
                "text-center text-caption leading-snug break-words",
                on ? "font-bold text-ink" : "text-muted",
              )}
            >
              {b.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
