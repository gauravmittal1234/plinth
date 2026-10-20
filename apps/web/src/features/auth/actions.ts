"use server";

// The Bring step's one data source (lead review of #62): api.link_whatsapp_follows
// is the only function the contract gives this feature (API_CONTRACTS §3.2;
// INTEGRATION_NOTES.md "T45a/T45b define the result schemas for
// … link_whatsapp_follows …"). Its shape is still `x-plinth-shape: pending`,
// so this reads it defensively: any DataError (fixture_missing in fixture
// mode, not_implemented before T45a builds the real function, auth_required,
// …) means "can't answer," never a guess.
//
// `p_accept: false` is the peek the Bring step shows before any tap ("what's
// there"); `p_accept: true` is "Bring them here" itself. Both resolve
// through the same fixture key lookup, so fixture mode needs one new
// directory: packages/fixtures/expected/link_whatsapp_follows/.
import { isDataError, linkWhatsappFollows, projectPage, type Chip } from "@/src/data";

export type WaFollowPreviewItem = {
  readonly slug: string;
  readonly name: string;
  readonly chip: Chip;
  readonly imageUrl: string | null;
  readonly since: string;
};

export type WaCostSheetPreviewItem = {
  readonly label: string;
  readonly savedOn: string;
};

export type WaPreview = {
  readonly follows: readonly WaFollowPreviewItem[];
  readonly costSheets: readonly WaCostSheetPreviewItem[];
};

type RawFollow = { readonly slug?: unknown; readonly since?: unknown };
type RawSheet = { readonly label?: unknown; readonly saved_on?: unknown };
type RawPreview = { readonly follows?: unknown; readonly cost_sheets?: unknown };

function rawFollows(value: unknown): readonly { slug: string; since: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { slug: string; since: string }[] = [];
  for (const item of value as readonly RawFollow[]) {
    if (item && typeof item.slug === "string" && typeof item.since === "string") {
      out.push({ slug: item.slug, since: item.since });
    }
  }
  return out;
}

function rawSheets(value: unknown): readonly WaCostSheetPreviewItem[] {
  if (!Array.isArray(value)) return [];
  const out: WaCostSheetPreviewItem[] = [];
  for (const item of value as readonly RawSheet[]) {
    if (item && typeof item.label === "string" && typeof item.saved_on === "string") {
      out.push({ label: item.label, savedOn: item.saved_on });
    }
  }
  return out;
}

/**
 * `p_accept`'s response, named into the project it refers to (its own
 * project_page: name, band, photo — never invented here). Null when the
 * function doesn't exist yet, refuses the call, has no fixture key, or
 * names no follow we can show.
 */
async function loadWaPreview(accept: boolean): Promise<WaPreview | null> {
  let raw: unknown;
  try {
    raw = await linkWhatsappFollows(accept);
  } catch (e) {
    if (isDataError(e)) return null;
    throw e;
  }
  if (!raw || typeof raw !== "object") return null;
  const { follows: rawFollowList, cost_sheets: rawSheetList } = raw as RawPreview;
  const slugs = rawFollows(rawFollowList);
  if (slugs.length === 0) return null;

  const pages = await Promise.all(
    slugs.map(({ slug }) =>
      projectPage(slug).catch((e: unknown) => {
        if (isDataError(e)) return null;
        throw e;
      }),
    ),
  );

  const follows: WaFollowPreviewItem[] = [];
  slugs.forEach(({ slug, since }, i) => {
    const page = pages[i];
    // A follow we can't name or band is never shown (never invented).
    if (!page) return;
    follows.push({
      slug,
      since,
      name: page.risk.phase.name,
      chip: page.risk.chip,
      imageUrl: page.hero.image_url,
    });
  });
  if (follows.length === 0) return null;

  return { follows, costSheets: rawSheets(rawSheetList) };
}

/** What the Bring step shows, before any tap. */
export async function previewWhatsappFollows(): Promise<WaPreview | null> {
  return loadWaPreview(false);
}

/** "Bring them here": the record the Done step's success line needs. */
export async function confirmWhatsappFollows(): Promise<WaPreview | null> {
  return loadWaPreview(true);
}
