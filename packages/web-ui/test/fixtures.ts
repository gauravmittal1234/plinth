// The fixture world (DESIGN §5b, packages/fixtures/expected): the four phases
// T14's acceptance names. Aurelia (Elevated, low confidence, pending fact,
// developer response), Laurel (Severe by red-flag rule 1, no frequency),
// Juniper (Limited history) and Aurelia in facts-only mode (band withheld).
import type { Evidence, Methodology, ProjectPage, RiskSummary } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";

export const FIXTURE_KEYS = [
  "aurelia-heights-phase-2",
  "laurel-residency",
  "juniper-enclave",
  "aurelia-heights-phase-2--facts-only",
] as const;

export type FixtureKey = (typeof FIXTURE_KEYS)[number];

export type Fixture = {
  key: FixtureKey;
  risk: RiskSummary;
  page: ProjectPage;
};

export function fixture(key: FixtureKey): Fixture {
  return {
    key,
    risk: loadExpected<RiskSummary>("risk_summary", key),
    page: loadExpected<ProjectPage>("project_page", key),
  };
}

export const FIXTURES: readonly Fixture[] = FIXTURE_KEYS.map(fixture);

export const methodology = loadExpected<Methodology>("methodology", "default");

/** The five bands with their server names (Methodology.bands). */
export const BANDS = methodology.bands;

/** The evidence behind Aurelia's first reason (HARERA QPR · Apr–Jun 2026). */
export const QPR_EVIDENCE = loadExpected<Evidence>(
  "evidence",
  "196cb4f5-27eb-57a5-99f8-e5ab1b599c93",
);

/** Evidence for a fixture: the first reason's fact when there is an expected file, else Aurelia's QPR. */
export function evidenceFor(f: Fixture): Evidence {
  const id = f.risk.reasons[0]?.sources[0]?.fact_ids[0];
  try {
    if (id) return loadExpected<Evidence>("evidence", id);
  } catch {
    // Only Aurelia's four reason facts have expected evidence (T03).
  }
  return QPR_EVIDENCE;
}

/**
 * Layout copy the pages pass in, taken from WebProject.dc.html. Tests use the
 * artboard's words so what they check is what a buyer reads.
 */
export const COPY = {
  srDeliveryRisk: "Delivery risk: ",
  scaleLabel: "Delivery risk scale",
  legend: { late: "More than 12 months late", within: "Within 12 months" },
  closeEvidence: "Close evidence",
  lanes: {
    records_show: "Records show",
    developer_says: "Developer says · not yet verified",
    from_developer: "From the developer · not verified by Plinth",
    our_estimate: "Our estimate",
    reported_unverified: "Reported · not verified",
    buyer_upload: "Upload",
  },
  evidence: {
    document: "Document",
    page: "Page",
    snapshot: "Snapshot hash",
    read: "How we read it:",
    usedIn: "Used in:",
    newTab: "(opens in a new tab)",
  },
  earlier: "Earlier report",
  later: "Later report",
  allIn: "All-in",
  tags: {
    often_negotiable: "Often negotiable",
    set_by_law: "Set by law",
    refundable_deposit: "Refundable deposit",
  },
  links: [
    { label: "Report an error", href: "#report" },
    { label: "How we make money", href: "#money" },
  ],
} as const;
