// /j/[code] (T52; WORK_BREAKDOWN T52; API_CONTRACTS §4.11, §3.6). The
// relative's own opt-in page for a family invite: a public, single-use,
// 7-day link that carries no phone number. Joining happens off this page —
// the relative's own WhatsApp "JOIN <code>" message (wa-webhook →
// ops.family_join_by_code) or their own tap in the app — so this page never
// shows a "joined" confirmation itself (rule 9, "no confirmation without a
// record"). A top-level route with no site shell (app/layout.tsx only), like
// /c and /r.
import type { FamilyInvitePreview } from "@plinth/contracts";
import type { Metadata } from "next";
import { Suspense } from "react";
import { familyInvitePreview, isDataError } from "@/src/data";
import { FamilyInviteView } from "@/src/features/family/family-invite-view";
import { InviteUnavailable } from "@/src/features/family/invite-unavailable";

// Noindex on every response from this route: these are single-use tokens,
// never worth a search result, whether the code is live, spent or unknown.
export const metadata: Metadata = {
  title: "Join on Plinth",
  robots: { index: false, follow: false },
};

export default function Page({ params }: PageProps<"/j/[code]">) {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinRoute params={params} />
    </Suspense>
  );
}

function JoinFallback() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-[32rem] flex-col gap-10 px-4 py-16 sm:px-8"
    >
      <p className="m-0 text-body text-ink2">Reading the invite…</p>
    </main>
  );
}

// Exported for readability only; nothing in this task's own test files calls
// it directly (the e2e spec drives the real route).
export async function JoinRoute({ params }: Pick<PageProps<"/j/[code]">, "params">) {
  const { code } = await params;

  // The invite preview's fixtureMiss is "not_found" (registry.ts); a real
  // backend answers the same way for a used, expired or unknown code alike
  // (API_CONTRACTS §4.11, "a neutral reply") rather than telling a caller
  // which one it is, so one failure branch covers all three.
  let invite: FamilyInvitePreview | null = null;
  try {
    invite = await familyInvitePreview(code);
  } catch (e) {
    if (!isDataError(e, "not_found") && !isDataError(e, "fixture_missing")) throw e;
  }

  return invite ? <FamilyInviteView code={code} invite={invite} /> : <InviteUnavailable />;
}
