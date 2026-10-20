// The weekly digest header (whatsapp.md "WaDigest"; T27 brief: 1080×570,
// "one floor per followed project"). fix-since-family.md decision 5: this
// image is a WhatsApp utility template, so it carries no promise line, no
// QR and no signature footer — only the heading the caller built from
// FollowingFeed and that payload's own `projects`.
//
// This renderer has no public /cards route yet: FollowingFeed is a buyer
// read (api.following_feed), so only a signed-in request can produce one.
// It is built and tested here for whoever wires the WhatsApp digest sender
// to import (T27 brief "Build" line; WORK_BREAKDOWN handoff on T46b).
import type { Chip } from "@plinth/contracts";
import { ImageResponse } from "next/og";
import { chipFloorTone } from "./chip-tone";
import { ink } from "./colors";
import { cardFonts } from "./fonts";

export const DIGEST_CARD_SIZE = { width: 1080, height: 570 } as const;

export type DigestProject = { slug: string; name: string; chip: Chip };

/**
 * @param headingLine Already composed by the caller from FollowingFeed
 *   (date range + a real count of `changes`), e.g. "This week in your
 *   projects · 12–18 Oct 2026 · 5 changes on record".
 */
export async function renderDigestHeaderCard(
  headingLine: string,
  projects: readonly DigestProject[],
): Promise<ImageResponse> {
  const fonts = await cardFonts();

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
          padding: 40,
          gap: 24,
        }}
      >
        <span
          style={{
            fontFamily: "Bricolage Grotesque",
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: -1,
            color: ink.ink,
          }}
        >
          {headingLine}
        </span>

        <div style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: 16 }}>
          {projects.map((project) => {
            const tone = chipFloorTone(project.chip);
            const heightPct = 20 + (project.chip.meter_filled / 5) * 80;
            return (
              <div
                key={project.slug}
                style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", justifyContent: "flex-end", gap: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    height: `${heightPct}%`,
                    backgroundColor: tone,
                    borderRadius: 4,
                  }}
                />
                <span style={{ fontSize: 13, color: ink.ink2, textAlign: "center" as const }}>
                  {project.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ),
    { ...DIGEST_CARD_SIZE, fonts },
  );
}
