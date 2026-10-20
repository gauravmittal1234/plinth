// WebFollowing (T49; WORK_BREAKDOWN §4 T49, OWNERSHIP.md). Replaces T05's
// stub. A signed-in page: in fixture mode it reads the one fixture session
// (packages/fixtures/expected/following_feed), never making the public
// pages dynamic (OWNERSHIP stays inside app/(account)/following/**).
//
// `following_feed` is a buyer read, answered at request time (never
// cached, src/data/index.ts), so Cache Components requires it behind
// <Suspense> to keep a static shell for the route (see
// node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md).
import type { Metadata } from "next";
import { Suspense } from "react";
import { FollowingPage } from "@/src/features/following/page/following-page";
import { FollowingPlaceholder } from "@/src/features/following/page/following-placeholder";

export const metadata: Metadata = {
  title: "Following",
  description: "What changed since you last looked, across the projects you follow.",
};

export default function Page() {
  return (
    <Suspense fallback={<FollowingPlaceholder />}>
      <FollowingPage />
    </Suspense>
  );
}
