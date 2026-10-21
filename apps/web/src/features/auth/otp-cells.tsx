"use client";

// 6 cells over one real `one-time-code` input (DESIGN.md §5b "WebSignIn",
// state 2; brief: "6 cells over one one-time-code input"). The cells are
// decorative (aria-hidden); the input carries the label, value and errors, so
// a screen reader and autofill both see one ordinary 6-digit field. Borders
// are allowed here: DESIGN §0 exempts "real form fields" from the no-hairline
// rule.
import { useId } from "react";
import { cx } from "./cx";
import { digitsOnly } from "./phone";

const CELL_COUNT = 6;

export function OtpCells({
  value,
  onChange,
  onEnter,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (digits: string) => void;
  onEnter: () => void;
  invalid: boolean;
  describedBy: string;
}) {
  const inputId = useId();
  const cells = Array.from({ length: CELL_COUNT }, (_, i) => value[i] ?? "");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-body font-semibold">
        6-digit code
      </label>
      <div className="relative grid h-16 grid-cols-6 gap-2">
        {cells.map((digit, i) => {
          const active = i === value.length;
          return (
            <span
              key={i}
              aria-hidden="true"
              className={cx(
                "flex items-center justify-center rounded-panel border-[1.5px] bg-bg-solid font-display text-[30px] font-bold text-ink",
                active ? "border-ink" : invalid ? "border-error" : "border-line-strong",
              )}
            >
              {digit}
            </span>
          );
        })}
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CELL_COUNT}
          value={value}
          onChange={(e) => onChange(digitsOnly(e.target.value).slice(0, CELL_COUNT))}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEnter();
          }}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className="absolute inset-0 h-full w-full cursor-text border-0 bg-transparent p-0 text-[18px] opacity-0"
        />
      </div>
    </div>
  );
}
