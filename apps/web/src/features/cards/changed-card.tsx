// The "changed since this card was sent" card (whatsapp.md: "every card
// carries its issue date, and the QR resolves to... 'Since then: ...' If
// someone sends an old forwarded card back to the bot, it answers with what
// changed."). Every line is a field of ShareCard (api.share_card) or the
// RiskSummary of the same phase, read for its footer only.
import type { BandCode, RiskSummary, ShareCard } from "@plinth/contracts";
import { ImageResponse } from "next/og";
import { bandTone, ink } from "./colors";
import { cardFonts } from "./fonts";
import { Meter } from "./meter";
import { SignatureFooter } from "./signature-footer";

export const CHANGED_CARD_SIZE = { width: 1080, height: 1350 } as const;

function headlineColor(code: BandCode | null): string {
  if (!code) return ink.ink2;
  return code === "low" || code === "moderate" ? ink.ink : bandTone(code).ink;
}

export async function renderChangedCard(
  card: ShareCard,
  risk: RiskSummary,
): Promise<ImageResponse> {
  const fonts = await cardFonts();
  const { phase, now, headline_line, changes } = card;

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
          gap: 20,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: ink.ink }}>{phase.name}</span>

        {headline_line ? (
          <div
            style={{
              display: "flex",
              padding: "10px 16px",
              backgroundColor: ink.accentSoft,
              borderRadius: 6,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: ink.onAccentSoft }}>
              {headline_line}
            </span>
          </div>
        ) : null}

        <span
          style={{
            fontFamily: "Bricolage Grotesque",
            fontWeight: 800,
            fontSize: 56,
            letterSpacing: -2,
            color: headlineColor(now.band),
          }}
        >
          {now.chip?.label ?? phase.name}
        </span>
        {now.band ? <Meter filled={now.chip?.meter_filled ?? 0} fill={bandTone(now.band).ink} /> : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {now.lines.map((line, i) => (
            <span key={i} style={{ fontSize: 15, color: ink.ink }}>
              {line}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
          {changes.map((change) => (
            <div key={change.key} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, color: ink.muted }}>{change.label}</span>
              <span style={{ fontSize: 13, color: ink.ink2 }}>
                {change.before_line} → {change.after_line}
              </span>
            </div>
          ))}
        </div>

        <SignatureFooter
          lines={[risk.share.source_line, risk.share.caption]}
          qrTarget={now.card_url ?? card.live_url}
          qrLabel="Live card"
        />
      </div>
    ),
    { ...CHANGED_CARD_SIZE, fonts },
  );
}
