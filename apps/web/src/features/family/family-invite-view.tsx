// The relative's view of a live invite (T52; AppFamily.dc.html "the relative
// (phone)"; API_CONTRACTS §4.11). Server-rendered; the only client JS on the
// page is DeclineControl's small toggle.
import type { FamilyInvitePreview } from "@plinth/contracts";
import { Button } from "@plinth/web-ui";
import Link from "next/link";
import { canonicalUrl } from "@/src/seo/site";
import { PlinthMark } from "@/src/shell/icons";
import { FAMILY_JOIN_COPY } from "./copy";
import { DeclineControl } from "./decline-control";
import { whatsAppJoinLink } from "./wa-link";

export function FamilyInviteView({
  code,
  invite,
}: {
  code: string;
  invite: FamilyInvitePreview;
}) {
  const waHref = whatsAppJoinLink(code);
  // App Links (AGENTS.md §4): the app registers this same path, so a tap
  // opens AppFamily's native opt-in screen (T50) when it's installed, and
  // otherwise just re-opens this page.
  const appHref = canonicalUrl(`/j/${code}`);

  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-[32rem] flex-col gap-10 px-4 py-16 sm:px-8"
    >
      <Link href="/" className="flex items-center gap-2 text-ink no-underline">
        <PlinthMark />
        <span className="font-display text-h3 font-extrabold">Plinth</span>
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-h1 font-extrabold">
          {invite.inviter_first_name} invited you
        </h1>
        <p className="m-0 max-w-measure text-lead text-ink2">to follow {invite.scope_line}.</p>
        {invite.rera_number ? (
          <p className="m-0 text-caption text-muted">RERA {invite.rera_number}</p>
        ) : null}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-small font-semibold text-ink2">
          {FAMILY_JOIN_COPY.whatsGetHeading}
        </h2>
        <ul className="m-0 flex flex-col gap-2 pl-0 text-body">
          {invite.what_you_get.map((line, i) => (
            <li key={i} className="list-none">
              {line}
            </li>
          ))}
        </ul>
        <p className="m-0 text-body text-ink2">{invite.number_line}</p>
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-6">
        <h2 className="m-0 text-small font-semibold text-ink2">
          {FAMILY_JOIN_COPY.channelHeading}
        </h2>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="primary" size="lg">
            <a href={waHref}>{FAMILY_JOIN_COPY.whatsappCta(code)}</a>
          </Button>
          <Button asChild variant="secondary">
            <a href={appHref}>{FAMILY_JOIN_COPY.appCta}</a>
          </Button>
        </div>
        <p className="m-0 text-caption text-muted">{FAMILY_JOIN_COPY.trustLine}</p>
        <DeclineControl declineText={FAMILY_JOIN_COPY.declined(invite.inviter_first_name)} />
      </section>
    </main>
  );
}
