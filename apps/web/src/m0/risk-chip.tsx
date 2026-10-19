// M0 gate stand-in (T07; INTEGRATION_NOTES "Elevated chip on Aurelia"). The
// borderless risk chip (DESIGN §0 and §4 item 4): band fill on a pill, a mini
// 5-segment meter and the band name, no outline. Every word and number comes
// from the RiskSummary's `chip`; colours come from @plinth/tokens.
// T14 builds the real RiskChip in @plinth/web-ui and T20a's project page
// replaces this file.
import type { Chip } from "@plinth/contracts";

type Tone = { chip: string; on: string };

/** Literal class names, so Tailwind generates every one (no string building). */
const TONES: Record<string, Tone> = {
  low: { chip: "bg-risk-low-fill text-risk-low-text", on: "bg-risk-low-ink" },
  moderate: { chip: "bg-risk-moderate-fill text-risk-moderate-text", on: "bg-risk-moderate-ink" },
  elevated: { chip: "bg-risk-elevated-fill text-risk-elevated-text", on: "bg-risk-elevated-ink" },
  high: { chip: "bg-risk-high-fill text-risk-high-text", on: "bg-risk-high-ink" },
  severe: { chip: "bg-risk-severe-fill text-risk-severe-text", on: "bg-risk-severe-ink" },
  limited_history: {
    chip: "bg-risk-limited-fill text-risk-limited-text",
    on: "bg-risk-limited-ink",
  },
  not_scored: {
    chip: "bg-risk-not-scored-fill text-risk-not-scored-text",
    on: "bg-risk-not-scored-ink",
  },
  withheld: { chip: "bg-chip-fill text-ink2", on: "bg-ink2" },
};

const SEGMENTS = [1, 2, 3, 4, 5] as const;

/** `band` is the RiskSummary's band code; null when the phase has no public band. */
export function RiskChip({ chip, band }: { chip: Chip; band: string | null }) {
  const key = chip.kind === "band" && band ? band : chip.kind;
  const tone = TONES[key] ?? TONES.not_scored!;
  return (
    <span
      data-testid="risk-chip"
      data-band={key}
      className={`inline-flex h-7 items-center gap-2 rounded-pill px-3 text-caption font-semibold ${tone.chip}`}
    >
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {SEGMENTS.map((n) => (
          <span
            key={n}
            data-on={n <= chip.meter_filled ? "true" : undefined}
            className={`block h-2.5 w-1.5 rounded-segment ${
              n <= chip.meter_filled ? tone.on : "border border-empty-border bg-meter-off"
            }`}
          />
        ))}
      </span>
      {chip.label}
    </span>
  );
}
