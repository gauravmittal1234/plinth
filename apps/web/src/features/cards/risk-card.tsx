// The risk share card (whatsapp.md "WaRisk"; T27 brief: 1080×1350). Every
// word on it is a field of RiskSummary — nothing here writes a band name, a
// frequency or a reason; it only lays the server's own strings out on a
// photo and a meter.
import type { BandCode, RiskSummary } from "@plinth/contracts";
import { ImageResponse } from "next/og";
import { bandTone, ink } from "./colors";
import { cardFonts } from "./fonts";
import { heroImageDataUrl } from "./hero-image";
import { Meter } from "./meter";
import { SignatureFooter } from "./signature-footer";

export const RISK_CARD_SIZE = { width: 1080, height: 1350 } as const;

/** RiskSummary.share.card_alt, unchanged (T27 accept: the card alt text equals this). */
export function riskCardAlt(risk: RiskSummary): string {
  return risk.share.card_alt;
}

function headlineColor(code: BandCode): string {
  // whatsapp.md §"What changed": "in band ink, or ink for Low and Moderate, per §3.2."
  return code === "low" || code === "moderate" ? ink.ink : bandTone(code).ink;
}

export async function renderRiskCard(
  risk: RiskSummary,
  heroImageUrl: string | null,
  heroImageCaption: string | null,
): Promise<ImageResponse> {
  const [fonts, heroDataUrl] = await Promise.all([
    cardFonts(),
    heroImageUrl ? heroImageDataUrl(heroImageUrl) : Promise.resolve(null),
  ]);
  const { phase, band, chip, confidence, frequency, share, meta } = risk;
  const headline = band ?? null;

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
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            width: "100%",
            height: 620,
            backgroundColor: heroDataUrl ? "transparent" : ink.photo,
          }}
        >
          {heroDataUrl ? (
            // next/image can't run inside an ImageResponse (Satori) render
            // tree, so a plain <img> is the only option here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroDataUrl}
              alt=""
              width={RISK_CARD_SIZE.width}
              height={620}
              style={{ objectFit: "cover" }}
            />
          ) : null}
          {heroDataUrl && heroImageCaption ? (
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: 0,
                right: 0,
                padding: "12px 20px",
                backgroundColor: ink.scrim,
              }}
            >
              <span style={{ fontSize: 13, color: ink.onInverse }}>{heroImageCaption}</span>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              left: 0,
              bottom: 0,
              width: "100%",
              padding: "20px 48px",
              backgroundColor: heroDataUrl ? ink.scrim : "transparent",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: heroDataUrl ? ink.onInverse : ink.ink }}>
              {phase.name}
            </span>
            <span style={{ fontSize: 13, color: heroDataUrl ? ink.onInverse : ink.muted }}>
              {phase.locality_line} · RERA {phase.rera_number}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: 48,
            gap: 24,
          }}
        >
          <span
            style={{
              fontFamily: "Bricolage Grotesque",
              fontWeight: 800,
              fontSize: 56,
              letterSpacing: -2,
              color: headline ? headlineColor(headline.code) : ink.ink2,
            }}
          >
            {chip.label}
          </span>
          {headline ? <Meter filled={chip.meter_filled} fill={bandTone(headline.code).ink} /> : null}
          {confidence ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: ink.muted }}>Delivery risk</span>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: i < confidence.dots ? ink.ink2 : "transparent",
                      border: `1px solid ${ink.ink2}`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 13, color: ink.muted }}>{confidence.level} confidence</span>
            </div>
          ) : null}
          {frequency ? <span style={{ fontSize: 15, color: ink.ink }}>{frequency.sentence}</span> : null}
        </div>

        <div style={{ display: "flex", padding: "0 48px 48px" }}>
          <SignatureFooter
            lines={[share.source_line, share.caption]}
            qrTarget={meta.short_url ?? meta.live_url}
            qrLabel="Live card"
          />
        </div>
      </div>
    ),
    { ...RISK_CARD_SIZE, fonts },
  );
}
