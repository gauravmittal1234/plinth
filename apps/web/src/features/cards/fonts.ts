// Embedded fonts for the share cards (T27 brief: "Embedded fonts"; whatsapp.md
// "every image Plinth sends" must carry its own proof, including its type —
// a forwarded PNG can't lean on the page's self-hosted next/font setup).
//
// next/og's ImageResponse (Satori) needs real font bytes, not a CSS
// @font-face: it never loads apps/web/src/shell/fonts.ts's Google-fetched
// files. These are the same two families (DESIGN §3.3), read once from disk
// and reused for every render.
//
// BricolageGrotesque-Display.ttf is a static derivative of the brand's
// variable font (assets/fonts/strip-variable-tables.mjs has the full story:
// next/og's bundled font parser can't parse that file's fvar table). It is
// registered at both weights the cards use so Satori matches either.
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const DIR = join(process.cwd(), "src/features/cards/assets/fonts");

// next/og re-exports only the ImageResponse class, not its options type
// (next/dist/compiled/@vercel/og keeps that internal), so the font entry
// shape is derived from the constructor instead of named directly.
type OgOptions = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>;
type OgFont = NonNullable<OgOptions["fonts"]>[number];

let cached: Promise<OgFont[]> | null = null;

/** The card fonts, loaded once per server process. */
export function cardFonts(): Promise<OgFont[]> {
  if (!cached) cached = load();
  return cached;
}

async function load(): Promise<OgFont[]> {
  const [display, textRegular, textSemibold, textBold] = await Promise.all([
    readFile(join(DIR, "BricolageGrotesque-Display.ttf")),
    readFile(join(DIR, "Mukta-Regular.ttf")),
    readFile(join(DIR, "Mukta-SemiBold.ttf")),
    readFile(join(DIR, "Mukta-Bold.ttf")),
  ]);
  return [
    { name: "Bricolage Grotesque", data: display, weight: 700, style: "normal" },
    { name: "Bricolage Grotesque", data: display, weight: 800, style: "normal" },
    { name: "Mukta", data: textRegular, weight: 400, style: "normal" },
    { name: "Mukta", data: textSemibold, weight: 600, style: "normal" },
    { name: "Mukta", data: textBold, weight: 700, style: "normal" },
  ];
}
