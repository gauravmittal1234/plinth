// /c/[code] (T27; WORK_BREAKDOWN §2.1 "Share cards"). The page a card's QR
// or a WhatsApp "Live card" link opens: the card as it was sent, the record
// now, and "Changed since this card was sent" (api.share_card). A top-level
// route with no site shell (app/layout.tsx), so it opens fast from a forward
// with nothing but its own chrome.
import { RiskChip } from "@plinth/web-ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isDataError, riskSummary, shareCard } from "@/src/data";
import { PlinthMark } from "@/src/shell/icons";
import { breadcrumbListJsonLd } from "@/src/seo/json-ld";
import { canonicalUrl } from "@/src/seo/site";

export async function generateMetadata({ params }: PageProps<"/c/[code]">) {
  const { code } = await params;
  const card = await shareCard(code).catch(() => null);
  if (!card) return { robots: { index: false, follow: false } };
  return {
    title: card.phase.name,
    description: card.headline_line ?? card.now.lines[0] ?? card.phase.name,
    alternates: { canonical: canonicalUrl(`/c/${code}`) },
    // A code-keyed reopen link, not the canonical page: kept out of the index.
    robots: { index: false, follow: true },
    openGraph: card.now.card_url ? { images: [{ url: card.now.card_url }] } : undefined,
  };
}

export default async function Page({ params }: PageProps<"/c/[code]">) {
  const { code } = await params;

  let card;
  try {
    card = await shareCard(code);
  } catch (e) {
    if (isDataError(e, "not_found") || isDataError(e, "fixture_missing")) notFound();
    throw e;
  }
  const risk = await riskSummary(card.phase.slug).catch(() => null);

  const breadcrumb = breadcrumbListJsonLd([
    { name: "Home", path: "/" },
    { name: card.phase.name, path: `/gurugram/projects/${card.phase.slug}` },
  ]);

  return (
    <main id="main" className="mx-auto flex w-full max-w-[40rem] flex-col gap-10 px-4 py-16 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Link href="/" className="flex items-center gap-2 text-ink no-underline">
        <PlinthMark />
        <span className="font-display text-h3 font-extrabold">Plinth</span>
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-display text-h1 font-extrabold">{card.phase.name}</h1>
        {card.changed && card.headline_line ? (
          <p className="m-0 max-w-measure text-lead font-semibold text-ink">{card.headline_line}</p>
        ) : (
          <p className="m-0 max-w-measure text-lead text-muted">Nothing has changed since this card was sent.</p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-small font-semibold text-ink2">Now</h2>
        {card.now.chip ? <RiskChip chip={card.now.chip} /> : null}
        <ul className="m-0 flex flex-col gap-1 pl-0 text-body">
          {card.now.lines.map((line, i) => (
            <li key={i} className="list-none">
              {line}
            </li>
          ))}
        </ul>
      </section>

      {card.changed && card.changes.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-small font-semibold text-ink2">What changed</h2>
          <dl className="m-0 flex flex-col gap-3">
            {card.changes.map((change) => (
              <div key={change.key} className="flex flex-col gap-1">
                <dt className="text-caption text-muted">{change.label}</dt>
                <dd className="m-0 text-body">
                  {change.before_line} <span aria-hidden="true">→</span> {change.after_line}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 border-t border-line pt-6 text-caption text-muted">
        {risk ? (
          <>
            <p className="m-0">{risk.share.source_line}</p>
            <p className="m-0">{risk.meta.disclaimer_line}</p>
          </>
        ) : null}
        <Link href={card.live_url} className="font-semibold text-accent-text underline underline-offset-4">
          Open the live page
        </Link>
      </section>
    </main>
  );
}
