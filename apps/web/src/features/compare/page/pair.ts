// Slug list <-> URL encodings for the two routes this task owns
// (OWNERSHIP.md; WORK_BREAKDOWN T24):
//   - `/compare/[pair]`: the SEO route `/compare/[a]-vs-[b]`, one path segment
//     joining 2-4 slugs with "-vs-" (never a real slug substring: the pattern
//     requires only lower-case letters, digits and single hyphens).
//   - `/compare?p=a,b,c`: the working list the board edits with add/remove.
// A slug list only ever reaches CompareRequest in the order the reader built
// it (fixtures/expected/compare/_requests.json keys on exact p_slugs order),
// so every helper here preserves order and never sorts.
import type { Slug } from "@plinth/contracts";

/** The default 3-phase Dwarka Expressway comparison (WebCompare.dc.html; the compare fixture's 3-column key). */
export const DEFAULT_SLUGS: readonly Slug[] = [
  "aurelia-heights-phase-2",
  "kestrel-park",
  "sapphire-grove-phase-1",
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIN_SLUGS = 2;
const MAX_SLUGS = 4;

export function isSlug(value: string): value is Slug {
  return SLUG_RE.test(value);
}

/** 2-4 distinct, slug-shaped values; otherwise null (CompareRequest §4.5). */
function validated(values: readonly string[]): readonly Slug[] | null {
  if (values.length < MIN_SLUGS || values.length > MAX_SLUGS) return null;
  if (!values.every(isSlug)) return null;
  if (new Set(values).size !== values.length) return null;
  return values;
}

/** `"aurelia-heights-phase-2-vs-kestrel-park"` -> its 2-4 slugs, or null when the segment is malformed. */
export function parsePair(pair: string): readonly Slug[] | null {
  return validated(pair.split("-vs-"));
}

/** The reverse of `parsePair`: slugs -> one `[pair]` path segment. */
export function buildPair(slugs: readonly Slug[]): string {
  return slugs.join("-vs-");
}

/** `?p=a,b,c` -> its 2-4 slugs, or null when `p` is absent or malformed (the board then falls back to the default). */
export function parseSlugsQuery(p: string | string[] | undefined): readonly Slug[] | null {
  const raw = Array.isArray(p) ? p[0] : p;
  if (!raw) return null;
  return validated(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/** The working-list URL the board pushes after every add or remove. */
export function comparePath(slugs: readonly Slug[]): string {
  return `/compare?p=${slugs.join(",")}`;
}

/** The pretty SEO URL for an exact pair (used only to link into a 2-project comparison). */
export function comparePairPath(slugs: readonly [Slug, Slug]): string {
  return `/compare/${buildPair(slugs)}`;
}
