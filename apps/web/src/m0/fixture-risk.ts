// M0 gate stand-in (T07): the one fixture read the M0 exit needs, the
// expected RiskSummary of a seeded phase (packages/fixtures/expected, T03).
// Bundled at build time, so fixture mode needs no file access at runtime.
// T16's data layer (src/data, `riskSummary(slug)`) replaces this file.
import "server-only";
import type { RiskSummary } from "@plinth/contracts";
import aurelia from "@plinth/fixtures/expected/risk_summary/aurelia-heights-phase-2.json";
import cedarWalk from "@plinth/fixtures/expected/risk_summary/cedar-walk-phase-2.json";
import coral from "@plinth/fixtures/expected/risk_summary/coral-towers.json";
import heronPoint from "@plinth/fixtures/expected/risk_summary/heron-point-phase-2.json";
import juniper from "@plinth/fixtures/expected/risk_summary/juniper-enclave.json";
import kestrel from "@plinth/fixtures/expected/risk_summary/kestrel-park.json";
import laurel from "@plinth/fixtures/expected/risk_summary/laurel-residency.json";
import sapphire from "@plinth/fixtures/expected/risk_summary/sapphire-grove-phase-1.json";
import { dataMode } from "@/src/data/mode";

const EXPECTED: Readonly<Record<string, unknown>> = {
  "aurelia-heights-phase-2": aurelia,
  "kestrel-park": kestrel,
  "sapphire-grove-phase-1": sapphire,
  "coral-towers": coral,
  "laurel-residency": laurel,
  "juniper-enclave": juniper,
  "heron-point-phase-2": heronPoint,
  "cedar-walk-phase-2": cedarWalk,
};

/** The slugs with a fixture RiskSummary: the 8 seeded phases (DESIGN §5b). */
export const FIXTURE_RISK_SLUGS = Object.keys(EXPECTED);

/**
 * The expected RiskSummary of `slug` in fixture mode; null for any other slug,
 * and always null with PLINTH_DATA=supabase (T16 wires api.risk_summary).
 */
export function fixtureRiskSummary(slug: string): RiskSummary | null {
  if (dataMode() !== "fixtures" || !Object.hasOwn(EXPECTED, slug)) return null;
  return EXPECTED[slug] as RiskSummary;
}
