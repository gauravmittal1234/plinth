// T28 acceptance: unit tests validate the JSON-LD shape.
import type { PhaseSummary } from "@plinth/contracts";
import { loadExpected } from "@plinth/fixtures/node";
import { describe, expect, it } from "vitest";
import { breadcrumbListJsonLd, organizationJsonLd, residenceJsonLd } from "@/src/seo/json-ld";

describe("organizationJsonLd", () => {
  it("is a valid Organization block", () => {
    const json = organizationJsonLd();
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Organization");
    expect(json.name).toBe("Plinth");
    expect(json.url).toBe("https://plinth.in");
  });
});

describe("breadcrumbListJsonLd", () => {
  it("numbers items from 1 and resolves each to an absolute URL", () => {
    const json = breadcrumbListJsonLd([
      { name: "Home", path: "/" },
      { name: "Aurelia Heights, Phase 2", path: "/gurugram/projects/aurelia-heights-phase-2" },
    ]);
    expect(json["@type"]).toBe("BreadcrumbList");
    const items = json.itemListElement as { position: number; name: string; item: string }[];
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://plinth.in/",
    });
    expect(items[1]!.position).toBe(2);
    expect(items[1]!.item).toBe("https://plinth.in/gurugram/projects/aurelia-heights-phase-2");
  });
});

describe("residenceJsonLd", () => {
  it("carries the RERA number as an additionalProperty (DESIGN §5b: GGM/673/405/2022/117)", () => {
    const riskSummary = loadExpected<{ phase: PhaseSummary }>(
      "risk_summary",
      "aurelia-heights-phase-2",
    );
    const json = residenceJsonLd(riskSummary.phase, "/gurugram/projects/aurelia-heights-phase-2");
    expect(json["@type"]).toBe("Residence");
    expect(json.name).toBe("Aurelia Heights, Phase 2");
    expect(json.url).toBe("https://plinth.in/gurugram/projects/aurelia-heights-phase-2");
    expect(json.additionalProperty).toEqual([
      { "@type": "PropertyValue", name: "RERA number", value: "GGM/673/405/2022/117" },
    ]);
  });
});
