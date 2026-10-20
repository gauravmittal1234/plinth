// Lanes (API_CONTRACTS §1): every fact-bearing item is styled by where it comes
// from. Records sit on the neutral track; anything a developer or a news report
// says sits in the claim tone; our own estimates and opinions in the accent tone
// (DESIGN §0 tone fields). Never a border.
import type { Lane } from "@plinth/contracts";

export type Tone = "track" | "claim" | "accent";

const LANE_TONE: Readonly<Record<Lane, Tone>> = {
  records_show: "track",
  developer_says: "claim",
  from_developer: "claim",
  reported_unverified: "claim",
  our_estimate: "accent",
  buyer_upload: "track",
};

export function laneTone(lane: Lane): Tone {
  return LANE_TONE[lane] ?? "track";
}
