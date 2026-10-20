// SectionBand (DESIGN §4a): pages are a guided story of full-bleed bands, not
// boxes. Neighbouring bands alternate the ground (`bg`) and the `track` tone,
// with generous space between them (64–88 px phone, 120–200 px desktop across
// two band paddings). Content sits in the 1264 px column with 16/32 px gutters.
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../lib/cx";

export type SectionBandProps = ComponentPropsWithoutRef<"section"> & {
  /** The band's ground. Alternate them down the page. */
  tone?: "bg" | "track";
  /** Content column: the page width (default) or the 65 ch reading measure. */
  width?: "content" | "measure";
  /** Extra classes for the inner column (layout of the section's contents). */
  innerClassName?: string;
};

export function SectionBand({
  tone = "bg",
  width = "content",
  className,
  innerClassName,
  children,
  ...rest
}: SectionBandProps) {
  return (
    <section
      data-tone={tone}
      className={cx(
        "scroll-mt-30 py-9 text-ink md:py-18",
        tone === "track" ? "bg-track" : "bg-bg",
        className,
      )}
      {...rest}
    >
      <div
        className={cx(
          "mx-auto w-full px-4 sm:px-8",
          width === "measure" ? "max-w-[calc(var(--pl-layout-measure)+4rem)]" : "max-w-[79rem]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
