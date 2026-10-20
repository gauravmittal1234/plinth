// Canonical fixtures, part 1: catalogue and evidence (DESIGN.md §5/§5b as data).
// Every record carries `source`. "R2" = DESIGN §5b "Fixture decisions, round 2" (answers to CONFLICTS.md).
import {
  addDays,
  addMonths,
  qprDue,
  quarterEndMonth,
  quartersRange,
  sha256,
  timeUsedPct,
  uuid5,
} from "./lib.mjs";

export const S5 = "DESIGN §5";
export const S5B = "DESIGN §5b";
export const S5B_ENG = "DESIGN §5b · Engineering fixture decisions (19 Oct 2026)";
export const S5B_SWEEP = "DESIGN §5b · Final sweep rulings (19 Oct 2026)";
export const R2 = (c) => `DESIGN §5b · Fixture decisions, round 2 (${c})`;
export const R3 = (c) => `DESIGN §5b · Fixture decisions, round 3 (${c})`;
export const ART_EVIDENCE = "artboards AppRisk/WebProject (evidence copy, a T03 input)";
export const derived = (rule) => `derived: ${rule}`;
export const proposed = (id) => `CONFLICTS.md ${id} (proposed; not yet in DESIGN §5b)`;

const id = (kind, key) => uuid5(kind, key);
export const IST = (date, time = "00:00:00") => `${date}T${time}+05:30`;
const AH2 = "aurelia-heights-phase-2";
const CW2 = "cedar-walk-phase-2";

// ---------------------------------------------------------------- catalogue
export function buildCatalogue() {
  // Sector pins (R2 C-20): approximate positions, fictional projects at real sector locations.
  const PIN = {
    "sector-37d": [28.437, 76.985],
    "sector-89": [28.418, 76.946],
    "sector-92": [28.415, 76.928],
    "sector-99": [28.479, 76.983],
    "sector-102": [28.49, 76.996],
    "sector-104": [28.5, 77.006],
    "sector-106": [28.507, 77.014],
    "sector-113": [28.527, 77.034],
  };
  const localities = [
    { key: "gurugram", kind: "city", name: "Gurugram", parent: null, source: S5B },
    {
      key: "dwarka-expressway",
      kind: "corridor",
      name: "Dwarka Expressway",
      parent: "gurugram",
      source: S5,
    },
    { key: "new-gurugram", kind: "corridor", name: "New Gurugram", parent: "gurugram", source: S5 },
    {
      key: "golf-course-extension-road",
      kind: "corridor",
      name: "Golf Course Extension Road",
      parent: "gurugram",
      coverage: "planned",
      coverage_line: "Planned for Dec 2026",
      source: S5B,
    },
    {
      key: "sector-37d",
      kind: "sector",
      name: "Sector 37D",
      parent: "dwarka-expressway",
      source: S5,
    },
    {
      key: "sector-99",
      kind: "sector",
      name: "Sector 99",
      parent: "dwarka-expressway",
      source: R2("C-05"),
    },
    {
      key: "sector-102",
      kind: "sector",
      name: "Sector 102",
      parent: "dwarka-expressway",
      source: S5,
    },
    {
      key: "sector-104",
      kind: "sector",
      name: "Sector 104",
      parent: "dwarka-expressway",
      source: S5B,
    },
    {
      key: "sector-106",
      kind: "sector",
      name: "Sector 106",
      parent: "dwarka-expressway",
      source: S5,
    },
    {
      key: "sector-113",
      kind: "sector",
      name: "Sector 113",
      parent: "dwarka-expressway",
      source: S5,
    },
    { key: "sector-89", kind: "sector", name: "Sector 89", parent: "new-gurugram", source: S5 },
    { key: "sector-92", kind: "sector", name: "Sector 92", parent: "new-gurugram", source: S5 },
  ].map((l) => ({
    id: id("locality", l.key),
    slug: l.key,
    kind: l.kind,
    name: l.name,
    parent: l.parent,
    coverage: l.coverage ?? "covered",
    coverage_line: l.coverage_line ?? null,
    pin: PIN[l.key] ? { lat: PIN[l.key][0], lng: PIN[l.key][1] } : null,
    geom: null,
    source: PIN[l.key] ? `${l.source}; pin ${R2("C-20")}` : l.source,
  }));

  const claims = R2("C-07, C-08");
  const developer_groups = [
    {
      slug: "northfield-estates",
      name: "Northfield Estates",
      claim_state: "claimed",
      invited_on: "2025-11-24",
      claimed_on: "2025-12-02",
      linked_companies: 9,
      finished_projects: 6,
      finished_late12: 2,
      source: S5B,
    },
    {
      slug: "orbis-land",
      name: "Orbis Land",
      claim_state: "claimed",
      invited_on: "2025-11-24",
      claimed_on: "2025-12-03",
      linked_companies: null,
      finished_projects: 9,
      finished_late12: 1,
      source: `${S5}; ${claims}`,
    },
    {
      slug: "meridian-habitat",
      name: "Meridian Habitat",
      claim_state: "claimed",
      invited_on: "2025-11-24",
      claimed_on: "2025-12-05",
      linked_companies: null,
      finished_projects: 11,
      finished_late12: 2,
      source: `${S5}; ${claims}`,
    },
    {
      slug: "vantage-buildcon",
      name: "Vantage Buildcon",
      claim_state: "invited",
      invited_on: "2025-11-24",
      claimed_on: null,
      linked_companies: null,
      finished_projects: null,
      finished_late12: null,
      source: S5B,
    },
    {
      slug: "elmstone-developers",
      name: "Elmstone Developers",
      claim_state: "invited",
      invited_on: "2025-11-24",
      claimed_on: null,
      linked_companies: null,
      finished_projects: null,
      finished_late12: null,
      source: S5B,
    },
    {
      slug: "halcyon-homes",
      name: "Halcyon Homes",
      claim_state: "claimed",
      invited_on: "2025-11-24",
      claimed_on: "2025-12-09",
      linked_companies: null,
      finished_projects: 0,
      finished_late12: 0,
      source: `${S5} ("new developer"); ${claims}`,
    },
    {
      slug: "ashgrove-realty",
      name: "Ashgrove Realty",
      claim_state: "invited",
      invited_on: "2026-10-16",
      claimed_on: null,
      linked_companies: null,
      finished_projects: null,
      finished_late12: null,
      source: S5B,
    },
  ].map((g) => ({
    id: id("developer_group", g.slug),
    ...g,
    facts_only_since: null,
    facts_only_line: null,
  }));

  const developers = [
    {
      key: "northfield-estates-pvt-ltd",
      group: "northfield-estates",
      legal_name: "Northfield Estates Pvt Ltd",
      status: "active",
      source: `${S5B}; ${R2("C-27")} (group parent, promoter of Aurelia Heights Ph 2)`,
    },
    {
      key: "heronstone-projects",
      group: "northfield-estates",
      legal_name: "Heronstone Projects",
      status: "active",
      source: S5B,
    },
    {
      key: "cedarline-developers",
      group: "northfield-estates",
      legal_name: "Cedarline Developers",
      status: "active",
      source: R2("C-05, C-27"),
    },
    {
      key: "northfield-buildtech",
      group: "northfield-estates",
      legal_name: "Northfield Buildtech",
      status: "active",
      source: R2("C-27"),
    },
    {
      key: "opaline-realtors-llp",
      group: "northfield-estates",
      legal_name: "Opaline Realtors LLP",
      status: "active",
      source: R2("C-27"),
    },
    {
      key: "orbis-land",
      group: "orbis-land",
      legal_name: "Orbis Land",
      status: "active",
      source: S5,
    },
    {
      key: "meridian-habitat",
      group: "meridian-habitat",
      legal_name: "Meridian Habitat",
      status: "active",
      source: S5,
    },
    {
      key: "vantage-buildcon",
      group: "vantage-buildcon",
      legal_name: "Vantage Buildcon",
      status: "active",
      source: S5,
    },
    {
      key: "elmstone-developers",
      group: "elmstone-developers",
      legal_name: "Elmstone Developers",
      status: "active",
      source: S5,
    },
    {
      key: "elmstone-infra-projects",
      group: "elmstone-developers",
      legal_name: "Elmstone Infra Projects Pvt Ltd",
      status: "cirp",
      source: `${S5B}; name ${R2("C-09")}`,
    },
    {
      key: "halcyon-homes",
      group: "halcyon-homes",
      legal_name: "Halcyon Homes",
      status: "active",
      source: S5,
    },
    {
      key: "ashgrove-realty",
      group: "ashgrove-realty",
      legal_name: "Ashgrove Realty",
      status: "active",
      source: S5B,
    },
  ].map((d) => ({
    id: id("developer", d.key),
    key: d.key,
    group: d.group,
    legal_name: d.legal_name,
    cin: null,
    llpin: null,
    kind: d.legal_name.endsWith("LLP") ? "llp" : "company",
    status: d.status,
    source: d.source,
  }));

  const projects = [
    ["aurelia-heights", "Aurelia Heights", "northfield-estates", "sector-37d", S5],
    ["kestrel-park", "Kestrel Park", "orbis-land", "sector-113", S5],
    ["sapphire-grove", "Sapphire Grove", "meridian-habitat", "sector-106", S5],
    ["coral-towers", "Coral Towers", "vantage-buildcon", "sector-89", S5],
    ["laurel-residency", "Laurel Residency", "elmstone-developers", "sector-92", S5],
    ["juniper-enclave", "Juniper Enclave", "halcyon-homes", "sector-102", S5],
    ["heron-point", "Heron Point", "northfield-estates", "sector-104", S5B],
    ["cedar-walk", "Cedar Walk", "northfield-estates", "sector-99", `${S5}; sector ${R2("C-05")}`],
    ["wren-court", "Wren Court", "northfield-estates", null, S5],
    ["opaline-residences", "Opaline Residences", "northfield-estates", null, S5],
    ["linden-square", "Linden Square", "northfield-estates", null, S5],
  ].map(([slug, name, group, locality, source]) => ({
    id: id("project", slug),
    slug,
    name,
    group,
    locality,
    footprint: null,
    centroid: locality && PIN[locality] ? { lat: PIN[locality][0], lng: PIN[locality][1] } : null,
    source: locality && PIN[locality] ? `${source}; centroid = sector pin ${R2("C-20")}` : source,
  }));

  // The 8 seeded phases (the unit of a page, a score and a follow) + Northfield's 6 finished phases.
  const C27 = R2("C-27");
  const phases = [
    {
      slug: AH2,
      project: "aurelia-heights",
      name: "Aurelia Heights, Phase 2",
      short_name: "Aurelia Heights Ph 2",
      promoter: "northfield-estates-pvt-ltd",
      units_total: 500,
      status: "under_construction",
      short_code: "AH2",
      corridor: "dwarka-expressway",
      source: S5B,
    },
    {
      slug: "kestrel-park",
      project: "kestrel-park",
      name: "Kestrel Park",
      short_name: "Kestrel Park",
      promoter: "orbis-land",
      units_total: 420,
      status: "under_construction",
      corridor: "dwarka-expressway",
      source: S5B,
    },
    {
      slug: "sapphire-grove-phase-1",
      project: "sapphire-grove",
      name: "Sapphire Grove, Phase 1",
      short_name: "Sapphire Grove Ph 1",
      promoter: "meridian-habitat",
      units_total: 360,
      status: "under_construction",
      corridor: "dwarka-expressway",
      source: S5B,
    },
    {
      slug: "coral-towers",
      project: "coral-towers",
      name: "Coral Towers",
      short_name: "Coral Towers",
      promoter: "vantage-buildcon",
      units_total: 640,
      status: "under_construction",
      corridor: "new-gurugram",
      source: S5B,
    },
    {
      slug: "laurel-residency",
      project: "laurel-residency",
      name: "Laurel Residency",
      short_name: "Laurel Residency",
      promoter: "elmstone-developers",
      units_total: null,
      status: "stalled",
      corridor: "new-gurugram",
      source: S5B,
    },
    {
      slug: "juniper-enclave",
      project: "juniper-enclave",
      name: "Juniper Enclave",
      short_name: "Juniper Enclave",
      promoter: "halcyon-homes",
      units_total: 280,
      status: "under_construction",
      corridor: "dwarka-expressway",
      source: S5B,
    },
    {
      slug: "heron-point-phase-2",
      project: "heron-point",
      name: "Heron Point, Phase 2",
      short_name: "Heron Point Ph 2",
      promoter: "heronstone-projects",
      units_total: null,
      status: "registered",
      corridor: "dwarka-expressway",
      source: S5B,
    },
    {
      slug: CW2,
      project: "cedar-walk",
      name: "Cedar Walk, Phase 2",
      short_name: "Cedar Walk Ph 2",
      promoter: "cedarline-developers",
      units_total: 320,
      status: "under_construction",
      corridor: "dwarka-expressway",
      source: `${S5}; ${R2("C-05")}`,
    },
    // Northfield's finished phases (track record), R2 C-27.
    {
      slug: "cedar-walk",
      project: "cedar-walk",
      name: "Cedar Walk",
      short_name: "Cedar Walk Ph 1",
      promoter: "cedarline-developers",
      status: "completed",
      finished_late12: false,
      source: `${S5}; ${C27}`,
    },
    {
      slug: "aurelia-heights-phase-1",
      project: "aurelia-heights",
      name: "Aurelia Heights, Phase 1",
      short_name: "Aurelia Heights Ph 1",
      promoter: "northfield-buildtech",
      status: "completed",
      finished_late12: true,
      source: `${S5}; ${C27}`,
    },
    {
      slug: "wren-court",
      project: "wren-court",
      name: "Wren Court",
      short_name: "Wren Court",
      promoter: null,
      status: "completed",
      finished_late12: false,
      source: `${S5}; ${C27}`,
    },
    {
      slug: "opaline-residences",
      project: "opaline-residences",
      name: "Opaline Residences",
      short_name: "Opaline Residences",
      promoter: "opaline-realtors-llp",
      status: "completed",
      finished_late12: false,
      source: `${S5}; ${C27}`,
    },
    {
      slug: "heron-point-phase-1",
      project: "heron-point",
      name: "Heron Point, Phase 1",
      short_name: "Heron Point Ph 1",
      promoter: "heronstone-projects",
      status: "completed",
      finished_late12: true,
      source: `${S5}; ${C27}`,
    },
    {
      slug: "linden-square",
      project: "linden-square",
      name: "Linden Square",
      short_name: "Linden Square",
      promoter: null,
      status: "completed",
      finished_late12: false,
      source: `${S5}; ${C27}`,
    },
  ].map((p) => ({
    id: id("phase", p.slug),
    slug: p.slug,
    project: p.project,
    name: p.name,
    short_name: p.short_name,
    promoter: p.promoter ?? null,
    units_total: p.units_total ?? null,
    status: p.status,
    short_code: p.short_code ?? null,
    corridor: p.corridor ?? null,
    finished_late12: p.finished_late12 ?? null,
    source: p.source,
  }));

  const reg = (phase, o) => ({
    id: id("rera_registration", phase),
    phase,
    authority: "harera_ggm",
    rera_number: null,
    registered_on: null,
    registered_precision: "month",
    original_completion: null,
    original_completion_precision: "month",
    current_completion: null,
    current_completion_precision: "month",
    status: "valid",
    collection_account_name: null,
    collection_bank: null,
    collection_branch: null,
    collection_account_number: null,
    collection_ifsc: null,
    official_url: "https://haryanarera.gov.in",
    snapshot: `harera_registration/${phase}`,
    ...o,
  });
  const NUM = R2("C-04");
  const rera_registrations = [
    reg(AH2, {
      rera_number: "GGM/673/405/2022/117",
      registered_on: "2022-12-01",
      original_completion: "2027-12-01",
      current_completion: "2027-12-01",
      collection_account_name:
        "Aurelia Heights Ph 2 RERA Collection Account, Northfield Estates Pvt Ltd",
      collection_bank: "Peepal Bank",
      collection_branch: "Golf Course Road, Gurugram",
      collection_account_number: "50200071824417",
      collection_ifsc: "PEPL0000418",
      source: S5B,
    }),
    reg("kestrel-park", {
      rera_number: "GGM/781/513/2023/64",
      registered_on: "2023-11-01",
      original_completion: "2028-11-01",
      current_completion: "2028-11-01",
      source: `${S5B_ENG}; RERA number ${NUM}`,
    }),
    reg("sapphire-grove-phase-1", {
      rera_number: "GGM/867/599/2025/03",
      registered_on: "2025-01-01",
      original_completion: "2028-03-01",
      current_completion: "2028-03-01",
      source: `${S5} (completion); registration ${R2("C-02")}; RERA number ${NUM}`,
    }),
    reg("coral-towers", {
      rera_number: "GGM/612/344/2022/41",
      registered_on: "2022-07-01",
      original_completion: "2028-08-01",
      current_completion: "2029-08-01",
      source: `${S5B} (completion, extensions); registration ${R2("C-02")}; RERA number ${NUM}`,
    }),
    reg("laurel-residency", {
      rera_number: "GGM/447/179/2020/52",
      registered_on: "2020-11-01",
      original_completion: "2026-06-01",
      current_completion: "2026-06-01",
      source: `${S5B_ENG}; RERA number ${NUM}`,
    }),
    reg("juniper-enclave", {
      rera_number: "GGM/889/621/2025/22",
      registered_on: "2025-05-01",
      original_completion: "2029-12-01",
      current_completion: "2029-12-01",
      source: `${S5B}; RERA number ${NUM}`,
    }),
    reg("heron-point-phase-2", {
      rera_number: "GGM/902/634/2026/12",
      registered_on: "2026-04-28",
      registered_precision: "day",
      original_completion: "2031-04-01",
      current_completion: "2031-04-01",
      source: `${S5B}; registration day ${S5B_ENG}`,
    }),
    reg(CW2, {
      rera_number: "GGM/566/298/2022/31",
      registered_on: "2022-01-01",
      original_completion: "2027-03-01",
      current_completion: "2027-03-01",
      source: R2("C-04, C-05"),
    }),
  ];
  // Finished Northfield phases (R2 C-27): RERA number, OC month and timing. The original RERA
  // date is derived (OC month minus the stated months late, or plus months early); the
  // registration month is not given (the year is in the number).
  const finished = [
    [
      "cedar-walk",
      "GGM/118/50/2017/24",
      "2019-04",
      -2,
      "OC came 2 months before the original RERA date.",
    ],
    [
      "aurelia-heights-phase-1",
      "GGM/131/63/2017/38",
      "2023-03",
      27,
      "OC came 27 months after the original RERA date. That is 21 months after the 6-month COVID extension.",
    ],
    [
      "wren-court",
      "GGM/176/108/2018/09",
      "2021-11",
      11,
      "OC came 11 months after the original RERA date.",
    ],
    [
      "opaline-residences",
      "GGM/262/194/2018/71",
      "2023-05",
      11,
      "OC came 11 months after the original RERA date.",
    ],
    [
      "heron-point-phase-1",
      "GGM/301/233/2019/15",
      "2025-06",
      27,
      "OC came 27 months after the original RERA date.",
    ],
    [
      "linden-square",
      "GGM/349/281/2019/56",
      "2024-09",
      9,
      "OC came 9 months after the original RERA date.",
    ],
  ];
  for (const [phase, num, oc, late] of finished) {
    const orig = addMonths(oc, -late);
    rera_registrations.push(
      reg(phase, {
        rera_number: num,
        registered_on: null,
        original_completion: `${orig}-01`,
        current_completion: null,
        status: "valid",
        snapshot: null,
        source: `${C27}; original date ${derived(`OC ${oc} minus ${late} months`)}`,
      }),
    );
  }
  const completion_events = finished.map(([phase, , oc, late, line]) => ({
    id: id("completion_event", `${phase}/oc`),
    phase,
    kind: "oc",
    granted_on: `${oc}-01`,
    granted_precision: "month",
    months_late: late,
    late12: late > 12,
    line,
    source: C27,
  }));

  const towers = ["A", "B", "C"].map((code) => ({
    id: id("tower", `${AH2}/${code}`),
    phase: AH2,
    code,
    floors_planned: 20,
    units: null,
    source: S5B,
  }));

  const ut = (phase, label, carpet, superA, lane, source) => ({
    id: id("unit_type", `${phase}/${label}`),
    phase,
    label,
    carpet_sqft: carpet,
    super_sqft: superA,
    units: null,
    carpet_lane: carpet == null ? null : lane,
    super_lane: superA == null ? null : "from_developer",
    source,
  });
  const unit_types = [
    ut(
      AH2,
      "3 BHK",
      1450,
      2000,
      "records_show",
      `${S5B} (carpet as registered; super from the 2 Oct 2026 cost sheet)`,
    ),
    ut(AH2, "4 BHK", 2100, null, "records_show", `${S5B} (no 4 BHK cost sheet, so no super area)`),
    ut("kestrel-park", "2 BHK", 1050, null, "from_developer", `${S5B} (price lists of Oct 2026)`),
    ut(
      "kestrel-park",
      "3 BHK",
      1400,
      1880,
      "from_developer",
      `${S5B} (price lists of Oct 2026; super from the cost sheet)`,
    ),
    ut(
      "sapphire-grove-phase-1",
      "3 BHK",
      1400,
      1960,
      "from_developer",
      `${S5B} (price lists of Oct 2026; super from the cost sheet)`,
    ),
    ut(
      "sapphire-grove-phase-1",
      "3 BHK + study",
      1620,
      null,
      "from_developer",
      `${S5B} (price lists of Oct 2026)`,
    ),
    ut("coral-towers", "2 BHK", 980, null, "from_developer", `${S5B} (price lists of Oct 2026)`),
    ut(
      "coral-towers",
      "3 BHK",
      1240,
      1750,
      "from_developer",
      `${S5B} (price lists of Oct 2026; super from the cost sheet)`,
    ),
    ut(
      "juniper-enclave",
      "3 BHK",
      null,
      null,
      "from_developer",
      `${S5B} (carpet not in our records yet)`,
    ),
    ut(
      "laurel-residency",
      "3 BHK",
      null,
      null,
      "from_developer",
      `${S5B} (3 BHK quoted; carpet not in §5b)`,
    ),
    ut(CW2, "3 BHK", 1350, null, "from_developer", `${R2("C-05")} (price list of 12 Jun 2026)`),
  ];

  // QPR filings. Aurelia: 14 rows, Apr–Jun 2023 to Jul–Sep 2026 (R2 C-03), progress only on the 8 §5b quarters.
  const aureliaProgress = {
    "2023-Q2": [24, 6, 10],
    "2023-Q4": [38, 12, 20],
    "2024-Q2": [49, 19, 30],
    "2024-Q4": [58, 26, 40],
    "2025-Q2": [64, 31, 50],
    "2025-Q4": [68, 36, 60],
    "2026-Q1": [70, 38, 65],
    "2026-Q2": [72, 41, 70],
  };
  const aureliaLate = { "2024-Q3": 12, "2025-Q1": 41, "2025-Q4": 38 };
  const qpr = (phase, quarter, o) => ({
    id: id("qpr_filing", `${phase}/${quarter}`),
    phase,
    quarter,
    due_on: qprDue(quarter),
    filed_on: null,
    appeared_on: null,
    fetched_at: null,
    status: null,
    days_late: null,
    sold_pct: null,
    built_pct: null,
    time_used_pct: null,
    notes: null,
    snapshot: null,
    ...o,
  });
  const onTime = (filed) => ({ status: "on_time", days_late: filed ? 0 : null, filed_on: filed });
  const qpr_filings = [];
  for (const q of quartersRange("2023-Q2", "2026-Q3")) {
    const p = aureliaProgress[q];
    const late = aureliaLate[q];
    let o = {
      status: "on_time",
      source: `${S5B} (quarters before Jul–Sep 2024 on time; 3 of the last 8 late, named); first QPR ${R2("C-03")}`,
    };
    if (late)
      o = {
        status: "late",
        days_late: late,
        filed_on: addDays(qprDue(q), late),
        source: `${S5B} (filed ${late} days late); filed date ${derived("due date + days late")}`,
      };
    if (q === "2026-Q2")
      o = {
        ...onTime("2026-07-15"),
        fetched_at: IST("2026-07-16"),
        source: `${S5B} (filed 15 Jul 2026, on time); fetched 16 Jul 2026 per ${ART_EVIDENCE}`,
      };
    if (q === "2026-Q3")
      o = {
        status: "missing",
        source: `${S5B} (due 15 Oct 2026; not on HARERA as of 18 Oct 2026)`,
      };
    if (p) Object.assign(o, { sold_pct: p[0], built_pct: p[1], time_used_pct: p[2] });
    if (q === "2026-Q1") o.notes = "Tower A slab 9 cast";
    if (q === "2026-Q2") o.notes = "Tower A at slab 9";
    o.snapshot = q === "2026-Q3" ? null : `harera_qpr/${AH2}/${q}`;
    qpr_filings.push(qpr(AH2, q, o));
  }
  const C06 = R2("C-06");
  qpr_filings.push(
    qpr("kestrel-park", "2026-Q2", {
      ...onTime("2026-07-14"),
      built_pct: 59,
      snapshot: "harera_qpr/kestrel-park/2026-Q2",
      source: `${S5B} (Kestrel's Jul–Sep QPR: built 59% → 63%); filed date ${C06}`,
    }),
    qpr("kestrel-park", "2026-Q3", {
      ...onTime("2026-10-12"),
      built_pct: 63,
      snapshot: "harera_qpr/kestrel-park/2026-Q3",
      source: S5B,
    }),
    // Sapphire Grove Ph 1's QPRs before Apr–Jun 2026, the 15 Jul 2026 v1.0 run's replay input
    // (R3 C-30): all filed on time.
    ...[
      ["2025-Q1", "2025-04-14", 4],
      ["2025-Q2", "2025-07-15", 10],
      ["2025-Q3", "2025-10-14", 18],
      ["2025-Q4", "2026-01-14", 27],
      ["2026-Q1", "2026-04-15", 38],
    ].map(([q, filed, built]) =>
      qpr("sapphire-grove-phase-1", q, {
        ...onTime(filed),
        built_pct: built,
        snapshot: `harera_qpr/sapphire-grove-phase-1/${q}`,
        source: `${R3("C-30")} (filed dates and built %)`,
      }),
    ),
    qpr("sapphire-grove-phase-1", "2026-Q2", {
      status: "late",
      days_late: 12,
      filed_on: "2026-07-27",
      built_pct: 48,
      snapshot: "harera_qpr/sapphire-grove-phase-1/2026-Q2",
      source: S5B,
    }),
    qpr("sapphire-grove-phase-1", "2026-Q3", {
      ...onTime("2026-10-15"),
      appeared_on: "2026-10-16",
      fetched_at: IST("2026-10-16", "19:40:00"),
      notes: "Being read; no figures shown until the re-score",
      snapshot: "harera_qpr/sapphire-grove-phase-1/2026-Q3",
      source: S5B,
    }),
    // Coral Towers' QPRs before Jan–Mar 2026, the 15 Jul 2026 v1.0 run's replay input (R3 C-30):
    // on time unless a lateness is named.
    ...[
      ["2024-Q3", null, 12],
      ["2024-Q4", null, 14],
      ["2025-Q1", 30, 15],
      ["2025-Q2", null, 17],
      ["2025-Q3", 22, 18],
      ["2025-Q4", null, 20],
    ].map(([q, late, built]) =>
      qpr("coral-towers", q, {
        ...(late
          ? { status: "late", days_late: late, filed_on: addDays(qprDue(q), late) }
          : { status: "on_time" }),
        built_pct: built,
        snapshot: `harera_qpr/coral-towers/${q}`,
        source: `${R3("C-30")} (${late ? `filed ${late} days late` : "filed on time"}; built %)`,
      }),
    ),
    qpr("coral-towers", "2026-Q1", {
      ...onTime("2026-04-14"),
      built_pct: 22,
      snapshot: "harera_qpr/coral-towers/2026-Q1",
      source: S5B,
    }),
    qpr("coral-towers", "2026-Q2", { status: "missing", source: S5B }),
    qpr("coral-towers", "2026-Q3", { status: "missing", source: S5B }),
    ...[
      ["2025-Q3", "2025-10-13"],
      ["2025-Q4", "2026-01-12"],
      ["2026-Q1", "2026-04-14"],
      ["2026-Q2", "2026-07-15"],
    ].map(([q, filed]) =>
      qpr("laurel-residency", q, {
        ...onTime(filed),
        built_pct: 34,
        snapshot: `harera_qpr/laurel-residency/${q}`,
        source: `${S5B} (34% built in each QPR, Jul–Sep 2025 to Apr–Jun 2026); filed dates ${C06}`,
      }),
    ),
    qpr("juniper-enclave", "2026-Q2", {
      ...onTime("2026-07-10"),
      built_pct: 9,
      snapshot: "harera_qpr/juniper-enclave/2026-Q2",
      source: `${S5B} (9% built); quarter and filed date ${C06}`,
    }),
    // Cedar Walk Ph 2: QPRs on time in the last 8 quarters; Apr–Jun 2026 shows 70% built (R2 C-05).
    ...quartersRange("2024-Q3", "2026-Q2").map((q) =>
      qpr(CW2, q, {
        status: "on_time",
        built_pct: q === "2026-Q2" ? 70 : null,
        snapshot: q === "2026-Q2" ? `harera_qpr/${CW2}/${q}` : null,
        source: `${R2("C-05")} (on time in each of the last 8 quarters; filed dates not given)`,
      }),
    ),
  );

  const towerSlabs = {
    "2024-Q4": { A: 4, B: 3, C: 1 },
    "2025-Q2": { A: 6, B: 4, C: 2 },
    "2025-Q4": { A: 8, B: 6, C: 4 },
    "2026-Q1": { A: 9, B: 6, C: 4 },
    "2026-Q2": { A: 9, B: 7, C: 5 },
  };
  const qpr_tower_progress = [];
  for (const [q, slabs] of Object.entries(towerSlabs))
    for (const [t, s] of Object.entries(slabs))
      qpr_tower_progress.push({
        filing: id("qpr_filing", `${AH2}/${q}`),
        phase: AH2,
        quarter: q,
        tower: t,
        slab_reached: s,
        built_pct: null,
        source: S5B,
      });

  const C10 = R2("C-10");
  const extensions = [
    {
      id: id("extension", "coral-towers/1"),
      phase: "coral-towers",
      seq: 1,
      kind: "section6",
      granted_on: "2026-01-20",
      granted_precision: "day",
      from_completion: "2028-08-01",
      to_completion: "2029-02-01",
      order_ref: "HARERA/GGM/EXT/2026/014",
      snapshot: "harera_extension/coral-towers/1",
      source: `${S5B}; ${C10}`,
    },
    {
      id: id("extension", "coral-towers/2"),
      phase: "coral-towers",
      seq: 2,
      kind: "section6",
      granted_on: "2026-10-14",
      granted_precision: "day",
      from_completion: "2029-02-01",
      to_completion: "2029-08-01",
      order_ref: "HARERA/GGM/EXT/2026/219",
      snapshot: "harera_extension/coral-towers/2",
      source: `${S5B}; ${C10}`,
    },
  ];

  const blanket_extensions = [
    {
      id: id("blanket_extension", "mohua-2026-07-31"),
      authority: "mohua",
      advisory_on: "2026-07-31",
      applies_from_completion: "2026-02-28",
      applies_to_completion: null,
      months: 4,
      source_url: null,
      source: S5B,
    },
  ];

  // Complaint counts (24 months, decided against the promoter), stored as count facts in R1 (R2 C-11).
  const complaint_counts = [
    {
      subject_type: "phase",
      subject: AH2,
      count_24m: 14,
      units_base: 500,
      per_100_units: 2.8,
      median_count_similar: 3,
      latest_order_on: "2026-10-09",
      previous_count: 13,
      units_history: null,
      // Replay input (T11 handoff, R3 C-30): the count on record at each published run's cutoff.
      // 11 on 15 Jul 2026 (first scoring); an order of 28 Aug 2026 made it 12, seen by the 2 Sep
      // 2026 run; an order of 24 Sep 2026 made it 13, in effect through 30 Sep 2026; the 9 Oct
      // 2026 order made it 14 (the current count above).
      count_history: [
        {
          as_of: "2026-07-15",
          count: 11,
          per_100_units: 2.2,
          source: `${R3("C-30")} (11 complaints at first scoring, 15 Jul 2026); rate ${derived("11 per 500 units")}`,
        },
        {
          as_of: "2026-08-28",
          count: 12,
          per_100_units: 2.4,
          source: `${R3("C-30")} (an order of 28 Aug 2026 made it 12, seen by the 2 Sep 2026 run); rate ${derived("12 per 500 units")}`,
        },
        {
          as_of: "2026-09-24",
          count: 13,
          per_100_units: 2.6,
          source: `${R3("C-30")} (an order of 24 Sep 2026 made it 13, in effect through 30 Sep 2026); rate ${derived("13 per 500 units")}`,
        },
        {
          as_of: "2026-10-09",
          count: 14,
          per_100_units: 2.8,
          source: `${S5B} (the 9 Oct 2026 order made it 14); ${R3("C-30")}`,
        },
      ],
      source: `${S5B}; ${R2("C-11")}`,
    },
    {
      subject_type: "phase",
      subject: "kestrel-park",
      count_24m: 2,
      units_base: 420,
      per_100_units: 0.5,
      median_count_similar: 3,
      latest_order_on: null,
      previous_count: null,
      units_history: null,
      source: S5B,
    },
    {
      subject_type: "phase",
      subject: "sapphire-grove-phase-1",
      count_24m: 5,
      units_base: 360,
      per_100_units: 1.4,
      median_count_similar: 3,
      latest_order_on: null,
      previous_count: null,
      units_history: null,
      source: S5B,
    },
    {
      subject_type: "group",
      subject: "northfield-estates",
      count_24m: 24,
      units_base: 3400,
      per_100_units: 0.7,
      median_count_similar: null,
      latest_order_on: null,
      previous_count: null,
      units_history: [
        { to: "2025-12", units: 2980 },
        { from: "2026-04", units: 3400, line: "after Heron Point, Phase 2 was registered" },
      ],
      source: `${S5B} (24 complaints, 0.7 per 100 units); units base ${R2("C-12")}`,
    },
  ].map((c) => ({
    id: id("complaint_count", c.subject),
    ...c,
    count_history: c.count_history ?? null,
    window_to: "2026-10-14",
  }));

  const insolvency_events = [
    {
      id: id("insolvency_event", "elmstone-infra-projects/admitted"),
      developer: "elmstone-infra-projects",
      group: "elmstone-developers",
      kind: "admitted",
      event_on: "2023-03-12",
      forum: "NCLT",
      case_ref: null,
      snapshot: "ibbi/elmstone-infra-projects",
      source: `${S5B}; company ${R2("C-09")}`,
    },
  ];
  const insolvency_checks = [
    {
      id: id("insolvency_check", "northfield-estates"),
      group: "northfield-estates",
      found: false,
      checked_on: "2026-10-14",
      source: S5,
    },
  ];

  const reported_incidents = [
    {
      id: id("reported_incident", "sector-37d/2026-07-28"),
      locality: "sector-37d",
      kind: "waterlogging",
      reported_on: "2026-07-28",
      place_text: "Dwarka Expressway service road at the Sector 37D turn",
      source_kind: "news",
      url: null,
      lane: "reported_unverified",
      source: S5B,
    },
    {
      id: id("reported_incident", "sector-37d/2025-08-21"),
      locality: "sector-37d",
      kind: "waterlogging",
      reported_on: "2025-08-21",
      place_text: "Sector 37C–37D dividing road",
      source_kind: "news",
      url: null,
      lane: "reported_unverified",
      source: S5B,
    },
  ];

  const pre_rera_records = [
    {
      id: id("pre_rera", "northfield-greens"),
      group: "northfield-estates",
      project_name: "Northfield Greens",
      sector: "Sector 52",
      year_line: null,
      promised: "2011-12",
      oc_on: "2014-03",
      months_late: 27,
      fact_line: "Promised Dec 2011. OC Mar 2014, about 27 months late.",
      sources: [
        "Haryana State Consumer Commission order, Aug 2015 (delay compensation for 38 buyers)",
        "news report, Feb 2013",
      ],
      source: S5B,
    },
    {
      id: id("pre_rera", "alder-court"),
      group: "northfield-estates",
      project_name: "Alder Court",
      sector: "Sector 49",
      year_line: null,
      promised: "2013-06",
      oc_on: "2013-09",
      months_late: 3,
      fact_line: "Promised Jun 2013. OC Sep 2013.",
      sources: ["DTCP OC record", "news report, Oct 2013"],
      source: `${S5B}; months late ${derived("Jun 2013 → Sep 2013")}`,
    },
    {
      id: id("pre_rera", "larch-enclave"),
      group: "northfield-estates",
      project_name: "Larch Enclave",
      sector: "Sector 21",
      year_line: "2004",
      promised: null,
      oc_on: null,
      months_late: null,
      fact_line: "No court order or news found. Absence is not proof.",
      sources: [],
      source: S5B,
    },
  ];

  return {
    schema: "plinth.fixtures.catalogue/1",
    note: "DESIGN.md §5/§5b as data. Owner: T03. Generated by `npm run -w @plinth/fixtures author`; edit src/author, not this file. Every record carries `source`.",
    data_as_of: "2026-10-14",
    clock: "2026-10-18T12:00:00+05:30",
    localities,
    developer_groups,
    developers,
    projects,
    phases,
    rera_registrations,
    towers,
    unit_types,
    qpr_filings,
    qpr_tower_progress,
    extensions,
    blanket_extensions,
    complaint_counts,
    completion_events,
    insolvency_events,
    insolvency_checks,
    reported_incidents,
    pre_rera_records,
  };
}

// ---------------------------------------------------------------- evidence
export function buildEvidence(cat) {
  const sources = [
    ["harera_registration", "HARERA registration", "https://haryanarera.gov.in"],
    ["harera_qpr", "HARERA quarterly progress reports", "https://haryanarera.gov.in"],
    ["harera_qpr_register", "HARERA QPR filing register", "https://haryanarera.gov.in"],
    ["harera_orders", "HARERA orders", "https://haryanarera.gov.in"],
    ["harera_extension", "HARERA extension orders", "https://haryanarera.gov.in"],
    ["dtcp_oc", "DTCP occupation certificates", null],
    ["ibbi", "IBBI and NCLT records", null],
  ].map(([code, name, base_url]) => ({
    id: uuid5("source", code),
    code,
    name,
    base_url,
    cadence: null,
    terms_note: null,
    source: "DATA_MODEL §2 (source codes)",
  }));

  const snapshots = [];
  const snap = (key, code, fetched_at, content_type = "text/html") => {
    if (snapshots.some((x) => x.key === key)) return key;
    const sha = sha256(`plinth-fixture-snapshot:${key}`);
    snapshots.push({
      id: uuid5("snapshot", key),
      key,
      source_code: code,
      url: `fixture://${key}`,
      method: "GET",
      fetched_at,
      http_status: 200,
      sha256: sha,
      storage_key: `fixtures/snapshots/${sha}`,
      content_type,
      bytes: null,
      parser_version: "fixture",
      fixture: true,
      source: derived("synthetic fixture snapshot; sha256 of its key"),
    });
    return key;
  };

  const facts = [];
  const fact = (f) => {
    const rec = {
      id: uuid5("fact", f.key),
      key: f.key,
      subject_type: f.subject_type,
      subject: f.subject,
      attribute: f.attribute,
      value: f.value,
      as_of: f.as_of,
      valid_from: f.as_of,
      valid_to: f.valid_to ?? null,
      learned_at: f.learned_at ?? IST(f.as_of),
      snapshot: f.snapshot ?? null,
      page_ref: f.page_ref ?? null,
      extract_text: f.extract_text ?? null,
      method: f.method ?? "parser",
      method_version: f.method_version ?? "fixture",
      read_note: f.read_note ?? null,
      reviewed_at: f.reviewed_at ?? null,
      lane: f.lane ?? "records_show",
      superseded_by: f.superseded_by ?? null,
      corrections: f.corrections ?? [],
      evidence_copy: f.evidence_copy ?? null,
      source: f.source,
    };
    facts.push(rec);
    return rec;
  };

  // Registrations of the 8 phases
  for (const r of cat.rera_registrations.filter((x) => x.snapshot)) {
    snap(r.snapshot, "harera_registration", IST("2026-10-14"), "application/pdf");
    const ph = cat.phases.find((p) => p.slug === r.phase);
    const isA = r.phase === AH2;
    fact({
      key: `${r.phase}/registration`,
      subject_type: "registration",
      subject: r.phase,
      attribute: "registration.dates",
      value: {
        rera_number: r.rera_number,
        registered:
          r.registered_precision === "day" ? r.registered_on : r.registered_on.slice(0, 7),
        original_completion: r.original_completion.slice(0, 7),
        units: ph.units_total,
      },
      as_of: "2026-10-14",
      snapshot: r.snapshot,
      page_ref: isA ? "p. 1" : null,
      extract_text: isA ? "Proposed date of completion: December 2027." : null,
      read_note: isA ? "Read by software. Checked by a person on 14 Oct 2026." : null,
      corrections: isA
        ? [
            {
              ref: "D-097",
              raised_on: "2026-01-12",
              decided_on: "2026-01-28",
              outcome: "upheld",
              before: "2023-01",
              after: "2022-12",
              line: "Corrected 28 Jan 2026 after dispute D-097: the registration month was shown as Jan 2023.",
            },
          ]
        : [],
      source: isA ? `${r.source}; correction ${S5B_SWEEP} (D-097)` : r.source,
    });
  }
  fact({
    key: `${AH2}/collection-account`,
    subject_type: "registration",
    subject: AH2,
    attribute: "registration.collection_account",
    value: {
      name: "Aurelia Heights Ph 2 RERA Collection Account, Northfield Estates Pvt Ltd",
      bank: "Peepal Bank",
      branch: "Golf Course Road, Gurugram",
      account_number: "50200071824417",
      account_last4: "4417",
      ifsc: "PEPL0000418",
    },
    as_of: "2026-10-14",
    snapshot: `harera_registration/${AH2}`,
    extract_text:
      "RERA collection account: Peepal Bank, Golf Course Road, Gurugram, account ending 4417, IFSC PEPL0000418.",
    read_note: "Read from the HARERA registration. Checked 14 Oct 2026.",
    source: S5B,
  });
  for (const t of ["A", "B", "C"])
    fact({
      key: `${AH2}/tower-${t}/floors`,
      subject_type: "tower",
      subject: `${AH2}/${t}`,
      attribute: "tower.floors_planned",
      value: 20,
      as_of: "2026-10-14",
      snapshot: `harera_registration/${AH2}`,
      corrections:
        t === "A"
          ? [
              {
                ref: "CL-201",
                raised_on: "2026-10-06",
                decided_on: "2026-10-07",
                outcome: "fixed_our_error",
                before: 21,
                after: 20,
                line: "Fixed 7 Oct 2026 (CL-201, our error): Tower A was shown with 21 floors.",
              },
            ]
          : [],
      source: t === "A" ? `${S5B}; correction ${S5B_SWEEP} (CL-201)` : S5B,
    });
  snap(`harera_extension/${AH2}/search`, "harera_extension", IST("2026-10-14"));
  fact({
    key: `${AH2}/extensions`,
    subject_type: "registration",
    subject: AH2,
    attribute: "registration.extensions",
    value: { count: 0 },
    as_of: "2026-10-14",
    snapshot: `harera_extension/${AH2}/search`,
    extract_text:
      "No matching orders for GGM/673/405/2022/117. New orders can take weeks to appear.",
    read_note: "Searched by RERA number and project name. Checked by a person.",
    source: `${S5B} ("No extensions so far")`,
  });

  // QPR progress and tower slabs
  const monthEnd = (ym) =>
    `${ym}-${["01", "03", "05", "07", "08", "10", "12"].includes(ym.slice(5)) ? "31" : "30"}`;
  for (const f of cat.qpr_filings) {
    if (!f.snapshot) continue;
    snap(f.snapshot, "harera_qpr", f.fetched_at ?? IST("2026-10-14"), "application/pdf");
    const isQ = f.phase === AH2 && f.quarter === "2026-Q2";
    const asOf = f.filed_on ?? monthEnd(quarterEndMonth(f.quarter));
    if (f.built_pct != null || f.sold_pct != null) {
      const v = { quarter: f.quarter };
      if (f.sold_pct != null) v.sold_pct = f.sold_pct;
      if (f.built_pct != null) v.built_pct = f.built_pct;
      if (f.time_used_pct != null) v.time_used_pct = f.time_used_pct;
      fact({
        key: `${f.phase}/qpr/${f.quarter}/progress`,
        subject_type: "registration",
        subject: f.phase,
        attribute: "qpr.progress",
        value: v,
        as_of: asOf,
        learned_at: f.fetched_at ?? undefined,
        snapshot: f.snapshot,
        page_ref: isQ ? "p. 3" : null,
        extract_text: isQ
          ? "Units booked: 72% of total. Physical progress, all towers: 41%."
          : f.sold_pct != null
            ? `Percentage of work completed: ${f.built_pct}%. Units booked: ${f.sold_pct}%.`
            : `Percentage of work completed: ${f.built_pct}%.`,
        method: "llm_x2",
        read_note: isQ
          ? "Read by two AI extractors; they matched. Checked by a person on 16 Jul 2026."
          : "Read by two AI extractors; they matched.",
        reviewed_at: isQ ? IST("2026-07-16") : null,
        evidence_copy: isQ
          ? {
              chip: "HARERA QPR · Apr–Jun 2026",
              document:
                "HARERA · Quarterly Progress Report · Apr–Jun 2026 · Aurelia Heights, Phase 2",
              dates_line:
                "Filed 15 Jul 2026 · we fetched it 16 Jul 2026 · last checked live 14 Oct 2026",
              used_in: ["Reason 1 of Delivery risk", "Records → QPR filings"],
              source: ART_EVIDENCE,
            }
          : null,
        source: f.source,
      });
    }
    const slabs = cat.qpr_tower_progress.filter(
      (t) => t.phase === f.phase && t.quarter === f.quarter,
    );
    if (slabs.length)
      fact({
        key: `${f.phase}/qpr/${f.quarter}/towers`,
        subject_type: "registration",
        subject: f.phase,
        attribute: "qpr.tower_slabs",
        value: {
          quarter: f.quarter,
          ...Object.fromEntries(slabs.map((s) => [s.tower, s.slab_reached])),
        },
        as_of: asOf,
        snapshot: f.snapshot,
        extract_text: `${slabs.map((s) => `Tower ${s.tower}: slab ${s.slab_reached}`).join(". ")}.`,
        method: "llm_x2",
        read_note: "Read by two AI extractors; they matched.",
        source: S5B,
      });
  }

  // Aurelia QPR register (reason 2), the Apr–Jun filing status (D-118) and the missing Jul–Sep QPR
  snap(`harera_qpr_register/${AH2}/2026-10-14`, "harera_qpr_register", IST("2026-10-14"));
  snap(`harera_qpr_register/${AH2}/2026-10-18`, "harera_qpr_register", IST("2026-10-18"));
  const d118 = {
    ref: "D-118",
    raised_on: "2026-08-14",
    decided_on: "2026-09-03",
    outcome: "upheld",
    before: "late",
    after: "on_time",
    line: "Corrected 3 Sep 2026 after dispute D-118 (upheld): the Apr–Jun 2026 QPR was first marked late; it was filed 15 Jul 2026, on time.",
  };
  const d118src = `${S5B_SWEEP} (D-118); dates ${R2("C-14")}`;
  fact({
    key: `${AH2}/qpr-register`,
    subject_type: "registration",
    subject: AH2,
    attribute: "qpr.filing_record",
    value: {
      quarters_on_record: 13,
      first_quarter: "2023-Q2",
      last_quarter: "2026-Q2",
      late_in_last_8: 3,
      late: [
        { quarter: "2024-Q3", days_late: 12 },
        { quarter: "2025-Q1", days_late: 41 },
        { quarter: "2025-Q4", days_late: 38 },
      ],
      longest_days_late: 41,
      time_used_pct: 77,
    },
    as_of: "2026-10-14",
    snapshot: `harera_qpr_register/${AH2}/2026-10-14`,
    page_ref: "register",
    extract_text:
      "Filed after the due date in 3 of the last 8 quarters: Jul–Sep 2024 (12 days late), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days). Longest delay: 41 days.",
    read_note:
      "Due and filing dates read by software. Checked by a person on 14 Oct 2026. Time used counts from registration (Dec 2022) to the original date (Dec 2027).",
    reviewed_at: IST("2026-10-14"),
    corrections: [d118],
    evidence_copy: {
      chip: "HARERA QPR register",
      document:
        "HARERA · QPR filing register for this project · every quarter since registration (Dec 2022)",
      dates_line: "Register checked live 14 Oct 2026",
      used_in: ["Reason 2 of Delivery risk", "Records → QPR filings"],
      source: ART_EVIDENCE,
    },
    source: `${S5B}; time used ${derived("month-based, Dec 2022 → Oct 2026 over Dec 2022 → Dec 2027 = 46/60")}; ${d118src}`,
  });
  fact({
    key: `${AH2}/qpr/2026-Q2/status`,
    subject_type: "registration",
    subject: AH2,
    attribute: "qpr.filing_status",
    value: { quarter: "2026-Q2", status: "on_time", filed_on: "2026-07-15", due_on: "2026-07-15" },
    as_of: "2026-07-15",
    snapshot: `harera_qpr_register/${AH2}/2026-10-14`,
    corrections: [d118],
    source: `${S5B}; ${d118src}`,
  });
  fact({
    key: `${AH2}/qpr/2026-Q3/missing`,
    subject_type: "registration",
    subject: AH2,
    attribute: "qpr.missing",
    value: { quarter: "2026-Q3", due_on: "2026-10-15" },
    as_of: "2026-10-18",
    snapshot: `harera_qpr_register/${AH2}/2026-10-18`,
    extract_text: "No QPR for Jul–Sep 2026 on the HARERA register (checked 18 Oct 2026).",
    read_note: "Register read by software. Checked 18 Oct 2026.",
    source: S5B,
  });
  // Cedar Walk Ph 2: on time in each of the last 8 quarters (R2 C-05)
  snap(`harera_qpr_register/${CW2}/2026-10-14`, "harera_qpr_register", IST("2026-10-14"));
  fact({
    key: `${CW2}/qpr-register`,
    subject_type: "registration",
    subject: CW2,
    attribute: "qpr.filing_record",
    value: { late_in_last_8: 0, first_quarter: "2024-Q3", last_quarter: "2026-Q2" },
    as_of: "2026-10-14",
    snapshot: `harera_qpr_register/${CW2}/2026-10-14`,
    source: R2("C-05"),
  });
  snap("harera_qpr_register/coral-towers/2026-10-18", "harera_qpr_register", IST("2026-10-18"));
  for (const q of ["2026-Q2", "2026-Q3"])
    fact({
      key: `coral-towers/qpr/${q}/missing`,
      subject_type: "registration",
      subject: "coral-towers",
      attribute: "qpr.missing",
      value: { quarter: q, due_on: qprDue(q) },
      as_of: "2026-10-18",
      snapshot: "harera_qpr_register/coral-towers/2026-10-18",
      source: S5B,
    });
  fact({
    key: "sapphire-grove-phase-1/qpr/2026-Q3/filing",
    subject_type: "registration",
    subject: "sapphire-grove-phase-1",
    attribute: "qpr.filing_status",
    value: {
      quarter: "2026-Q3",
      status: "on_time",
      filed_on: "2026-10-15",
      due_on: "2026-10-15",
      appeared_on: "2026-10-16",
      fetched_at: IST("2026-10-16", "19:40:00"),
      figures_read: false,
    },
    as_of: "2026-10-16",
    learned_at: IST("2026-10-16", "19:40:00"),
    snapshot: "harera_qpr/sapphire-grove-phase-1/2026-Q3",
    source: S5B,
  });
  fact({
    key: "sapphire-grove-phase-1/qpr/2026-Q2/status",
    subject_type: "registration",
    subject: "sapphire-grove-phase-1",
    attribute: "qpr.filing_status",
    value: {
      quarter: "2026-Q2",
      status: "late",
      filed_on: "2026-07-27",
      due_on: "2026-07-15",
      days_late: 12,
    },
    as_of: "2026-07-27",
    snapshot: "harera_qpr/sapphire-grove-phase-1/2026-Q2",
    source: S5B,
  });
  fact({
    key: "kestrel-park/qpr/2026-Q3/status",
    subject_type: "registration",
    subject: "kestrel-park",
    attribute: "qpr.filing_status",
    value: { quarter: "2026-Q3", status: "on_time", filed_on: "2026-10-12", due_on: "2026-10-15" },
    as_of: "2026-10-12",
    snapshot: "harera_qpr/kestrel-park/2026-Q3",
    source: S5B,
  });

  // Time used today (phase level; month-based, checked against the §5/§5b figure)
  const tu = [
    [AH2, 77, `${S5}/${S5B}`],
    ["kestrel-park", 58, S5],
    ["sapphire-grove-phase-1", 55, S5],
    ["coral-towers", 70, S5],
    ["laurel-residency", 106, S5B],
    ["juniper-enclave", 31, S5B],
    ["heron-point-phase-2", 10, null],
    [CW2, 92, R2("C-05")],
  ];
  for (const [ph, pct, src] of tu) {
    const r = cat.rera_registrations.find((x) => x.phase === ph);
    const calc = timeUsedPct(
      r.registered_on.slice(0, 7),
      r.original_completion.slice(0, 7),
      "2026-10",
    );
    if (calc !== pct) throw new Error(`time used mismatch ${ph}: ${calc} vs ${pct}`);
    fact({
      key: `${ph}/time-used`,
      subject_type: "phase",
      subject: ph,
      attribute: "progress.time_used_pct",
      value: pct,
      as_of: "2026-10-14",
      method: "rules",
      method_version: "time-used rule v1.2",
      snapshot: r.snapshot,
      source: src
        ? `${src} figure; ${derived("month-based time used (BUILD_PLAN §7.1)")}`
        : derived("month-based time used, Apr 2026 → Oct 2026 over Apr 2026 → Apr 2031 = 6/60"),
    });
  }

  // Complaints (reason 3 for Aurelia)
  for (const c of cat.complaint_counts) {
    const isA = c.subject === AH2;
    if (c.subject_type === "phase")
      snap(`harera_orders/${c.subject}/2026-10-14`, "harera_orders", IST("2026-10-14"));
    fact({
      key: `${c.subject}/complaints-24m`,
      subject_type: c.subject_type,
      subject: c.subject,
      attribute: "orders.complaints_against_promoter_24m",
      value: {
        count: c.count_24m,
        units_base: c.units_base,
        per_100_units: c.per_100_units,
        median_count_similar: c.median_count_similar,
        latest_order_on: c.latest_order_on,
      },
      as_of: c.latest_order_on ?? "2026-10-14",
      learned_at: IST("2026-10-14"),
      snapshot: c.subject_type === "phase" ? `harera_orders/${c.subject}/2026-10-14` : null,
      page_ref: isA ? "order list" : null,
      extract_text: isA
        ? "Decided against the promoter: 14 orders on 500 units, or 2.8 per 100 units. Peer median count across 212 similar projects: 3."
        : null,
      method: "manual",
      read_note: isA
        ? "Each order matched to this project by RERA number. Checked by a person."
        : null,
      corrections: isA
        ? [
            {
              ref: "D-127",
              raised_on: "2026-10-10",
              decided_on: null,
              outcome: "under_review",
              before: null,
              after: null,
              line: "A dispute about this count, D-127 (10 Oct 2026), is under review.",
            },
          ]
        : [],
      evidence_copy: isA
        ? {
            chip: "HARERA orders · 24 months",
            document: "HARERA · complaint orders for this RERA number · Oct 2024 to Oct 2026",
            dates_line: "Orders search run 14 Oct 2026 · latest order 9 Oct 2026",
            used_in: ["Reason 3 of Delivery risk"],
            source: ART_EVIDENCE,
          }
        : null,
      source: isA ? `${c.source}; D-127 ${S5B_SWEEP}` : c.source,
    });
  }
  // The counts on record before the 9 Oct 2026 order (replay input, T11 handoff, R3 C-30): a
  // chain of superseded facts, one per order (15 Jul 11 -> 28 Aug 12 -> 24 Sep 13 -> 9 Oct 14),
  // each live only until the next one supersedes it.
  {
    const cur = facts.find((f) => f.key === `${AH2}/complaints-24m`);
    const hist = cat.complaint_counts.find((c) => c.subject === AH2).count_history;
    const past = hist.slice(0, -1); // the last entry duplicates the current (live) fact.
    let next = cur;
    for (let i = past.length - 1; i >= 0; i--) {
      const h = past[i];
      snap(`harera_orders/${AH2}/${h.as_of}`, "harera_orders", IST(h.as_of));
      next = fact({
        key: `${AH2}/complaints-24m/${h.as_of}`,
        subject_type: "phase",
        subject: AH2,
        attribute: "orders.complaints_against_promoter_24m",
        value: {
          count: h.count,
          units_base: 500,
          per_100_units: h.per_100_units,
          median_count_similar: null,
          latest_order_on: null,
        },
        as_of: h.as_of,
        valid_to: next.as_of,
        learned_at: IST(h.as_of),
        snapshot: `harera_orders/${AH2}/${h.as_of}`,
        method: "manual",
        superseded_by: next.id,
        source: h.source,
      });
    }
  }

  // Track records (reason 4 for Aurelia) and Northfield's finished projects
  snap("dtcp_oc/northfield-estates/2026-10-14", "dtcp_oc", IST("2026-10-14"));
  for (const g of cat.developer_groups.filter((x) => x.finished_projects != null)) {
    const isN = g.slug === "northfield-estates";
    fact({
      key: `${g.slug}/track-record`,
      subject_type: "group",
      subject: g.slug,
      attribute: "track_record.late12",
      value: {
        finished: g.finished_projects,
        late: g.finished_late12,
        ...(isN ? { late_phases: ["aurelia-heights-phase-1", "heron-point-phase-1"] } : {}),
      },
      as_of: "2026-10-14",
      snapshot: isN ? "dtcp_oc/northfield-estates/2026-10-14" : null,
      page_ref: isN ? "OC register" : null,
      extract_text: isN
        ? "OC granted more than 12 months after the original RERA date: 2 of 6. The other 4 got OC within 12 months."
        : null,
      method: "manual",
      read_note: isN
        ? "Group built from 9 linked companies in MCA records. Checked by a person."
        : null,
      evidence_copy: isN
        ? {
            chip: "HARERA · DTCP OC records",
            document:
              "HARERA project pages and DTCP occupation certificates · 6 Northfield Estates group projects",
            dates_line: "Checked 14 Oct 2026",
            used_in: ["Reason 4 of Delivery risk", "Developer track record"],
            source: ART_EVIDENCE,
          }
        : null,
      source: g.source,
    });
  }
  for (const e of cat.completion_events) {
    const r = cat.rera_registrations.find((x) => x.phase === e.phase);
    fact({
      key: `${e.phase}/oc`,
      subject_type: "phase",
      subject: e.phase,
      attribute: "completion.oc",
      value: {
        rera_number: r.rera_number,
        original_completion: r.original_completion.slice(0, 7),
        oc: e.granted_on.slice(0, 7),
        months_late: e.months_late,
      },
      as_of: "2026-10-14",
      snapshot: "dtcp_oc/northfield-estates/2026-10-14",
      method: "manual",
      source: e.source,
    });
  }

  // Insolvency
  snap("ibbi/northfield-estates/2026-10-14", "ibbi", IST("2026-10-14"));
  fact({
    key: "northfield-estates/insolvency-search",
    subject_type: "group",
    subject: "northfield-estates",
    attribute: "insolvency.search",
    value: { found: false },
    as_of: "2026-10-14",
    snapshot: "ibbi/northfield-estates/2026-10-14",
    page_ref: "search log",
    extract_text:
      "Insolvency (CIRP) admitted: none found. These registers can lag by weeks, so absence is not proof.",
    method: "manual",
    read_note: "Searched by company name and CIN. Checked by a person.",
    source: S5,
  });
  snap("ibbi/elmstone-infra-projects", "ibbi", IST("2026-10-14"));
  fact({
    key: "elmstone-developers/insolvency-admitted",
    subject_type: "developer",
    subject: "elmstone-infra-projects",
    attribute: "insolvency.admitted",
    value: { company: "Elmstone Infra Projects Pvt Ltd", forum: "NCLT", order_on: "2023-03-12" },
    as_of: "2023-03-12",
    learned_at: IST("2026-10-14"),
    snapshot: "ibbi/elmstone-infra-projects",
    extract_text:
      "Insolvency (CIRP) admitted against Elmstone Infra Projects Pvt Ltd, a group company of Elmstone Developers, NCLT order of 12 Mar 2023.",
    method: "manual",
    source: `${S5B}; company ${R2("C-09")}`,
  });

  // Coral's two extensions
  for (const e of cat.extensions) {
    snap(e.snapshot, "harera_extension", IST(e.granted_on));
    fact({
      key: `coral-towers/extension-${e.seq}`,
      subject_type: "registration",
      subject: "coral-towers",
      attribute: "registration.extension",
      value: {
        seq: e.seq,
        granted: e.granted_on,
        from_completion: e.from_completion.slice(0, 7),
        to_completion: e.to_completion.slice(0, 7),
        order_ref: e.order_ref,
      },
      as_of: e.granted_on,
      snapshot: e.snapshot,
      extract_text: `Order ${e.order_ref}: completion extended from ${e.from_completion.slice(0, 7)} to ${e.to_completion.slice(0, 7)} (RERA s.6).`,
      source: e.source,
    });
  }

  // Prices (from the developer; all-in = rules v2026.10 on the developer's cost sheet)
  const prices = [
    [AH2, 23500000, 27400400, 18900, "2026-10-02", S5B],
    ["kestrel-park", 21000000, 24400000, 17400, null, `${S5}; rounded all-in ${R2("C-13")}`],
    [
      "sapphire-grove-phase-1",
      19500000,
      22700000,
      16200,
      null,
      `${S5}/${S5B}; rounded all-in ${R2("C-13")}`,
    ],
    ["coral-towers", 16200000, 19000000, 15300, null, `${S5}; rounded all-in ${R2("C-13")}`],
    ["laurel-residency", 14800000, null, null, null, S5B],
    ["juniper-enclave", 22500000, null, null, null, S5B],
    [CW2, 18500000, null, null, "2026-06-12", R2("C-05")],
  ];
  for (const [ph, quoted, allIn, psf, dated, src] of prices) {
    fact({
      key: `${ph}/price/quoted-3bhk`,
      subject_type: "phase",
      subject: ph,
      attribute: "price.quoted",
      value: { unit: "3 BHK", base_price_inr: quoted },
      as_of: ph === "sapphire-grove-phase-1" ? "2026-10-16" : (dated ?? "2026-10-14"),
      lane: "from_developer",
      method: "developer",
      source: src,
    });
    if (allIn != null)
      fact({
        key: `${ph}/price/all-in-3bhk`,
        subject_type: "phase",
        subject: ph,
        attribute: "price.all_in",
        value: {
          unit: "3 BHK",
          all_in_inr: allIn,
          per_sqft_carpet_inr: psf,
          cost_sheet_dated: dated,
          rules_version: "2026.10",
        },
        as_of: dated ?? "2026-10-14",
        lane: "from_developer",
        method: "rules",
        method_version: "cost rules 2026.10",
        source: src,
      });
  }

  for (const r of cat.reported_incidents)
    fact({
      key: `sector-37d/waterlogging/${r.reported_on}`,
      subject_type: "phase",
      subject: AH2,
      attribute: "area.reported_waterlogging",
      value: { place: r.place_text, reported_on: r.reported_on, source_kind: "news" },
      as_of: r.reported_on,
      lane: "reported_unverified",
      method: "manual",
      source: S5B,
    });

  snapshots.sort((a, b) => a.key.localeCompare(b.key));
  return {
    schema: "plinth.fixtures.evidence/1",
    note: "Sources, synthetic snapshots and facts with extracts and read notes. Owner: T03. Generated; edit src/author. learned_at defaults to the as_of date at 00:00 IST when §5b gives no time.",
    sources,
    snapshots,
    facts,
  };
}
