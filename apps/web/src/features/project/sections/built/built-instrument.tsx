"use client";

// The interactive half of "How much is built?" (DESIGN §0 signature
// instrument: the replay tower): the tower filter, the replay slider, the
// Built/Sold/Time-used tiles and the 3D tower, all driven by the same
// `index`/`towerFilter` state. The heading and intro line are static, so
// `built-section.tsx` server-renders them and passes them in as `children`
// (project-page JS budget, lighthouserc.cjs), same split as
// states/booked-toggle.tsx.
import type { BandCode, BandRange, ProjectPage } from "@plinth/contracts";
import {
  FactTile,
  FactTiles,
  Pill,
  ReplaySlider,
  TowerStack,
  slabsFromPct,
} from "@plinth/web-ui";
import { useMemo, useState, type ReactNode } from "react";
import { BUILT_COPY } from "../../page/copy";

/**
 * Only the two slices this section reads. It is a client component, so
 * whatever it is passed is serialised into the page's RSC payload: passing the
 * whole ProjectPage put ~31 KB of JSON (homes, cost, records, ...) into the
 * HTML a second time, and the bigger HTML delayed every request after it
 * (M1 perf gate). project-page.tsx passes exactly this.
 */
export type BuiltSectionPage = {
  risk: Pick<ProjectPage["risk"], "progress">;
  progress: ProjectPage["progress"];
};

export function BuiltInstrument({
  page,
  bands,
  children,
}: {
  page: BuiltSectionPage;
  bands: readonly BandRange[];
  children: ReactNode;
}) {
  const { risk, progress } = page;
  const { quarters, towers, floors_per_tower: floorsPerTower } = progress;
  const floors = floorsPerTower ?? 20;
  const lastQuarter = Math.max(0, quarters.length - 1);

  const [index, setIndex] = useState(lastQuarter);
  const [towerFilter, setTowerFilter] = useState<string>("All");

  const stops = useMemo(
    () => [...quarters.map((q) => ({ label: q.label })), { label: BUILT_COPY.today }],
    [quarters],
  );

  const atToday = index >= quarters.length;
  const quarter = atToday ? null : quarters[index];

  const builtPct = atToday ? risk.progress.built_pct : (quarter?.built_pct ?? null);
  const soldPct = atToday ? risk.progress.sold_pct : (quarter?.sold_pct ?? null);
  const timeUsedPct = atToday ? progress.today.time_used_pct : (quarter?.time_used_pct ?? null);
  const bandCode: BandCode | null = atToday ? progress.today.band : (quarter?.band_then ?? null);
  const noteLine = atToday ? progress.late_filings_line : (quarter?.note_line ?? null);

  const bandLabel = bandCode ? (bands.find((b) => b.code === bandCode)?.label ?? bandCode) : null;
  const bandThenLine = atToday ? progress.today.band_since_line : bandLabel && `Band then: ${bandLabel}`;

  const towerRecord = atToday ? quarters.at(-1) : quarter;
  const towerSlab = towerFilter !== "All" ? (towerRecord?.towers?.[towerFilter] ?? null) : null;
  const builtSlabs = towerSlab !== null ? towerSlab : slabsFromPct(builtPct, floors);
  const soldSlabs = towerFilter === "All" ? slabsFromPct(soldPct, floors) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-16">
      <div className="flex flex-col gap-6">
        {children}

        {towers && towers.length > 0 ? (
          <div
            role="group"
            aria-label={BUILT_COPY.towerLabel}
            className="inline-flex w-max flex-wrap gap-1.5 rounded-pill bg-track p-1"
          >
            <Pill as="button" pressed={towerFilter === "All"} onClick={() => setTowerFilter("All")}>
              {BUILT_COPY.towerAll}
            </Pill>
            {towers.map((t) => (
              <Pill key={t} as="button" pressed={towerFilter === t} onClick={() => setTowerFilter(t)}>
                {t}
              </Pill>
            ))}
          </div>
        ) : null}

        <ReplaySlider
          stops={stops}
          value={index}
          onChange={setIndex}
          label={
            <>
              {BUILT_COPY.replayPrefix}
              <strong>{stops[index]?.label}</strong>
            </>
          }
          previousLabel={BUILT_COPY.earlier}
          nextLabel={BUILT_COPY.later}
        />

        <FactTiles columns={3}>
          <FactTile label={BUILT_COPY.builtTile} value={`${builtPct ?? 0}%`} emphasis="accent" />
          <FactTile
            label={BUILT_COPY.soldTile}
            value={`${soldPct ?? 0}%`}
            emphasis="band"
            band={bandCode}
          />
          <FactTile label={BUILT_COPY.timeUsedTile} value={`${timeUsedPct ?? 0}%`} />
        </FactTiles>

        {towerFilter !== "All" ? (
          <p className="m-0 font-semibold">{`Tower ${towerFilter}, slab ${builtSlabs} of ${floors}`}</p>
        ) : null}
        {noteLine ? <p className="m-0 text-small text-ink2">{noteLine}</p> : null}
        {bandThenLine ? <p className="m-0 text-small text-ink2">{bandThenLine}</p> : null}
      </div>

      <TowerStack floors={floors} built={builtSlabs} sold={soldSlabs} band={bandCode} />
    </div>
  );
}
