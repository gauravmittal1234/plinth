// Readers for the fields the contract leaves open (`additionalProperties:
// true` on TrackRecord, TrackRecordProject, GroupComplaints, PreRera and
// DeveloperPageReply — developer_page.schema.json): the fixture world fills
// them in, but the generated type only promises `[k: string]: unknown`. Same
// pattern as WebProject's `textField` (records-section.tsx), generalised.
import type { SourceRef } from "@plinth/contracts";

type Open = Readonly<Record<string, unknown>>;

export function strField(obj: Open, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function numField(obj: Open, key: string): number | null {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Only present once the schema is tightened; empty array until then. */
export function sourceRefs(obj: Open, key: string): readonly SourceRef[] {
  const v = obj[key];
  return Array.isArray(v) ? (v as SourceRef[]) : [];
}
