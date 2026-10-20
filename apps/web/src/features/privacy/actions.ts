"use server";

// Server Actions for the interactive privacy centre (OWNERSHIP.md keeps this
// inside src/features/privacy; src/data is server-only and apps/web/app/api/**
// isn't ours). AGENTS.md rule 9 "no confirmation without a record": each
// action tries the real api.* call, and when fixture mode has no answer for it
// yet (packages/fixtures/expected has no `relay_renew`, `data_export_request`
// or `account_delete_request` payload: T45b has not shipped the real RPC),
// it says plainly that nothing was recorded instead of faking success, the
// same honest pattern as `features/home/actions.ts` `submitProjectRequest`.
import {
  accountDeleteRequest,
  consentWithdraw,
  dataExportRequest,
  isDataError,
  relayRenew,
  type ConsentWithdrawal,
} from "@/src/data";

export type WithdrawResult =
  | { ok: true; withdrawal: ConsentWithdrawal }
  | { ok: false; message: string };

/** `api.consent_withdraw(p_ref)`: ends the share and asks the party to delete the number. */
export async function withdrawConsentAction(ref: string): Promise<WithdrawResult> {
  try {
    return { ok: true, withdrawal: await consentWithdraw(ref) };
  } catch (e) {
    if (isDataError(e, "fixture_missing") || isDataError(e, "not_found")) {
      return {
        ok: false,
        message: `Fixture mode has no consent record for ${ref}, so nothing was withdrawn.`,
      };
    }
    throw e;
  }
}

export type NoticeResult = { ok: boolean; message: string };

/** `api.relay_renew(p_relay_id)`. No fixture answer exists yet (T45b). */
export async function renewAction(ref: string): Promise<NoticeResult> {
  try {
    await relayRenew(ref);
    return { ok: true, message: "Renewed for 30 more days." };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return {
        ok: false,
        message: "Fixture mode doesn't record renewals yet, so nothing was extended.",
      };
    }
    throw e;
  }
}

/**
 * `api.data_export_request()`. No fixture answer exists yet (T45b), so this
 * is always honest in fixture mode: nothing is prepared, nothing is promised.
 */
export async function requestDataExportAction(): Promise<NoticeResult> {
  try {
    await dataExportRequest();
    return { ok: true, message: "Your file is being prepared. We'll message you when it's ready." };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return {
        ok: false,
        message:
          "Fixture mode doesn't record data requests yet, so nothing was saved. In the live product, your file is ready within 24 hours and the link works for 7 days, opening only after your sign-in code.",
      };
    }
    throw e;
  }
}

/** `api.account_delete_request()`. No fixture answer exists yet (T45b). */
export async function requestAccountDeletionAction(): Promise<NoticeResult> {
  try {
    await accountDeleteRequest();
    return { ok: true, message: "Your account is closed and scheduled for deletion." };
  } catch (e) {
    if (isDataError(e, "fixture_missing")) {
      return {
        ok: false,
        message:
          "Fixture mode doesn't record account deletions yet, so nothing was saved. In the live product, your account closes today and we erase your data within 30 days.",
      };
    }
    throw e;
  }
}
