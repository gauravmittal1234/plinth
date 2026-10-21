"use client";

// The three zero-results states (G-30, G-39): "no_match" always gets a
// one-tap fix, never a silent widening; "unknown_project" offers Request it;
// "outside_coverage" offers the Noida waitlist. Every word is
// SearchResults.zero_results, read as-is; nothing here is composed from a
// number or a band.
import Link from "next/link";
import { useState } from "react";
import { Button } from "@plinth/web-ui";
import { NoidaWaitlist } from "./noida-waitlist";
import { RequestProjectForm } from "./request-project-form";
import type { HiddenProject, ZeroResultsPayload } from "./types";

export type ZeroResultsPanelProps = {
  zeroResults: ZeroResultsPayload;
  name: string | null;
  hidden: readonly HiddenProject[];
};

export function ZeroResultsPanel({ zeroResults, name, hidden }: ZeroResultsPanelProps) {
  const [revealed, setRevealed] = useState(false);
  const action = zeroResults.action;

  return (
    <div className="flex flex-col items-start gap-4 rounded-panel bg-track p-6 sm:p-8">
      <h1 className="m-0 max-w-measure font-display text-h2 font-bold">{zeroResults.line}</h1>

      {zeroResults.kind === "no_match" && action?.kind === "drop_filter" ? (
        <>
          <Button onClick={() => setRevealed(true)} aria-expanded={revealed}>
            {action.label}
          </Button>
          {revealed && zeroResults.detail_line ? (
            <div className="flex flex-col items-start gap-2">
              <p className="m-0 max-w-measure text-body">{zeroResults.detail_line}</p>
              {action.brings_back?.[0] ? (
                <Link
                  href={`/gurugram/projects/${action.brings_back[0]}`}
                  className="text-body font-semibold text-ink underline underline-offset-2"
                >
                  {projectNameFromHidden(hidden, action.brings_back[0]) ?? "See the project"}
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {zeroResults.kind === "unknown_project" ? (
        <>
          {zeroResults.detail_line ? (
            <p className="m-0 max-w-measure text-body text-ink2">{zeroResults.detail_line}</p>
          ) : null}
          <RequestProjectForm name={name ?? ""} />
        </>
      ) : null}

      {zeroResults.kind === "outside_coverage" && action?.kind === "waitlist" ? (
        <NoidaWaitlist detailLine={zeroResults.detail_line ?? ""} />
      ) : null}
    </div>
  );
}

function projectNameFromHidden(hidden: readonly HiddenProject[], slug: string): string | null {
  return hidden.find((h) => h.slug === slug)?.name ?? null;
}
