import type { Metadata } from "next";
import { displayFont, textFont } from "@/src/shell/fonts";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/src/shell/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Plinth", template: "%s · Plinth" },
  description:
    "Delivery risk, true cost and claims checks for homes in Gurugram, from public RERA records. No developer pays us. Ever.",
};

// Root layout (T05): fonts, Day by default with the Night toggle (data-theme),
// and the tokens CSS via globals.css. The site shell lives in the route-group
// layouts, so top-level routes (cards, /c, /j, /r, /capture) can choose their own.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      data-theme={DEFAULT_THEME}
      className={`${displayFont.variable} ${textFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies a saved Night choice before the first paint (no flash of Day). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
