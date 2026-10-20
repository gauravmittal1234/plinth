// T47 accept: "Bring them here merges 2 follows." buildFollowedList is the
// pure function behind the Done step's list, including the de-dup guard for
// a next-project that happens to already be one of the WhatsApp follows.
import { describe, expect, it } from "vitest";
import { buildFollowedList, buildWaFollows, type WaProjectFollow } from "@/src/features/auth/data";
import type { ProjectPage } from "@/src/data";

function fakeChip(label: string): ProjectPage["risk"]["chip"] {
  return { kind: "band", label, step: 1, meter_filled: 1 };
}

function fakePage(slug: string, name: string, imageUrl: string | null = `/media/${slug}.jpg`): ProjectPage {
  return {
    risk: { phase: { slug, name }, chip: fakeChip(name) },
    hero: { image_url: imageUrl },
  } as unknown as ProjectPage;
}

const AURELIA = fakePage("aurelia-heights-phase-2", "Aurelia Heights, Phase 2");
const KESTREL = fakePage("kestrel-park", "Kestrel Park");

describe("buildWaFollows", () => {
  it("lists the 2 project follows then the 1 cost sheet, in that order", () => {
    const [aurelia, kestrel, sheet] = buildWaFollows(AURELIA, KESTREL);
    expect(aurelia.kind).toBe("project");
    expect(aurelia.slug).toBe("aurelia-heights-phase-2");
    expect(aurelia.metaLine).toBe("Followed on WhatsApp since 14 Sep 2026");
    expect(kestrel.slug).toBe("kestrel-park");
    expect(kestrel.metaLine).toBe("Followed on WhatsApp since 9 Oct 2026");
    expect(sheet.kind).toBe("sheet");
    expect(sheet.name).toBe("Aurelia Heights, 3 BHK cost sheet");
  });
});

describe("buildFollowedList", () => {
  const waProjects = buildWaFollows(AURELIA, KESTREL).slice(0, 2) as [WaProjectFollow, WaProjectFollow];

  it("is just the new project when Bring them here was declined", () => {
    const sapphire = fakePage("sapphire-grove-phase-1", "Sapphire Grove, Phase 1");
    const list = buildFollowedList(sapphire, waProjects, false);
    expect(list.map((f) => f.slug)).toEqual(["sapphire-grove-phase-1"]);
  });

  it("merges the new project with both WhatsApp follows when accepted", () => {
    const sapphire = fakePage("sapphire-grove-phase-1", "Sapphire Grove, Phase 1");
    const list = buildFollowedList(sapphire, waProjects, true);
    expect(list.map((f) => f.slug)).toEqual([
      "sapphire-grove-phase-1",
      "aurelia-heights-phase-2",
      "kestrel-park",
    ]);
    expect(list.filter((f) => f.fromWhatsapp)).toHaveLength(2);
  });

  it("is just the 2 WhatsApp follows when there is no new project (e.g. next=/following)", () => {
    const list = buildFollowedList(null, waProjects, true);
    expect(list.map((f) => f.slug)).toEqual(["aurelia-heights-phase-2", "kestrel-park"]);
  });

  it("never lists the same project twice when the new one is itself a WhatsApp follow", () => {
    const list = buildFollowedList(AURELIA, waProjects, true);
    expect(list.map((f) => f.slug)).toEqual(["aurelia-heights-phase-2", "kestrel-park"]);
    expect(list[0]?.fromWhatsapp).toBe(false);
  });
});
