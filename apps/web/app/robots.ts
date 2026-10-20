// /robots.txt (T28; PRD F-33). Keeps signed-in-only and account surfaces out
// of the index: a crawler never reaches a page that needs a session.
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/src/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/following", "/privacy", "/workspace", "/capture"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
