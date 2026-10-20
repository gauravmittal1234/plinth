// SegmentedControl (UI v2, benchmark-thapki.md "Toggles"): one control for a
// 2–3-way exclusive choice (Day/Night, an invite scope, a tower filter)
// instead of separate pills "far apart" ("Day and Night are two separate
// pills far apart. Use one segmented control."). A `track`-tone rail holds
// the options; the selected one gets a fully round `inverse` fill. The group
// is `role="radiogroup"`, each option a `role="radio"` button — the same
// accessible shape the page-local two-pill patterns it replaces already used.
import { cx } from "../lib/cx";

export type SegmentedControlOption<Value extends string> = {
  value: Value;
  label: string;
};

export type SegmentedControlProps<Value extends string> = {
  options: readonly SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  ariaLabel: string;
  className?: string;
};

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<Value>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx("inline-flex gap-1 rounded-field bg-track p-1", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              "min-h-11 min-w-11 cursor-pointer rounded-pill border-0 px-4 text-small font-semibold whitespace-nowrap",
              "transition-[background-color,color] duration-(--pl-motion-duration-press) ease-out",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
              selected
                ? "bg-inverse text-on-inverse"
                : "bg-transparent text-ink hover:brightness-95 night:hover:brightness-125",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
