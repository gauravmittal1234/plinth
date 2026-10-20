// The one honest state for a code that doesn't resolve — expired, already
// used or unknown alike (T52 Build "expired or unknown code states"; see
// copy.ts for why these share a state). No phone number input anywhere: a
// bad code has nothing to recover with.
import Link from "next/link";
import { PlinthMark } from "@/src/shell/icons";
import { FAMILY_JOIN_COPY } from "./copy";

export function InviteUnavailable() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-[32rem] flex-col gap-6 px-4 py-16 sm:px-8">
      <Link href="/" className="flex items-center gap-2 text-ink no-underline">
        <PlinthMark />
        <span className="font-sans text-h3 font-bold">Plinth</span>
      </Link>
      <h1 className="m-0 font-display text-h1 font-bold">
        {FAMILY_JOIN_COPY.unavailableHeading}
      </h1>
      <p className="m-0 max-w-measure text-lead text-ink2">{FAMILY_JOIN_COPY.unavailableBody}</p>
    </main>
  );
}
