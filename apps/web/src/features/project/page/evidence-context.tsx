"use client";

// The one evidence drawer on the page (DESIGN §4 item 9, WebProject.dc.html):
// every source chip in Risk and Records opens the same drawer, so only one
// fact is ever open at a time. The page prefetches `api.evidence` for every
// fact id the fixtures can answer (page/evidence.ts) and hands the map down;
// a chip whose fact has no prefetched evidence falls back to a plain link via
// its own `evidence_url` instead of calling `open()` (see records-section.tsx).
//
// `EvidenceDrawer` (and the Radix Dialog it's built on, via @plinth/web-ui's
// Sheet) is loaded with a plain `import()` inside `open()`, not
// `next/dynamic`: a `next/dynamic()` call is registered in the route's
// client-reference manifest at build time, and this app's Partial
// Prefetching (next.config.ts `partialPrefetching`, PPR) prefetches every
// chunk reachable from the current route at low priority regardless of
// whether it is ever actually mounted — confirmed by measuring the chunk's
// `network-requests` entry on a page load that never opens the drawer (it
// still arrived, ~12 ms in, priority "Low"). A bare `import()` called only
// from inside the click handler isn't tied to the route that way (same
// pattern as the "Loading External Libraries" example in
// node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md), so it is
// genuinely fetched on the first source-chip click and never before
// (M1 perf gate, BUILD_PLAN §7).
import type { Evidence } from "@plinth/contracts";
import type { EvidenceDrawerProps } from "@plinth/web-ui";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
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
  const [Drawer, setDrawer] = useState<ComponentType<EvidenceDrawerProps> | null>(null);
  const value = useMemo<EvidenceContextValue>(
    () => ({
      has: (factId) => Object.hasOwn(evidence, factId),
      open: (factId) => {
        setOpenId(factId);
        if (!Drawer) {
          import("@plinth/web-ui").then((m) => setDrawer(() => m.EvidenceDrawer));
        }
      },
    }),
    [evidence, Drawer],
  );
  const current = openId ? (evidence[openId] ?? null) : null;
  return (
    <EvidenceContext.Provider value={value}>
      {children}
      {Drawer && current !== null ? (
        <Drawer
          evidence={current}
          open={true}
          onOpenChange={(open) => {
            if (!open) setOpenId(null);
          }}
          labels={EVIDENCE_LABELS}
        />
      ) : null}
    </EvidenceContext.Provider>
  );
}
