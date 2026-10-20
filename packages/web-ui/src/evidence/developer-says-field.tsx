// "Developer says" (DESIGN §0, §2, §4 item 9): a claim, never a record, so it
// sits in its own tone field (claim-bg) with a speech mark, not a dashed box.
// The label line is the contract's finished `line` ("Developer says · not yet
// verified · 15 Oct 2026 · we check it by 5 Nov 2026"); the words themselves
// are quoted with <q>, so the quote marks come from the language, not from us.
import type { DeveloperResponse, DeveloperSays } from "@plinth/contracts";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { SpeechIcon } from "../lib/icons";

export type DeveloperSaysFieldProps = {
  /** A pending fact's or evidence row's claim, or the developer's published response. */
  says: DeveloperSays | DeveloperResponse | null;
  /** compact: the label line only (beside a pending fact). full: line, signatory, quote, then children. */
  variant?: "compact" | "full";
  /** Padding: s inside sheets and beside a pending fact, l as a section's panel. Default by variant. */
  inset?: "s" | "l";
  /** Extra lines inside the field: a source chip, "Our status: under review since …". */
  children?: ReactNode;
  className?: string;
};

export function DeveloperSaysField({
  says,
  variant = "full",
  inset,
  children,
  className,
}: DeveloperSaysFieldProps) {
  if (!says) return null;
  const full = variant === "full";
  const roomy = (inset ?? (full ? "l" : "s")) === "l";
  const signatory = "signatory_title" in says ? says.signatory_title : null;
  return (
    <div
      data-lane="developer_says"
      className={cx(
        "flex flex-col gap-2.5 rounded-panel bg-claim-bg text-ink",
        roomy ? "px-6 py-5 sm:px-8 sm:py-7" : "px-4 py-3",
        className,
      )}
    >
      <p className="m-0 flex items-start gap-2 font-semibold text-ink2">
        <SpeechIcon className="mt-[0.3em] shrink-0" size={roomy ? 18 : 16} />
        <span>{says.line}</span>
      </p>
      {full && signatory ? <p className="m-0 text-small text-ink2">{signatory}</p> : null}
      {full ? (
        <p className="m-0">
          <q>{says.text}</q>
        </p>
      ) : null}
      {children}
    </div>
  );
}
