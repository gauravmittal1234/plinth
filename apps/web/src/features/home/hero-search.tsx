"use client";

// The hero's signature (WORK_BREAKDOWN T21): type a project or developer name
// and its risk card assembles (`api.suggest` → `risk_summary`). Fixture mode
// only, and `ai_ask` is off until M5 (INTEGRATION_NOTES), so a query that
// matches no project shows Ask Plinth's coming-soon state instead of a
// fabricated answer — never an invented fact (AGENTS.md §5).
import type { RiskSummary } from "@/src/data";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { assembleCard, type HeroCardResult } from "./actions";
import { RiskMiniCard } from "./risk-mini-card";

const DEBOUNCE_MS = 300;

export function HeroSearch({ defaultSummary }: { defaultSummary: RiskSummary }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<HeroCardResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = (q: string) => {
    startTransition(async () => {
      setResult(await assembleCard(q));
    });
  };

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // An empty box goes back to the default Aurelia card already on the
      // page, with no round trip.
      if (query.trim() === "") startTransition(() => setResult(null));
      else run(query);
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div className="flex flex-col gap-4.5">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (timer.current) clearTimeout(timer.current);
          run(query);
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Type a project or developer to build its risk card, or ask Plinth a question
        </label>
        {/* UI v2 (benchmark-thapki.md "Inputs"): a 56 px filled field, radius
            16 — Thapki's benchmark called the old 36 px pill "disabled"-looking. */}
        <div className="flex items-center gap-2 rounded-field bg-bg-solid px-5 py-1">
          <input
            id="ask"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Type a project, e.g. Kestrel Park, or ask Plinth anything"
            className="h-14 min-w-0 flex-1 border-0 bg-transparent font-sans text-body text-ink outline-none placeholder:text-ink2"
          />
          <button
            type="submit"
            aria-label="Ask Plinth"
            className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-field border-0 bg-accent text-on-accent transition-transform duration-(--pl-motion-duration-press) ease-out hover:brightness-95 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M3 9h12M10 4l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {/* Still on the photo (DESIGN §3 "on-slab2": the dimmer light text for a dark ground). */}
        <p className="m-0 text-small text-on-slab2">
          Type any project or developer above, like Kestrel, Coral or Halcyon. The card builds from
          the records.
        </p>
      </form>

      {/* A white panel sitting on the photo: reset to `text-ink` so it isn't
          the surrounding column's light `text-on-slab`. */}
      <section
        aria-live="polite"
        aria-busy={isPending}
        className="min-h-[21.25rem] rounded-panel bg-bg-solid p-7 text-ink"
      >
        <HeroCardPanel defaultSummary={defaultSummary} result={result} />
      </section>
    </div>
  );
}

function HeroCardPanel({
  defaultSummary,
  result,
}: {
  defaultSummary: RiskSummary;
  result: HeroCardResult | null;
}) {
  if (result === null || result.kind === "card") {
    const summary = result?.kind === "card" ? result.summary : defaultSummary;
    // No entrance fade here: the card's own motion is the slab stack and the
    // meter filling in (TowerStack, Meter), and a whole-card opacity fade
    // would put running text through a genuinely low-contrast instant
    // mid-transition, not only a visual nicety (DESIGN §0 "no competing
    // motion"; axe's contrast check caught this before CI would have).
    return (
      <div key={summary.phase.slug}>
        <RiskMiniCard summary={summary} />
      </div>
    );
  }

  if (result.kind === "redirect") {
    const { item } = result;
    const href = item.kind === "developer" ? `/gurugram/developers/${item.slug}` : "/search";
    return (
      <div key={`redirect-${item.slug}`} className="flex flex-col gap-3">
        <p className="m-0 text-lead">
          <strong>{item.label}</strong> is a {item.kind}
          {item.detail_line ? <> · {item.detail_line}</> : null}.
        </p>
        <p className="m-0 text-body text-ink2">
          A {item.kind} doesn&rsquo;t carry one delivery-risk card. See its projects instead.
        </p>
        <Link
          href={href}
          className="self-start text-body font-semibold text-ink underline underline-offset-[0.2em]"
        >
          {item.kind === "developer" ? `See ${item.label}'s projects` : "Search projects"}
        </Link>
      </div>
    );
  }

  return (
    <div key="unknown" className="flex flex-col gap-3">
      <p className="m-0 text-lead">
        We couldn&rsquo;t match &ldquo;{result.query}&rdquo; to a project or developer we cover.
      </p>
      <p className="m-0 text-body text-ink2">
        Ask Plinth is coming soon. For now, try a name like Aurelia, Kestrel or Sapphire, or{" "}
        <Link href="#coverage" className="font-semibold text-ink underline underline-offset-[0.2em]">
          request this project
        </Link>
        .
      </p>
      <p className="m-0 text-small text-ink2">
        Prefer a person? Talk to a Plinth adviser · free · developers never pay us.
      </p>
    </div>
  );
}
