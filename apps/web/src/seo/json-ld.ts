// JSON-LD builders (T28 brief: "BreadcrumbList, Place/Residence with the RERA
// number, Organization"; PRD F-33 "structured data so AI answer engines cite
// us"). Pure functions: every field comes from an already-fetched server or
// fixture payload (a PhaseSummary, a RiskMeta) or this file's own fixed
// identity facts (name, origin); nothing here composes risk copy.
//
// Pages that need one of these import it and render
// `<script type="application/ld+json">{JSON.stringify(...)}</script>`.
import type { PhaseSummary } from "@plinth/contracts";
import { absoluteUrl, SITE_URL } from "./site";

export type JsonLd = Record<string, unknown>;

/** One Organization block, identical wherever it appears. */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Plinth",
    url: SITE_URL,
    slogan: "No developer pays us. Ever.",
  };
}

export type BreadcrumbItem = { name: string; path: string };

/** A BreadcrumbList from the page's own trail (home first). */
export function breadcrumbListJsonLd(items: readonly BreadcrumbItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * A Place/Residence for one phase, carrying its RERA number as an
 * `additionalProperty` (schema.org has no native RERA field).
 */
export function residenceJsonLd(phase: PhaseSummary, path: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: phase.name,
    url: absoluteUrl(path),
    address: {
      "@type": "PostalAddress",
      addressLocality: phase.locality_line,
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "RERA number",
        value: phase.rera_number,
      },
    ],
    ...(phase.units != null ? { numberOfAccommodationUnits: phase.units } : {}),
  };
}
