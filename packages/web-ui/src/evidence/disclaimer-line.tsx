// The disclaimer (DESIGN §4 item 10): "Our opinion, based on public records.
// Not a credit rating. Not issued by any RERA." at 15 px or more, always shown,
// never collapsed, with its links. The sentence is `meta.disclaimer_line`.
import type { RiskMeta } from "@plinth/contracts";
import type { ReactNode } from "react";
import { cx } from "../lib/cx";

export type DisclaimerLineProps = {
  meta: Pick<RiskMeta, "disclaimer_line">;
  /** Follows the sentence, e.g. "Data as of 14 Oct 2026 · model v1.2." */
  trailing?: ReactNode;
  /** "Report an error", "How we make money": named for what they open (artboard copy). */
  links?: ReadonlyArray<{ label: string; href: string }>;
  className?: string;
};

export function DisclaimerLine({ meta, trailing, links, className }: DisclaimerLineProps) {
  return (
    <p data-disclaimer="" className={cx("m-0 text-small text-ink2", className)}>
      {meta.disclaimer_line}
      {trailing ? <> {trailing}</> : null}
      {links?.length
        ? links.map((l, i) => (
            <span key={l.href}>
              {i === 0 ? " " : " · "}
              <a href={l.href} className="text-ink underline underline-offset-[0.2em]">
                {l.label}
              </a>
            </span>
          ))
        : null}
    </p>
  );
}
