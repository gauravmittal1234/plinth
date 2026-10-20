"use client";

// The one evidence drawer on the page (DESIGN §4 item 9, WebProject.dc.html):
// every source chip in Risk and Records opens the same drawer, so only one
// fact is ever open at a time. The page prefetches `api.evidence` for every
// fact id the fixtures can answer (page/evidence.ts) and hands the map down;
// a chip whose fact has no prefetched evidence falls back to a plain link via
// its own `evidence_url` instead of calling `open()` (see records-section.tsx).
import type { Evidence } from "@plinth/contracts";
import { EvidenceDrawer } from "@plinth/web-ui";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { EVIDENCE_LABELS } from "./copy";

type EvidenceContextValue = {
  /** True when `factId` was prefetched, so a chip can choose to call `open`. */
  has: (factId: string) => boolean;
  open: (factId: string) => void;
};

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

export function useEvidence(): EvidenceContextValue {
  const ctx = useContext(EvidenceContext);
  if (!ctx) throw new Error("useEvidence must be read inside <EvidenceProvider>.");
  return ctx;
}

export function EvidenceProvider({
  evidence,
  children,
}: {
  evidence: Readonly<Record<string, Evidence>>;
  children: ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const value = useMemo<EvidenceContextValue>(
    () => ({
      has: (factId) => Object.hasOwn(evidence, factId),
      open: (factId) => setOpenId(factId),
    }),
    [evidence],
  );
  const current = openId ? (evidence[openId] ?? null) : null;
  return (
    <EvidenceContext.Provider value={value}>
      {children}
      <EvidenceDrawer
        evidence={current}
        open={current !== null}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        labels={EVIDENCE_LABELS}
      />
    </EvidenceContext.Provider>
  );
}
