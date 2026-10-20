import type { Metadata } from "next";
import { Placeholder } from "@/src/shell/placeholder";

export const metadata: Metadata = { title: "Review queue · Plinth admin" };

export default function QueuePage() {
  return <Placeholder title="Review queue" milestone="M3" />;
}
