"use client";

// The kit showcase (T14, dev only). Composes @plinth/web-ui the way the project
// page will (WebProject.dc.html): a guided story of bands, one instrument per
// section. Layout copy is the artboard's; everything else is the fixture payload.
import type { BandRange, Chip, Evidence, ProjectPage, SourceRef } from "@plinth/contracts";
import {
  BandScale,
  Button,
  CostTable,
  DeveloperSaysField,
  DisclaimerLine,
  EvidenceDrawer,
  FactTile,
  FactTiles,
  FromDeveloperBlock,
  IconArray,
  PendingFact,
  Pill,
  ReasonList,
  ReplaySlider,
  RiskChip,
  RiskHeader,
  Riskometer,
  SectionBand,
  Sheet,
  Toast,
  TowerStack,
  bandOfStep,
  slabsFromPct,
  stepOfBand,
  type EvidenceDrawerLabels,
} from "@plinth/web-ui";
import { useState } from "react";

type Props = {
  pages: ProjectPage[];
  bands: BandRange[];
  evidence: Evidence[];
};

const DRAWER_LABELS: EvidenceDrawerLabels = {
  close: "Close evidence",
  lanes: {
    records_show: "Records show",
    developer_says: "Developer says · not yet verified",
    from_developer: "From the developer · not verified by Plinth",
    our_estimate: "Our estimate",
    reported_unverified: "Reported · not verified",
    buyer_upload: "Upload",
  },
  document: "Document",
  page: "Page",
  snapshot: "Snapshot hash",
  read: "How we read it:",
  usedIn: "Used in:",
  newTab: "(opens in a new tab)",
};

const TAGS = {
  often_negotiable: "Often negotiable",
  set_by_law: "Set by law",
  refundable_deposit: "Refundable deposit",
};

const H2 = "m-0 font-display text-question font-bold text-balance";
const H3 = "m-0 font-sans text-h3 font-bold";

function bandChip(bands: BandRange[], code: string | null): Chip | null {
  const b = bands.find((x) => x.code === code);
  return b ? { kind: "band", label: b.label, step: b.step, meter_filled: b.step } : null;
}

export function KitShowcase({ pages, bands, evidence }: Props) {
  const [which, setWhich] = useState(0);
  const [night, setNight] = useState(false);
  const page = pages[which]!;
  const { risk, progress } = page;
  const quarters = progress.quarters;

  const [q, setQ] = useState(quarters.length - 1);
  const [tower, setTower] = useState<string | null>(null);
  const [details, setDetails] = useState(true);
  const [ev, setEv] = useState<Evidence | null>(null);
  const [evOpen, setEvOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pick = (i: number) => {
    setWhich(i);
    setQ(pages[i]!.progress.quarters.length - 1);
    setTower(null);
  };

  const qi = Math.min(q, Math.max(0, quarters.length - 1));
  const cur = quarters[qi];
  const floors = progress.floors_per_tower ?? 20;
  const slab = tower && cur?.towers ? (cur.towers[tower] ?? null) : null;
  const built = slab ?? slabsFromPct(cur?.built_pct, floors);
  const thenChip = bandChip(bands, cur?.band_then ?? null);
  const evidenceOf = (s: SourceRef) => evidence.find((e) => s.fact_ids.includes(e.fact_id ?? ""));
  const canOpen = risk.reasons.some((r) => r.sources.some((s) => evidenceOf(s)));

  return (
    <div
      data-theme={night ? "night" : "day"}
      className="min-h-dvh bg-bg font-sans text-body-public text-ink"
    >
      <header className="z-20 bg-bg md:sticky md:top-0">
        <div className="mx-auto flex w-full max-w-[79rem] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
          <p className="m-0 font-sans text-h3 font-bold">Web UI kit</p>
          <div role="group" aria-label="Fixture" className="flex flex-wrap gap-1">
            {pages.map((p, i) => (
              <Pill
                key={p.risk.phase.slug + i}
                as="button"
                pressed={i === which}
                onClick={() => pick(i)}
              >
                {p.risk.phase.name}
                {p.risk.display.state === "facts_only" ? ` · ${p.risk.chip.label}` : ""}
              </Pill>
            ))}
          </div>
          <Pill as="button" pressed={night} onClick={() => setNight((n) => !n)}>
            Night theme
          </Pill>
        </div>
      </header>

      <SectionBand
        aria-labelledby="risk-h"
        innerClassName="flex flex-wrap items-start gap-x-20 gap-y-12"
      >
        <div className="flex max-w-[35rem] min-w-0 flex-[1_1_26rem] flex-col gap-6">
          <h2 id="risk-h" className={`${H2} ui-rise`}>
            Will it be delivered on time?
          </h2>
          <div className="ui-rise [--ui-stagger:1]">
            <RiskHeader risk={risk} size="l" srPrefix="Delivery risk: " />
          </div>
          {risk.frequency ? <p className="m-0 text-lead">{risk.frequency.sentence}</p> : null}
          <p className="m-0">{risk.late12.line}</p>
          {risk.withheld ? (
            <p className="m-0">
              <strong>{risk.withheld.line}.</strong> {risk.withheld.explainer_line}
            </p>
          ) : null}
          {risk.pending.map((p, i) => (
            <PendingFact key={p.code + i} fact={p} />
          ))}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              aria-expanded={details}
              onClick={() => setDetails((d) => !d)}
            >
              {details ? "Hide the reasons" : "See the reasons"}
            </Button>
            <Button
              variant="tertiary"
              onClick={() => setToast("Link copied. It opens the live page, not a screenshot.")}
            >
              Share the live page
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_26rem] flex-col items-center gap-6">
          <Riskometer band={risk.band} label={risk.share.card_alt} />
          {risk.band ? (
            <BandScale bands={bands} current={risk.band.code} label="Delivery risk scale" />
          ) : null}
          <p className="m-0 w-full text-body">{risk.late12.oc_not_keys_line}</p>
          <DisclaimerLine
            meta={risk.meta}
            className="w-full"
            links={[
              { label: "Report an error", href: "#report" },
              { label: "How we make money", href: "#money" },
            ]}
          />
        </div>
      </SectionBand>

      {details ? (
        <SectionBand tone="track" aria-labelledby="why-h" innerClassName="flex flex-col gap-16">
          <div className="flex flex-wrap items-start gap-x-20 gap-y-14">
            {risk.frequency ? (
              <div className="flex max-w-[32.5rem] min-w-0 flex-[1_1_24rem] flex-col gap-4.5">
                <h3 className={H3}>How often were similar projects late?</h3>
                <IconArray
                  frequency={risk.frequency}
                  band={risk.band?.code}
                  legend={{ late: "More than 12 months late", within: "Within 12 months" }}
                />
                <p className="m-0 text-body text-ink2">{risk.frequency.reference_class_line}</p>
              </div>
            ) : null}
            <div className="flex min-w-0 flex-[1_1_28rem] flex-col gap-2">
              <h3 id="why-h" className={H3}>
                {risk.band ? `Why ${risk.band.label}?` : "What do the records show?"}
              </h3>
              <p className="m-0 mb-3 text-body text-ink2">
                Up to 4 reasons, ranked by how much each one adds.
              </p>
              <ReasonList
                reasons={risk.reasons}
                surface="track"
                sourceLabel={(s) => `Source: ${s.label}. Open evidence.`}
                onOpenSource={
                  canOpen
                    ? (s) => {
                        const found = evidenceOf(s);
                        if (found) {
                          setEv(found);
                          setEvOpen(true);
                        }
                      }
                    : undefined
                }
              />
              {!risk.reasons.length ? (
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {page.truth_panel.map((row) => (
                    <li key={row.key}>
                      <strong>{row.label}:</strong> {row.value_line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-stretch gap-6">
            {risk.what_would_change ? (
              <div className="flex min-w-0 flex-[1_1_24rem] flex-col gap-2 rounded-panel bg-accent-soft px-8 py-7 text-on-accent-soft">
                <strong>What would change this</strong>
                <span>{risk.what_would_change}</span>
              </div>
            ) : null}
            <DeveloperSaysField
              says={risk.developer_response}
              className="min-w-0 flex-[1_1_24rem]"
            />
          </div>
        </SectionBand>
      ) : null}

      <SectionBand aria-labelledby="built-h" innerClassName="flex flex-col gap-10">
        <div className="flex max-w-[37.5rem] flex-col gap-4">
          <h2 id="built-h" className={H2}>
            How much is built?
          </h2>
          <p className="m-0 text-lead">{risk.progress.line}</p>
        </div>
        <div
          data-theme="night"
          className="flex flex-wrap gap-x-10 gap-y-6 rounded-panel bg-slab p-6 text-ink sm:p-8"
        >
          <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p aria-live="polite" className="m-0 font-display text-h2 font-bold">
                {cur?.label}
              </p>
              {thenChip ? <RiskChip chip={thenChip} /> : null}
            </div>
            {progress.towers ? (
              <div role="group" aria-label="Show progress for" className="flex items-center gap-1">
                <Pill
                  as="button"
                  pressed={tower === null}
                  onClick={() => setTower(null)}
                  aria-label="All of the phase"
                >
                  All
                </Pill>
                {progress.towers.map((t) => (
                  <Pill
                    key={t}
                    as="button"
                    pressed={tower === t}
                    onClick={() => setTower(t)}
                    aria-label={`Tower ${t}`}
                  >
                    {t}
                  </Pill>
                ))}
              </div>
            ) : null}
            <TowerStack
              floors={floors}
              built={built}
              sold={tower ? null : slabsFromPct(cur?.sold_pct, floors)}
              band={cur?.band_then ?? null}
            />
          </div>
          <div className="flex min-w-0 flex-[1_1_22rem] flex-col justify-end gap-5">
            <FactTiles columns={3}>
              <FactTile
                label={slab !== null ? `Tower ${tower}, slab` : "Built"}
                value={
                  slab !== null
                    ? `${slab} of ${floors}`
                    : cur?.built_pct != null
                      ? `${cur.built_pct}%`
                      : "–"
                }
                emphasis="accent"
              />
              <FactTile
                label="Sold"
                value={cur?.sold_pct != null ? `${cur.sold_pct}%` : "–"}
                emphasis={cur?.band_then ? "band" : "ink"}
                band={cur?.band_then ?? null}
              />
              <FactTile
                label="Time used"
                value={cur?.time_used_pct != null ? `${cur.time_used_pct}%` : "–"}
              />
            </FactTiles>
            <ReplaySlider
              stops={quarters}
              value={qi}
              onChange={setQ}
              label={
                <>
                  Quarter on record: <strong>{cur?.label}</strong>
                </>
              }
              previousLabel="Earlier report"
              nextLabel="Later report"
            />
            {cur?.note_line ? <p className="m-0 text-body text-ink2">{cur.note_line}</p> : null}
          </div>
        </div>
      </SectionBand>

      <SectionBand tone="track" aria-labelledby="cost-h" innerClassName="flex flex-col gap-10">
        <h2 id="cost-h" className={H2}>
          What will I really pay?
        </h2>
        <p className="m-0 max-w-measure text-lead">{risk.price?.display_line}</p>
        <div className="flex flex-wrap gap-x-20 gap-y-10">
          {page.cost ? (
            <div className="flex max-w-[37.5rem] min-w-0 flex-[1_1_26rem] flex-col gap-4">
              <h3 className={H3}>Where the {page.cost.all_in_label} goes</h3>
              <CostTable cost={page.cost} totalLabel="All-in" tagLabels={TAGS} surface="track" />
            </div>
          ) : null}
        </div>
        <FromDeveloperBlock
          data={page.from_developer}
          priceListHeading={
            <h3 className={H3}>Price list, {page.from_developer?.price_lists[0]?.label}</h3>
          }
          paymentPlanHeading={<h3 className={H3}>Payment plan</h3>}
          flagStage={(s) => s.slab_no === 12 && risk.phase.slug === "aurelia-heights-phase-2"}
        />
      </SectionBand>

      <SectionBand aria-labelledby="kit-h" innerClassName="flex flex-col gap-8">
        <h2 id="kit-h" className={H2}>
          Chips, buttons and sheets
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {pages.map((p, i) => (
            <RiskChip key={i} chip={p.risk.chip} srPrefix="Delivery risk: " />
          ))}
          {[1, 2, 3, 4, 5].map((step) => {
            const c = bandChip(bands, bandOfStep(step));
            return c ? <RiskChip key={step} chip={c} /> : null;
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" aria-pressed={false}>
            Follow this project
          </Button>
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open a sheet
          </Button>
          <Button variant="tertiary">Northfield before RERA, from court orders and news</Button>
          <Button disabled>Send report</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="track">Records show</Pill>
          <Pill tone="claim">Developer says · not yet verified</Pill>
          <Pill tone="accent">Our estimate</Pill>
          <Pill tone="inverse">AI-generated</Pill>
          <Pill tone="chip">Often negotiable</Pill>
        </div>
        <p className="m-0 text-small text-ink2">
          Band steps: {bands.map((b) => `${b.label} ${stepOfBand(b.code)}`).join(" · ")}
        </p>
      </SectionBand>

      <EvidenceDrawer evidence={ev} open={evOpen} onOpenChange={setEvOpen} labels={DRAWER_LABELS} />
      <Sheet open={sheet} onOpenChange={setSheet} title={risk.phase.name} closeLabel="Close" modal>
        <p className="m-0">{risk.progress.line}</p>
        <RiskChip chip={risk.chip} />
      </Sheet>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
