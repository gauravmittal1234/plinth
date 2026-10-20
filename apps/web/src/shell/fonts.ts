// The two families (DESIGN §3.3), self-hosted by next/font at build time: no
// request to Google from a reader's browser. globals.css points the token font
// variables (--pl-font-family-display / -text) at these.
import { Bricolage_Grotesque, Mukta } from "next/font/google";

// Display: every `font-display` usage in the codebase pairs it with
// `font-extrabold` (grep confirms no other weight is ever rendered; the
// mobile app bundles the same family as a single static weight-800 instance
// for the same reason, per apps/mobile/assets/fonts/README.md). Loading it
// as the default "variable" weight plus the `opsz` axis (DESIGN §3.3's
// Google Fonts link) ships the whole wght 200..800 x opsz 12..96 variable
// font — bytes no page ever uses. next/font only allows `axes` when the
// weight is "variable" (apps/web/node_modules/next's
// get-font-axes/validate-google-font-function-call), so pinning the weight
// to "800" both drops the unused range and removes the opsz axis in one
// step, without changing how any heading renders (M1 perf gate, T32 brief).
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "800",
  display: "swap",
  variable: "--font-plinth-display",
});

// Text and UI: Mukta 400 / 500 / 600 / 700 — all four are genuinely used
// site-wide (400 body text, 500 nav links in site-header, 600 `font-semibold`
// in most web-ui components, 700 `font-bold`), including on every page via
// the shared shell, so none can be dropped or deferred without a visible or
// behavioural change.
export const textFont = Mukta({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plinth-text",
});
