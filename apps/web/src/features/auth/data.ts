// The Done step's followed list (DESIGN.md §5b "WebSignIn", state 4): the
// project the reader just signed in for (if any), then whichever WhatsApp
// follows the confirm call actually recorded (src/features/auth/actions.ts'
// confirmWhatsappFollows) — never a guessed or fixed set (lead review of
// #62).
import type { ProjectPage } from "@/src/data";
import type { WaFollowPreviewItem } from "./actions";
import { COPY } from "./copy";

export type FollowedProject = {
  readonly slug: string;
  readonly name: string;
  readonly chip: ProjectPage["risk"]["chip"];
  readonly imageUrl: string | null;
  readonly metaLine: string;
  /** Brought over from WhatsApp, for the merge animation; false is the just-signed-in project. */
  readonly fromWhatsapp: boolean;
};

/**
 * `brought` is the confirm call's own recorded follows — empty unless
 * "Bring them here" got an answer back (AGENTS.md §9). A WhatsApp follow
 * that is the same project as the new one is never listed twice.
 */
export function buildFollowedList(
  newProject: ProjectPage | null,
  brought: readonly WaFollowPreviewItem[],
): readonly FollowedProject[] {
  const list: FollowedProject[] = [];
  if (newProject) {
    const { phase, chip } = newProject.risk;
    list.push({
      slug: phase.slug,
      name: phase.name,
      chip,
      imageUrl: newProject.hero.image_url,
      metaLine: COPY.followedJustNow,
      fromWhatsapp: false,
    });
  }
  for (const wa of brought) {
    if (newProject && wa.slug === newProject.risk.phase.slug) continue;
    list.push({
      slug: wa.slug,
      name: wa.name,
      chip: wa.chip,
      imageUrl: wa.imageUrl,
      metaLine: COPY.broughtOverFromWhatsapp,
      fromWhatsapp: true,
    });
  }
  return list;
}
