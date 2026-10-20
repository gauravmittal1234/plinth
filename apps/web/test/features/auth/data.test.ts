// T47 accept: "Bring them here merges 2 follows." buildFollowedList is the
// pure function behind the Done step's list, built only from what the
// confirm call actually recorded (lead review of #62) — including the
// de-dup guard for a next-project that happens to already be one of the
// brought-over follows.
import { describe, expect, it } from "vitest";
import type { ProjectPage } from "@/src/data";
import type { WaFollowPreviewItem } from "@/src/features/auth/actions";
import { buildFollowedList } from "@/src/features/auth/data";

function fakeChip(label: string): ProjectPage["risk"]["chip"] {
  return { kind: "band", label, step: 1, meter_filled: 1 };
}

function fakePage(slug: string, name: string): ProjectPage {
  return {
    risk: { phase: { slug, name }, chip: fakeChip(name) },
    hero: { image_url: `/media/${slug}.jpg` },
  } as unknown as ProjectPage;
}

function fakeFollow(slug: string, name: string, since: string): WaFollowPreviewItem {
  return { slug, name, since, chip: fakeChip(name), imageUrl: `/media/${slug}.jpg` };
}

const AURELIA_SLUG = "aurelia-heights-phase-2";
const KESTREL_SLUG = "kestrel-park";
const AURELIA_FOLLOW = fakeFollow(AURELIA_SLUG, "Aurelia Heights, Phase 2", "2026-09-14");
const KESTREL_FOLLOW = fakeFollow(KESTREL_SLUG, "Kestrel Park", "2026-10-09");

describe("buildFollowedList", () => {
  it("is just the new project when nothing was brought over", () => {
    const sapphire = fakePage("sapphire-grove-phase-1", "Sapphire Grove, Phase 1");
    const list = buildFollowedList(sapphire, []);
    expect(list.map((f) => f.slug)).toEqual(["sapphire-grove-phase-1"]);
  });

  it("merges the new project with both brought-over WhatsApp follows", () => {
    const sapphire = fakePage("sapphire-grove-phase-1", "Sapphire Grove, Phase 1");
    const list = buildFollowedList(sapphire, [AURELIA_FOLLOW, KESTREL_FOLLOW]);
    expect(list.map((f) => f.slug)).toEqual([
      "sapphire-grove-phase-1",
      "aurelia-heights-phase-2",
      "kestrel-park",
    ]);
    expect(list.filter((f) => f.fromWhatsapp)).toHaveLength(2);
  });

  it("is just the brought-over follows when there is no new project (e.g. next=/following)", () => {
    const list = buildFollowedList(null, [AURELIA_FOLLOW, KESTREL_FOLLOW]);
    expect(list.map((f) => f.slug)).toEqual(["aurelia-heights-phase-2", "kestrel-park"]);
  });

  it("never lists the same project twice when the new one is itself a brought-over follow", () => {
    const aureliaPage = fakePage(AURELIA_SLUG, "Aurelia Heights, Phase 2");
    const list = buildFollowedList(aureliaPage, [AURELIA_FOLLOW, KESTREL_FOLLOW]);
    expect(list.map((f) => f.slug)).toEqual(["aurelia-heights-phase-2", "kestrel-park"]);
    expect(list[0]?.fromWhatsapp).toBe(false);
  });
});
