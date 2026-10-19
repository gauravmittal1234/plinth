// The source chip (DESIGN §0, §4 item 8): a filled tone pill with a document
// mark and the source's label ("HARERA QPR · Apr–Jun 2026"). No border. It opens
// the evidence drawer (a button, when the page handles `onOpen`), or links to
// the evidence page (`evidence_url`), or is plain text when there is neither.
import type { SourceRef } from "@plinth/contracts";
import { cx } from "../lib/cx";
import { DocIcon } from "../lib/icons";

/** The two fields a chip needs; a Records row maps `{ label: row.chip, evidence_url: row.evidence_url }`. */
export type SourceLike = Pick<SourceRef, "label" | "evidence_url">;

export type SourceChipProps<S extends SourceLike = SourceLike> = {
  source: S;
  /** Opens the evidence drawer for this source. Makes the chip a button. */
  onOpen?: (source: S) => void;
  /** A fuller name for assistive tech ("Source: HARERA QPR · Apr–Jun 2026. Open evidence."), from the page. */
  ariaLabel?: string;
  /** The ground the chip sits on, so the pill keeps one tone step above it. */
  surface?: "bg" | "track" | "claim";
  className?: string;
};

const SURFACE = {
  bg: "bg-chip-fill",
  track: "bg-chip-fill-on-track",
  claim: "bg-chip-fill-on-claim",
} as const;

const INTERACTIVE =
  "cursor-pointer transition-[transform,filter] duration-(--pl-motion-duration-press) ease-out hover:brightness-95 active:scale-[0.97] night:hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function SourceChip<S extends SourceLike>({
  source,
  onOpen,
  ariaLabel,
  surface = "bg",
  className,
}: SourceChipProps<S>) {
  const classes = cx(
    "inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-pill px-3 py-[3px] text-left font-sans text-caption leading-tight font-normal text-ink no-underline",
    SURFACE[surface],
    className,
  );
  const body = (
    <>
      <DocIcon className="shrink-0" />
      <span className="min-w-0">{source.label}</span>
    </>
  );
  if (onOpen) {
    return (
      <button
        type="button"
        aria-label={ariaLabel}
        data-source-chip=""
        className={cx(classes, "border-0", INTERACTIVE)}
        onClick={() => onOpen(source)}
      >
        {body}
      </button>
    );
  }
  if (source.evidence_url) {
    return (
      <a
        href={source.evidence_url}
        aria-label={ariaLabel}
        data-source-chip=""
        className={cx(classes, INTERACTIVE)}
      >
        {body}
      </a>
    );
  }
  return (
    <span data-source-chip="" className={classes}>
      {body}
    </span>
  );
}
