"use client";

// The one interactive part of the Stalled and Facts-only blocks: a source
// chip that opens the page's evidence drawer when its fact was prefetched
// (page/evidence-context.tsx). The blocks around it stay server-rendered,
// so their markup and copy never ship to the client (project-page JS
// budget, lighthouserc.cjs).
import type { SourceLike } from "@plinth/web-ui";
import { SourceChip } from "@plinth/web-ui";
import { useEvidence } from "../page/evidence-context";

export function EvidenceChip({
  factId,
  source,
  ariaLabel,
  fallback,
}: {
  factId: string | undefined;
  source: SourceLike;
  ariaLabel: string;
  /**
   * Without prefetched evidence: keep the source's own link ("link"), or
   * show the label as plain text ("text").
   */
  fallback: "link" | "text";
}) {
  const { has, open } = useEvidence();
  const available = factId !== undefined && has(factId);
  const keep = available || fallback === "link";
  return (
    <SourceChip
      source={keep ? source : { label: source.label, evidence_url: null }}
      onOpen={available ? () => open(factId) : undefined}
      ariaLabel={keep ? ariaLabel : undefined}
      surface="track"
    />
  );
}
