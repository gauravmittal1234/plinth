// The two families (benchmark-thapki.md; FOUNDER_QUESTIONS P10), self-hosted by
// next/font at build time: no request to Google from a reader's browser.
// globals.css points the token font variables (--pl-font-family-display / -text)
// at these. UI v2: Figtree replaces Mukta for all text, buttons and labels;
// Bricolage Grotesque drops from 800 to 700 and stays reserved for `display`,
// `h1`, `h2` and the new `section` role (packages/tokens/tokens.json). Mukta
// is retired — no Mukta import or font file remains in the web app.
import { Bricolage_Grotesque, Figtree } from "next/font/google";

// Display: every `font-display` usage in the codebase now pairs it with
// `font-bold` (grep confirms no other weight is ever rendered; the mobile app
// bundles the same family as a single static weight-700 instance for the same
// reason, per apps/mobile/assets/fonts/README.md). Loading it as the default
// "variable" weight plus the `opsz` axis (DESIGN §3.3's old Google Fonts link)
// would ship the whole wght 200..800 x opsz 12..96 variable font — bytes no
// page ever uses. next/font only allows `axes` when the weight is "variable"
// (apps/web/node_modules/next's get-font-axes/validate-google-font-function-call),
// so pinning the weight to "700" both drops the unused range and removes the
// opsz axis in one step. It is not always the page's LCP candidate (the
// project and search pages' first paint is often a photo or Figtree body
// text), so it does not need a <link rel="preload">.
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "700",
  display: "swap",
  preload: false,
  variable: "--font-plinth-display",
});

// Text and UI: Figtree, variable (ships one file covering every weight the UI
// renders — 400 body, 500 nav links, 600 `font-semibold`, 700 `font-bold` —
// instead of four separate static instances), latin subset only. It renders
// on every page via the shared shell and is almost always part of the page's
// LCP text (the search field, a heading's running copy, a risk line), so it
// keeps next/font's default preload. Noto Sans (packages/tokens
// font.family.ui) is the Devanagari fallback in the stack, not bundled here.
export const textFont = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plinth-text",
});
