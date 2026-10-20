// /sitemap.xml (T28; PRD F-33, platform_architecture §2.1). Every URL comes
// from the data layer (@/src/data, via src/seo/routes.ts): no hand-kept list
// of phases, developers or compare pairs.
import type { MetadataRoute } from "next";
import { siteDataAsOf } from "@/src/data";
import { comparePairs, comparePairSlug, publicDeveloperSlugs, publicProjectSlugs } from "@/src/seo/routes";
import { absoluteUrl } from "@/src/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = siteDataAsOf();

  const home: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "daily", priority: 1 },
  ];

  const projects: MetadataRoute.Sitemap = publicProjectSlugs().map((slug) => ({
    url: absoluteUrl(`/gurugram/projects/${slug}`),
    lastModified,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const developers: MetadataRoute.Sitemap = publicDeveloperSlugs().map((slug) => ({
    url: absoluteUrl(`/gurugram/developers/${slug}`),
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const compares: MetadataRoute.Sitemap = comparePairs().map((pair) => ({
    url: absoluteUrl(`/compare/${comparePairSlug(pair)}`),
    lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...home, ...projects, ...developers, ...compares];
}
