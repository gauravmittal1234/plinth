// One result row (WebSearch.dc.html): all-in first, quoted second (G-21), the
// borderless risk chip, and the built bar in the one accent detail. Every
// word is the card's own (SearchResults.items[]); hovering or focusing a row
// syncs the selected pin on the map (the list and the map share one state).
import { RiskChip } from "@plinth/web-ui";
import Link from "next/link";
import { SEARCH_COPY } from "./copy";
import type { ProjectCard } from "./types";

export type ResultCardProps = {
  card: ProjectCard;
  selected: boolean;
  onHover: (slug: string | null) => void;
};

export function ResultCard({ card, selected, onHover }: ResultCardProps) {
  const factsOnly = card.state === "facts_only";
  return (
    <li
      data-testid="result-card"
      data-slug={card.slug}
      className={
        "ui-rise list-none rounded-panel transition-colors duration-150 ease-out " +
        (selected ? "bg-track" : "bg-transparent")
      }
      onMouseEnter={() => onHover(card.slug)}
      onMouseLeave={() => onHover(null)}
    >
      <Link
        href={`/gurugram/projects/${card.slug}`}
        onFocus={() => onHover(card.slug)}
        onBlur={() => onHover(null)}
        className="grid grid-cols-[88px_1fr] items-start gap-4 rounded-panel p-3 text-ink no-underline sm:grid-cols-[140px_1fr] sm:gap-5 sm:p-4"
      >
        {card.image_url ? (
          <span
            className="aspect-square w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${card.image_url})` }}
          />
        ) : (
          <span className="aspect-square w-full bg-chip-fill" aria-hidden />
        )}
        <div className="flex min-w-0 flex-col gap-2">
          <div>
            <p className="m-0 font-display text-lead leading-tight font-bold">{card.name}</p>
            <p className="m-0 text-small text-ink2">
              {`${card.developer_name} · ${card.locality_line}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskChip chip={card.chip} surface={selected ? "track" : "bg"} />
            {card.chip_note ? <span className="text-caption text-ink2">{card.chip_note}</span> : null}
          </div>
          {factsOnly ? (
            <a href="#facts-only" className="text-caption text-ink underline underline-offset-2">
              {SEARCH_COPY.factsOnlySeeWhy}
            </a>
          ) : null}
          <p className="m-0 text-body font-semibold">{card.price_line}</p>
          {card.built_pct != null ? (
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden rounded-pill bg-chip-fill">
                <div
                  className="h-full rounded-pill bg-accent"
                  style={{ width: `${Math.min(100, card.built_pct)}%` }}
                />
              </div>
              {card.progress_line ? (
                <p className="m-0 text-caption text-ink2">{card.progress_line}</p>
              ) : null}
            </div>
          ) : null}
          <p className="m-0 text-caption text-ink2">
            {[card.config_line, card.completion_line].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
    </li>
  );
}
