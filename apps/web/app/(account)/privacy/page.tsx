// WebPrivacy (T51; WORK_BREAKDOWN §2.1, OWNERSHIP.md). Signed-in only, so it
// is never indexed (lead follow-up "meta noindex on account pages").
//
// `who_has_my_number` is a buyer read (never cached: AGENTS.md "Signed-in
// pages use the fixture session"), so it calls Next's `connection()` and must
// be read inside a <Suspense> boundary, not at this top level (Cache
// Components; see compare/page.tsx for the same shape).
import type { Metadata } from "next";
import { Suspense } from "react";
import { loadPrivacyData } from "@/src/features/privacy/page/load-privacy";
import { PrivacyPlaceholder } from "@/src/features/privacy/page/privacy-placeholder";
import { PrivacyScreen } from "@/src/features/privacy/page/privacy-screen";

export const metadata: Metadata = {
  title: "Privacy centre",
  description: "Who has your number, your consent history, and how to download or delete your data.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<PrivacyPlaceholder />}>
      <PrivacyFromData />
    </Suspense>
  );
}

async function PrivacyFromData() {
  const data = await loadPrivacyData();
  return <PrivacyScreen data={data} />;
}
