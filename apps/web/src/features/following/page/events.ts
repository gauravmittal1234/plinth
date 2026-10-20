// Shared timeline helpers for "Since you last looked" (F-93). `changes` (on
// or after the buyer's last look) and `record` (before it) are two windows
// onto the same dated history (API_CONTRACTS §4.8); the replay just moves
// where that history is cut, so every event the page can ever show is the
// union of both arrays, never recomposed — only re-sorted and re-split.
import type { BandCode, ChangeItem, Chip } from "@plinth/contracts";
import { BAND_CODES } from "@plinth/web-ui";

/** Every dated event on record, newest first (T43b: "the feed lists changes newest first"). */
export function allEvents(changes: readonly ChangeItem[], record: readonly ChangeItem[]): ChangeItem[] {
  return [...changes, ...record].sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1));
}

/** Events on or after `cursor` (an ISO date), newest first. */
export function eventsSince(events: readonly ChangeItem[], cursor: string): ChangeItem[] {
  return events.filter((e) => e.occurred_on >= cursor);
}

/** Events strictly before `cursor` (an ISO date), newest first. */
export function eventsBefore(events: readonly ChangeItem[], cursor: string): ChangeItem[] {
  return events.filter((e) => e.occurred_on < cursor);
}

/**
 * A band-change pill's text ("Moderate", "Elevated", …) is one of the five
 * band names, so it is re-drawn as a real risk chip (RiskChip) rather than
 * plain text ("Band words appear only as server chips"). Any other kind's
 * before/after pill (a date, a price, "Due 15 Oct") is never coerced.
 */
export function bandChipFromPill(pill: string | null | undefined): Chip | null {
  if (!pill) return null;
  const code = pill.trim().toLowerCase() as BandCode;
  const step = BAND_CODES.indexOf(code);
  if (step < 0) return null;
  return { kind: "band", label: pill, step: step + 1, meter_filled: step + 1 };
}

/** True for the one kind whose before/after pills are band names. */
export function isBandChange(event: Pick<ChangeItem, "kind">): boolean {
  return event.kind === "band_changed";
}
