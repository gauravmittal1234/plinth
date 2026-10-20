import type { Metadata } from "next";
import { Placeholder } from "@/src/shell/placeholder";

export const metadata: Metadata = { title: "WhatsApp inbox · Plinth admin" };

export default function InboxPage() {
  return <Placeholder title="WhatsApp inbox" milestone="M4" />;
}
