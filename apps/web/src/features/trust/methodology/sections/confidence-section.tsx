// "How sure are we?" (T25 Build: "confidence states"). Every line is
// `api.methodology().confidence`: two certain states plus the two unscored
// states, each with its own dot count (never part of a band name).
import type { Methodology } from "@/src/data";
import { cx } from "../../cx";

const LEVEL_LABEL: Record<string, string> = {
  high: "More certain",
  low: "Less certain",
  limited_history: "Limited history",
  not_scored: "Not scored",
};

function Dots({ filled }: { filled: number }) {
  return (
    <span aria-hidden="true" className="mt-[0.3em] inline-flex shrink-0 gap-[3px]">
      {[1, 2].map((n) => (
        <span
          key={n}
          className={cx(
            "size-[7px] rounded-circle",
            n <= filled ? "bg-ink2" : "border-[1.5px] border-ink2",
          )}
        />
      ))}
    </span>
  );
}

export function ConfidenceSection({ methodology }: { methodology: Methodology }) {
  const confidence = methodology.confidence ?? [];
  if (!confidence.length) return null;
  return (
    <section aria-labelledby="confidence-h" className="bg-bg py-18 text-ink md:py-30">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-6 px-4 sm:px-8">
        <h2 id="confidence-h" className="m-0 font-display text-h2 font-extrabold">
          How sure are we?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Every score says how sure we are. When history is thin, we widen the range, or say
          there&rsquo;s not enough history to score. Limited history is never a penalty.
        </p>

        <ul role="list" className="m-0 flex flex-col gap-4 p-0">
          {confidence.map((level) => (
            <li key={level.level} data-confidence={level.level} className="flex items-start gap-3">
              <Dots filled={level.dots} />
              <div>
                <p className="m-0 font-semibold">{LEVEL_LABEL[level.level] ?? level.level}</p>
                <p className="m-0 mt-1 text-body text-ink2">{level.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
