// The two families (DESIGN §3.3), self-hosted by next/font at build time: no
// request to Google from a reader's browser. globals.css points the token font
// variables (--pl-font-family-display / -text) at these.
import { Bricolage_Grotesque, Mukta } from "next/font/google";

/** Display: Bricolage Grotesque, variable weight with the optical-size axis. */
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-plinth-display",
});

/** Text and UI: Mukta 400 / 500 / 600 / 700. */
export const textFont = Mukta({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plinth-text",
});
