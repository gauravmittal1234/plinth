"use server";

// Every write WebFollowing makes. One module (not a route under
// apps/web/app/api/**, which isn't ours) so each Server Action stays inside
// this feature's own paths (OWNERSHIP.md), same shape as
// features/compare/board/actions.ts and features/home/actions.ts.
//
// AGENTS.md rule 9, "no confirmation without a record": every action below
// calls the real api.* write and only reports success once that RPC
// actually answered ok — never an optimistic "done" the server never saw.
// A `fixture_missing` miss (a real combination the fixture world can't
// answer yet, e.g. a follow type with no packages/fixtures/expected key) is
// reported honestly instead, the same pattern as home/actions.ts
// `submitProjectRequest`.
import type { Cadence } from "@plinth/contracts";
import {
  alertPrefsSet,
  familyInviteCreate,
  isDataError,
  markFollowingSeen,
  setFollowType,
  shortlistNoteAdd,
  type AlertPrefs,
  type AlertPrefsInput,
  type FamilyInvite,
  type FamilyScope,
  type Follow,
  type FollowType,
  type Slug,
} from "@/src/data";

export type ActionResult<T> = { ok: true; value: T } | { ok: false; message: string };

const FIXTURE_GAP = (what: string) =>
  `Fixture mode doesn't have a record for ${what} yet. The live product carries this through.`;

export async function markSeenAction(): Promise<ActionResult<true>> {
  try {
    await markFollowingSeen();
    return { ok: true, value: true };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return { ok: false, message: FIXTURE_GAP("marking the feed seen") };
    }
    throw e;
  }
}

export async function setFollowTypeAction(
  slug: Slug,
  followType: FollowType,
): Promise<ActionResult<Follow>> {
  try {
    const follow = await setFollowType(slug, followType, crypto.randomUUID());
    return { ok: true, value: follow };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return { ok: false, message: FIXTURE_GAP(`this follow type on ${slug}`) };
    }
    throw e;
  }
}

export async function addShortlistNoteAction(
  slug: Slug,
  text: string,
): Promise<ActionResult<true>> {
  const body = text.trim();
  if (!body) return { ok: false, message: "Write a note first." };
  try {
    await shortlistNoteAdd(slug, body, crypto.randomUUID());
    return { ok: true, value: true };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return { ok: false, message: FIXTURE_GAP("that note's exact words") };
    }
    throw e;
  }
}

export async function createFamilyInviteAction(
  scope: FamilyScope,
): Promise<ActionResult<FamilyInvite>> {
  try {
    const invite = await familyInviteCreate(scope);
    return { ok: true, value: invite };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return { ok: false, message: FIXTURE_GAP("an invite with this scope") };
    }
    throw e;
  }
}

export async function setDigestCadenceAction(
  prefs: AlertPrefsInput,
  cadence: Cadence,
): Promise<ActionResult<AlertPrefs>> {
  const next: AlertPrefsInput = { ...prefs, whatsapp: { ...prefs.whatsapp, digest: cadence } };
  try {
    const result = await alertPrefsSet(next, crypto.randomUUID());
    return { ok: true, value: result };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return { ok: false, message: FIXTURE_GAP("that alert cadence") };
    }
    throw e;
  }
}
