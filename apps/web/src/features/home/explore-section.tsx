// "Which projects are on track?" (product/design/artboards/WebHome.dc.html
// "explore"). A zero-JS corridor picker: native radios, and panels shown or
// hidden with a plain CSS `:has()` rule, so switching corridors costs nothing
// from the page's tight script budget (lighthouserc.cjs ≤ 150 KB).
import type { About } from "@/src/data";
import type { CorridorGroup } from "@/src/features/home/data";
import { RiskChip } from "@plinth/web-ui";
import Image from "next/image";
import Link from "next/link";
import { PROJECT_PHOTOS } from "./images";

/**
 * The zero-JS tab switch: every panel starts hidden (hero.css's `hidden`
 * utility), and this scoped, literal `:has()` rule (not a Tailwind
 * arbitrary-variant guess — plain CSS, so it only depends on the browser,
 * not on a particular compiled class name) reveals the one whose radio is
 * checked. `#explore` wraps both the radios and the panels, so `:has()` sees
 * across the two columns even though they aren't DOM siblings.
 */
const PANEL_CSS = `
#explore:has(#tab-dxp:checked) #panel-dxp,
#explore:has(#tab-gcer:checked) #panel-gcer,
#explore:has(#tab-ng:checked) #panel-ng { display: block; }
`;

function CorridorPanel({ group, whenLine }: { group: CorridorGroup; whenLine: string | null }) {
  if (group.items.length === 0) {
    return (
      <div className="flex min-h-[22.5rem] flex-col items-start justify-center gap-4 rounded-panel bg-track p-9">
        <h3 className="m-0 font-sans text-h3 font-bold tracking-[-0.025em]">
          {group.name} is planned{whenLine ? ` ${whenLine.replace(/^Planned /, "")}` : ""}
        </h3>
        <p className="m-0 max-w-[36ch] text-body">
          We publish a band only after we&rsquo;ve read every quarterly progress report and order
          for a project.
        </p>
      </div>
    );
  }
  return (
    <ol role="list" className="m-0 flex flex-col gap-1.5 p-0">
      {group.items.map((p) => {
        const photo = PROJECT_PHOTOS[p.slug];
        const [headlinePrice, ...priceNote] = p.price_line.split(" · ");
        return (
          <li key={p.slug}>
            <Link
              href={`/gurugram/projects/${p.slug}`}
              className="grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-5 rounded-panel p-4 text-ink no-underline hover:bg-track"
            >
              <span className="block aspect-[4/3] w-32 overflow-hidden bg-track">
                {/*
                 * The box is always w-32 (128 CSS px). Without `sizes`, a
                 * static import's intrinsic width (~2400 px) made Next ask
                 * for w=3840 on a phone: ~558 KB for four thumbnails on every
                 * home load (M1 perf gate). `sizes` lets the browser pick the
                 * smallest srcset width that still covers 128 px at the
                 * screen's density, so it looks the same. Not `priority`:
                 * these sit below the hero, and the hero heading is the LCP.
                 */}
                {photo ? (
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    sizes="128px"
                    className="size-full object-cover"
                  />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-col gap-2">
                <span className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <span className="flex min-w-0 flex-col">
                    <strong className="font-display text-[1.625rem] leading-[1.15] font-bold tracking-[-0.02em]">
                      {p.name}
                    </strong>
                    <span className="text-small text-ink2">
                      {p.developer_name} · {p.locality_line}
                    </span>
                  </span>
                  <span className="flex flex-none flex-col items-end leading-tight">
                    <strong className="font-display text-[1.625rem] tracking-[-0.02em]">
                      {headlinePrice}
                    </strong>
                    {priceNote.length ? (
                      <span className="text-caption text-ink2">{priceNote.join(" · ")}</span>
                    ) : null}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-4">
                  <RiskChip chip={p.chip} srPrefix="Delivery risk: " />
                  {p.progress_line ? (
                    <span className="text-small text-ink2">{p.progress_line}</span>
                  ) : null}
                </span>
                {p.completion_line ? <span className="text-body">{p.completion_line}</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function ExploreSection({
  corridors,
  sortLine,
  coverageNext,
}: {
  corridors: readonly CorridorGroup[];
  sortLine: string;
  coverageNext: About["coverage"]["next"];
}) {
  const firstWithItems = corridors.find((c) => c.items.length > 0) ?? corridors[0]!;
  return (
    <section id="explore" aria-labelledby="explore-h" className="bg-bg py-18 md:py-30">
      <style>{PANEL_CSS}</style>
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-10 px-4 sm:px-8 lg:flex-row lg:items-start lg:gap-14">
        <div className="flex min-w-0 flex-1 basis-[26rem] flex-col gap-6">
          <h2
            id="explore-h"
            className="m-0 max-w-[18ch] font-display text-question font-bold tracking-[-0.03em]"
          >
            Which projects are on track?
          </h2>
          <p className="m-0 max-w-[40ch] text-lead">
            Every under-construction project in Gurugram, scored. Pick a corridor to compare
            delivery risk, progress and all-in price.
          </p>

          <div role="radiogroup" aria-label="Corridor" className="flex flex-col gap-1">
            {corridors.map((c) => (
              <label
                key={c.key}
                htmlFor={`tab-${c.key}`}
                className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-panel px-4 py-2.5 text-ink has-checked:bg-track has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
              >
                <input
                  type="radio"
                  id={`tab-${c.key}`}
                  name="corridor"
                  value={c.key}
                  defaultChecked={c.key === firstWithItems.key}
                  className="sr-only"
                />
                <span className="font-display text-[1.375rem] font-bold tracking-[-0.015em]">
                  {c.tabLabel}
                </span>
                <span className="text-small text-ink2">{c.items.length || "—"}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1 basis-[32rem]">
          <p className="m-0 mb-3 text-body">
            <strong className="font-semibold">No paid placement.</strong> {sortLine}
          </p>
          {corridors.map((c) => (
            <div key={c.key} id={`panel-${c.key}`} className="hidden">
              <CorridorPanel
                group={c}
                whenLine={coverageNext.find((n) => n.name === c.name)?.when_line ?? null}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
