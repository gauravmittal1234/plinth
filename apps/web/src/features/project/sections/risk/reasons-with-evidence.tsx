"use client";

// Wires the 4 ranked reasons to the page's one evidence drawer (page/evidence-context.tsx).
// A source whose fact the fixtures don't carry yet (packages/fixtures/expected/evidence
// only has Aurelia's 4) still shows its chip; tapping it simply has nowhere to
// open, same as any other fixture-coverage gap in this build.
import type { Reason, SourceRef } from "@plinth/contracts";
import { ReasonList } from "@plinth/web-ui";
import { useEvidence } from "../../page/evidence-context";

export function ReasonsWithEvidence({ reasons }: { reasons: readonly Reason[] }) {
  const { has, open } = useEvidence();
  return (
    <ReasonList
      reasons={reasons}
      onOpenSource={(source: SourceRef) => {
        const id = source.fact_ids[0];
        if (id && has(id)) open(id);
      }}
      sourceLabel={(source) => `Source: ${source.label}. Open evidence.`}
    />
  );
}
