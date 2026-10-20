import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plinth admin",
  description: "Plinth operations: review queues, publishing gates, notices.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
