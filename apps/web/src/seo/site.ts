// SEO-wide constants and URL helpers (T28; PRD F-33, platform_architecture §2.1).
// One canonical origin, so sitemap.ts, robots.ts and every page's metadata agree.

/**
 * The public origin. `plinth.in` is a placeholder until the founder confirms
 * the domain (DECISIONS E-10), so production sets `NEXT_PUBLIC_SITE_URL`;
 * the fallback matches every fixture's `meta.live_url`.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://plinth.in").replace(/\/+$/, "");

/** An absolute URL under SITE_URL. `path` starts with "/", or is "/". */
export function absoluteUrl(path: string): string {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** `<link rel="canonical">` value for a page's own path. */
export function canonicalUrl(path: string): string {
  return absoluteUrl(path);
}

/** A card PNG's public URL (T27's `/cards/<kind>/<file>` route). */
export function cardImageUrl(kind: "risk" | "cost", slug: string): string {
  return absoluteUrl(`/cards/${kind}/${slug}.png`);
}
