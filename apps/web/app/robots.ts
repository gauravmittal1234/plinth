// /robots.txt (T28; PRD F-33). Keeps signed-in-only and account surfaces out
// of the index on the production site; everywhere else (previews, staging,
// a local build), a crawler is told to stay out entirely, so a non-production
// deploy of the placeholder domain (DECISIONS E-10) never gets indexed by
// mistake. "Production" here means a real domain is configured
// (NEXT_PUBLIC_SITE_URL) and Vercel says this build is the production one
// (VERCEL_ENV); PLINTH_INDEXABLE=1 is the explicit override for indexing a
// non-Vercel deploy on purpose (documented in .env.example).
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/src/seo/site";

function isProductionSite(): boolean {
  if (process.env.PLINTH_INDEXABLE === "1") return true;
  return Boolean(process.env.NEXT_PUBLIC_SITE_URL) && process.env.VERCEL_ENV === "production";
}

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/following", "/privacy", "/workspace", "/capture"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
