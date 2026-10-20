// The cost share card (whatsapp.md "WaCost"; T27 brief: 1080×1350). Every
// amount and label is a field of ProjectPage.cost (plinth.cost_breakdown/1)
// or .meta — this file only lays the waterfall out, it never prices
// anything itself.
import type { CostBreakdown, PhaseSummary, RiskMeta } from "@plinth/contracts";
import { ImageResponse } from "next/og";
import { ink } from "./colors";
import { cardFonts } from "./fonts";
import { SignatureFooter } from "./signature-footer";

export const COST_CARD_SIZE = { width: 1080, height: 1350 } as const;

export async function renderCostCard(
  phase: PhaseSummary,
  cost: CostBreakdown,
  meta: RiskMeta,
): Promise<ImageResponse> {
  const fonts = await cardFonts();
  const max = cost.all_in_inr;
  const steps = stepsOf(cost, max);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: ink.bg,
          fontFamily: "Mukta",
          padding: 48,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: ink.ink }}>{phase.name}</span>
          <span style={{ fontSize: 13, color: ink.muted }}>{cost.basis_line}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 24 }}>
          <span
            style={{
              // Mukta, not Bricolage Grotesque: the stripped display face
              // (fonts.ts) has no ₹ glyph and silently substitutes one that
              // doesn't share its baseline, so "₹2.74 Cr" render garbled.
              fontFamily: "Mukta",
              fontWeight: 700,
              fontSize: 56,
              letterSpacing: -1,
              color: ink.ink,
            }}
          >
            {cost.all_in_label}
          </span>

          <div style={{ display: "flex", flexDirection: "column-reverse", gap: 10, width: "100%" }}>
            {steps.map((step) => (
              <div key={step.code} style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
                <span style={{ width: 380, flexShrink: 0, fontSize: 13, color: ink.ink2 }}>
                  {step.label} · {step.amountLabel}
                </span>
                <div style={{ display: "flex", flex: 1, height: 28, backgroundColor: ink.track }}>
                  <div
                    style={{
                      display: "flex",
                      height: "100%",
                      width: `${Math.max(step.widthPct, 4)}%`,
                      backgroundColor: ink.accentSoft,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {cost.vs_quoted_line ? (
            <span style={{ fontSize: 13, color: ink.muted }}>{cost.vs_quoted_line}</span>
          ) : null}
          {cost.negotiable_line ? (
            <span style={{ fontSize: 13, color: ink.muted }}>{cost.negotiable_line}</span>
          ) : null}
        </div>

        <SignatureFooter
          lines={[meta.promise_line, meta.disclaimer_line]}
          qrTarget={meta.short_url ?? meta.live_url}
          qrLabel="Live costs"
        />
      </div>
    ),
    { ...COST_CARD_SIZE, fonts },
  );
}

type Step = { code: string; label: string; amountLabel: string; widthPct: number };

/** Cumulative width of each cost line against the all-in total, bottom-to-top. */
function stepsOf(cost: CostBreakdown, allInInr: number): Step[] {
  let running = 0;
  return cost.lines.map((line) => {
    running += line.amount_inr;
    return {
      code: line.code,
      label: line.label,
      amountLabel: line.amount_label,
      widthPct: allInInr > 0 ? (running / allInInr) * 100 : 0,
    };
  });
}
