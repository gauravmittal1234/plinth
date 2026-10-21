"use client";

// The hero's Follow button (M2 gate gap A: the web never called api.follow
// here, and this button always sent a signed-in reader to sign-in again).
// Fixture mode keeps today's plain link to sign-in untouched (AGENTS.md
// "Fixture mode behaves exactly as today"); live mode (`live`,
// PLINTH_DATA=supabase) follows directly through the shared server action
// (src/features/auth/follow.ts) and only ever shows "Following" once that
// RPC actually returned a record (AGENTS.md rule 9) — a signed-out click
// answers auth_required, so this sends the reader to the same sign-in href
// the old link used, never a silent failure.
//
// After a sign-in with a pending follow ("Verify and follow X",
// sign-in-flow.tsx), that follow already ran on the new session before the
// redirect back here; this reads the one-shot flag it left
// (src/lib/followed-flag.ts, this browser only) so "Following" shows at
// once, with no per-user server read on this otherwise static, sessionless
// page (AGENTS.md: public pages stay static and prerendered).
import { Button, Toast } from "@plinth/web-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Slug } from "@/src/data";
import { followProject } from "@/src/features/auth/follow";
import { consumeFollowedFlag } from "@/src/lib/followed-flag";
import { HERO_COPY } from "../../page/copy";
import { FollowIcon } from "./action-icons";

export function FollowButton({
  slug,
  name,
  live,
  signInHref,
}: {
  slug: Slug;
  name: string;
  /** PLINTH_DATA=supabase: follows through api.follow on the signed-in session. */
  live: boolean;
  /** Where a signed-out click (today's only click, in fixture mode) goes. */
  signInHref: string;
}) {
  const router = useRouter();
  // The one-shot flag only ever exists after a soft navigation that just set
  // it (markFollowed, sign-in-flow.tsx), never a server-rendered hard load
  // (it's consumed, right here, on that very first mount) — so reading it as
  // this state's initial value, instead of an effect, never risks a
  // hydration mismatch and avoids an extra render pass.
  const [followed, setFollowed] = useState(() => live && consumeFollowedFlag(slug));
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!live) {
    return (
      <Button size="lg" asChild>
        <Link href={signInHref}>
          <FollowIcon aria-hidden="true" className="size-5 shrink-0" />
          {HERO_COPY.follow}
        </Link>
      </Button>
    );
  }

  async function onClick() {
    if (followed || pending) return;
    setPending(true);
    const result = await followProject(slug, crypto.randomUUID());
    setPending(false);
    if (result.outcome === "followed") {
      setFollowed(true);
    } else if (result.outcome === "auth_required") {
      router.push(signInHref);
    } else {
      setToast(HERO_COPY.followFailed(name));
    }
  }

  return (
    <>
      <Button
        size="lg"
        aria-pressed={followed}
        disabled={pending}
        onClick={() => void onClick()}
      >
        <FollowIcon aria-hidden="true" className="size-5 shrink-0" />
        {followed ? HERO_COPY.following : HERO_COPY.follow}
      </Button>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
