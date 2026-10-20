// WebHome's own reads (T21; INTEGRATION_NOTES "import only from @/src/data").
// Everything here is a cached public read (src/data/cache.ts), so the page
// stays in the prerendered shell under `cacheComponents`.
import "server-only";
import { about, methodology, riskSummary, searchProjects } from "@/src/data";
import type { About, Methodology, RiskSummary } from "@/src/data";
import type { ProjectCard } from "@plinth/contracts";

/** The hero's default card on first paint (DESIGN §0 critique: "it assembles once for Aurelia on load"). */
export const DEFAULT_SLUG = "aurelia-heights-phase-2";

/**
 * The three corridors Plinth covers or has announced (supabase/seed
 * `10_catalogue.sql`, DESIGN §5b). `key` names the corridor picker's radio
 * group member (`peer/<key>`) — a CSS id, not shown.
 */
export const CORRIDORS = [
  { key: "dxp", name: "Dwarka Expressway", tabLabel: "Dwarka Expressway" },
  { key: "gcer", name: "Golf Course Extension Road", tabLabel: "Golf Course Ext Rd" },
  { key: "ng", name: "New Gurugram", tabLabel: "New Gurugram" },
] as const;

export type CorridorKey = (typeof CORRIDORS)[number]["key"];
export type CorridorName = (typeof CORRIDORS)[number]["name"];

export type CorridorGroup = {
  key: CorridorKey;
  name: CorridorName;
  tabLabel: string;
  items: ProjectCard[];
};

/** The corridor a card belongs to: the locality line's last comma-separated part. */
function corridorOf(card: ProjectCard): string {
  const parts = card.locality_line.split(",");
  return parts[parts.length - 1]!.trim();
}

/** Every covered project, grouped by corridor, in the server's own (lowest-risk) order. */
export function groupByCorridor(items: readonly ProjectCard[]): CorridorGroup[] {
  return CORRIDORS.map(({ key, name, tabLabel }) => ({
    key,
    name,
    tabLabel,
    items: items.filter((card) => corridorOf(card) === name),
  }));
}

export type HomeData = {
  defaultSummary: RiskSummary;
  corridors: CorridorGroup[];
  sortLine: string;
  about: About;
  bands: Methodology["bands"];
};

/** Everything the home page's server component needs, in one round trip. */
export async function loadHomeData(): Promise<HomeData> {
  const [defaultSummary, search, aboutPage, methodologyPage] = await Promise.all([
    riskSummary(DEFAULT_SLUG),
    searchProjects({}),
    about(),
    methodology(),
  ]);
  return {
    defaultSummary,
    corridors: groupByCorridor(search.items),
    sortLine: search.sort_line,
    about: aboutPage,
    bands: methodologyPage.bands,
  };
}
