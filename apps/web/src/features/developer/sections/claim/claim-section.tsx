// "Who answers for {name} here?" (Build: "the claim line (claimed / not yet
// claimed)"). The hero already shows `claim.line` up top; this section gives
// it the fuller explainer and, for a group that hasn't claimed, the one way
// to (DESIGN: claiming never changes a band).
import type { DeveloperGroup } from "@plinth/contracts";
import { Button, SectionBand } from "@plinth/web-ui";
import Link from "next/link";
import { CLAIM_COPY } from "../../page/copy";

export function ClaimSection({
  group,
  explainerLine,
}: {
  group: DeveloperGroup;
  explainerLine: string | null;
}) {
  const claimed = group.claim.state === "claimed";
  return (
    <SectionBand id="claim" tone="bg">
      <div className="flex flex-col gap-5">
        <h2 className="m-0 max-w-[20ch] text-balance font-display text-section font-bold">
          {CLAIM_COPY.heading(group.name)}
        </h2>
        <p className="m-0 max-w-measure text-lead">{group.claim.line}</p>
        <p className="m-0 max-w-measure text-body text-ink2">
          {explainerLine ?? CLAIM_COPY.explainerFallback}
        </p>
        {!claimed ? (
          <Button variant="secondary" size="lg" asChild className="self-start">
            <Link href={`/workspace/claim?slug=${group.slug}`}>{CLAIM_COPY.cta(group.name)}</Link>
          </Button>
        ) : null}
      </div>
    </SectionBand>
  );
}
