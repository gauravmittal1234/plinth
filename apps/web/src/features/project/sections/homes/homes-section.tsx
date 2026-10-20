// "What are the homes like?" (WORK_BREAKDOWN §4 T20b; fixpass-buyer.md §1;
// fix-project2.md G-02, G-22, G-35). Each configuration's illustrative SVG
// floor plan, four lane-tagged facts (carpet, super, price, all-in — the 4
// BHK has no cost sheet, so no all-in), the three short lists (towers and
// homes, amenities, getting around) and the reported, unverified
// waterlogging near Sector 37D. Every fact comes from ProjectPage.homes.
import type { GettingAround, Homes, HomeConfiguration, Lane, LaneList } from "@plinth/contracts";
import { FactTile, FactTiles, Pill, SectionBand, laneTone } from "@plinth/web-ui";
import { formatDate } from "../../page/format";
import { EVIDENCE_LABELS } from "../../page/copy";
import { FloorPlan } from "./floor-plan";

const HOMES_COPY = {
  heading: "What are the homes like?",
  intro:
    "Two layouts across Towers A, B and C, 500 homes in all. Every size here is carpet area: the floor you can actually use.",
  towersHeading: "Towers and homes",
  amenitiesHeading: "What's around the homes",
  gettingAroundHeading: "Getting around",
  waterloggingHeading: "Reported waterlogging near Sector 37D",
  planCaption: "Illustrative floor plan, from the developer's brochure plan of 2 Oct 2026.",
};

function laneLabel(lane: Lane | null | undefined): string | null {
  return lane ? EVIDENCE_LABELS.lanes[lane] : null;
}

/** A finished line the fixture may add beside the typed fields (open contract objects). */
function textOf(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function ConfigCard({ config }: { config: HomeConfiguration }) {
  return (
    <div className="flex min-w-0 flex-col gap-6 rounded-panel bg-bg-solid p-5 sm:p-7">
      <h3 className="m-0 font-display text-h4 font-extrabold">{config.label}</h3>

      {config.rooms && config.rooms.length > 0 ? (
        <div className="flex flex-col gap-2">
          <FloorPlan rooms={config.rooms} />
          <Pill size="s" tone="claim" className="w-max">
            {HOMES_COPY.planCaption}
          </Pill>
        </div>
      ) : null}

      <FactTiles columns="auto">
        {config.carpet_line ? (
          <FactTile label={laneLabel(config.carpet_lane) ?? "Carpet area"} value={config.carpet_line} />
        ) : null}
        {config.super_line ? (
          <FactTile label={laneLabel(config.super_lane) ?? "Super area"} value={config.super_line} />
        ) : null}
        {config.price_line ? (
          <FactTile label={laneLabel(config.price_lane) ?? "Price"} value={config.price_line} />
        ) : null}
        {config.all_in_line ? <FactTile label="All-in" value={config.all_in_line} /> : null}
      </FactTiles>

      {config.loading_line ? <p className="m-0 text-small text-ink2">{config.loading_line}</p> : null}
      {config.all_in_note ? <p className="m-0 font-semibold">{config.all_in_note}</p> : null}
    </div>
  );
}

function LaneBlock({
  heading,
  lane,
  items,
  sourceLine,
}: {
  heading: string;
  lane: Lane;
  items: readonly string[];
  sourceLine?: string | null;
}) {
  if (items.length === 0) return null;
  const tone = laneTone(lane);
  return (
    <div className="flex flex-col gap-3">
      <h3 className="m-0 text-small font-semibold text-ink2 uppercase">{heading}</h3>
      <ul role="list" className="m-0 flex flex-col gap-2 p-0">
        {items.map((item, i) => (
          <li key={`${item}-${i}`}>{item}</li>
        ))}
      </ul>
      <Pill size="s" tone={tone} className="w-max">
        {sourceLine ?? EVIDENCE_LABELS.lanes[lane]}
      </Pill>
    </div>
  );
}

function Waterlogging({
  waterlogging,
}: {
  waterlogging: NonNullable<Homes["waterlogging"]>;
}) {
  const tone = laneTone(waterlogging.lane);
  return (
    <div className="flex flex-col gap-4 rounded-panel bg-bg-solid p-5 sm:p-7">
      <h3 className="m-0 font-display text-h4 font-extrabold">{HOMES_COPY.waterloggingHeading}</h3>
      <ul role="list" className="m-0 flex flex-col gap-3 p-0">
        {waterlogging.reports.map((report, i) => (
          <li key={`${report.reported_on}-${i}`} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
            <Pill tone={tone} className="shrink-0">
              {formatDate(report.reported_on)}
            </Pill>
            <p className="m-0 min-w-0 flex-1 text-ink2">{report.line}</p>
          </li>
        ))}
      </ul>
      {waterlogging.note_line ? <p className="m-0 text-small text-ink2">{waterlogging.note_line}</p> : null}
    </div>
  );
}

export function HomesSection({ homes }: { homes: Homes }) {
  const unitsLine = textOf(homes.units_line);
  const amenities: LaneList | null = homes.amenities ?? null;
  const gettingAround: GettingAround | null = homes.getting_around ?? null;

  return (
    <SectionBand id="homes" tone="track">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 max-w-[16ch] text-balance font-display text-h2 font-extrabold">
            {HOMES_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{HOMES_COPY.intro}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {homes.configurations.map((config) => (
            <ConfigCard key={config.label} config={config} />
          ))}
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {unitsLine ? (
            <LaneBlock heading={HOMES_COPY.towersHeading} lane="records_show" items={[unitsLine]} />
          ) : null}
          {amenities ? (
            <LaneBlock
              heading={HOMES_COPY.amenitiesHeading}
              lane={amenities.lane}
              items={amenities.items}
              sourceLine={amenities.source_line}
            />
          ) : null}
          {gettingAround ? (
            <LaneBlock
              heading={HOMES_COPY.gettingAroundHeading}
              lane={gettingAround.lane}
              items={gettingAround.items}
              sourceLine={gettingAround.source_line}
            />
          ) : null}
        </div>

        {homes.waterlogging ? <Waterlogging waterlogging={homes.waterlogging} /> : null}
      </div>
    </SectionBand>
  );
}
