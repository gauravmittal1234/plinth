import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plinth",
  description:
    "Delivery risk, true cost and claims checks for homes in Gurugram, from public RERA records. No developer pays us. Ever.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
