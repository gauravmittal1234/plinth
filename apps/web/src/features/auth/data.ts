// What this number already does on WhatsApp (DESIGN.md §5b "WebSignIn",
// state 3): Aurelia Heights, Phase 2 (followed 14 Sep 2026), Kestrel Park
// (followed 9 Oct 2026) and one Aurelia cost sheet (saved 2 Oct 2026). Fixed
// facts for the fixture world's one buyer persona: fixture mode has no
// per-number lookup (every buyer read is Rohan's), so this scenario is the
// same regardless of what the reader types into the phone field. Each
// project's own name, band and photo come from its project_page — never
// hardcoded here (AGENTS.md §5).
import type { ProjectPage } from "@/src/data";
import { COPY } from "./copy";
import { formatDate } from "./format";

const AURELIA_SINCE = "2026-09-14";
const KESTREL_SINCE = "2026-10-09";

export type WaProjectFollow = {
  readonly kind: "project";
  readonly slug: string;
  readonly name: string;
  readonly chip: ProjectPage["risk"]["chip"];
  readonly imageUrl: string | null;
  readonly imageAlt: string;
  readonly metaLine: string;
};

export type WaCostSheet = {
  readonly kind: "sheet";
  readonly name: string;
  readonly metaLine: string;
};

export type WaFollowItem = WaProjectFollow | WaCostSheet;

function followOf(page: ProjectPage, since: string): WaProjectFollow {
  const { phase, chip } = page.risk;
  return {
    kind: "project",
    slug: phase.slug,
    name: phase.name,
    chip,
    imageUrl: page.hero.image_url,
    imageAlt: `Illustrative image: ${phase.name}`,
    metaLine: `Followed on WhatsApp since ${formatDate(since)}`,
  };
}

/** The 2 WhatsApp project follows plus the 1 saved cost sheet (always in this order). */
export function buildWaFollows(
  aurelia: ProjectPage,
  kestrel: ProjectPage,
): readonly [WaProjectFollow, WaProjectFollow, WaCostSheet] {
  return [
    followOf(aurelia, AURELIA_SINCE),
    followOf(kestrel, KESTREL_SINCE),
    { kind: "sheet", name: COPY.costSheetName, metaLine: COPY.costSheetMeta },
  ];
}

export type FollowedProject = {
  readonly slug: string;
  readonly name: string;
  readonly chip: ProjectPage["risk"]["chip"];
  readonly imageUrl: string | null;
  readonly imageAlt: string;
  readonly metaLine: string;
  /** Brought over from WhatsApp, for the merge animation; false is the just-signed-in project. */
  readonly fromWhatsapp: boolean;
};

/**
 * The Done step's list: the project the reader just signed in for (if any),
 * then the WhatsApp follows brought over (if accepted). A WhatsApp follow
 * that is the same project as the new one is never listed twice.
 */
export function buildFollowedList(
  newProject: ProjectPage | null,
  waProjects: readonly [WaProjectFollow, WaProjectFollow],
  merged: boolean,
): readonly FollowedProject[] {
  const list: FollowedProject[] = [];
  if (newProject) {
    const { phase, chip } = newProject.risk;
    list.push({
      slug: phase.slug,
      name: phase.name,
      chip,
      imageUrl: newProject.hero.image_url,
      imageAlt: `Illustrative image: ${phase.name}`,
      metaLine: COPY.followedJustNow,
      fromWhatsapp: false,
    });
  }
  if (merged) {
    for (const wa of waProjects) {
      if (newProject && wa.slug === newProject.risk.phase.slug) continue;
      list.push({
        slug: wa.slug,
        name: wa.name,
        chip: wa.chip,
        imageUrl: wa.imageUrl,
        imageAlt: wa.imageAlt,
        metaLine: COPY.broughtOverFromWhatsapp,
        fromWhatsapp: true,
      });
    }
  }
  return list;
}
