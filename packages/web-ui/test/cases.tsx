// One render per kit component for a fixture, the way a page would compose it.
// Used by the matrix (every component × the four fixtures × Day and Night, with
// axe) and by the class check (every class rendered compiles against the tokens).
import type { ReactElement } from "react";
import {
  BandScale,
  Button,
  ConfidenceDots,
  CostTable,
  DeveloperSaysField,
  DisclaimerLine,
  EvidenceDrawer,
  FactTile,
  FactTiles,
  FromDeveloperBlock,
  IconArray,
  Meter,
  PendingFact,
  Pill,
  ReasonList,
  ReplaySlider,
  RiskChip,
  RiskHeader,
  Riskometer,
  SectionBand,
  Sheet,
  SourceChip,
  Toast,
  TowerStack,
  laneTone,
  slabsFromPct,
} from "../src";
import { BANDS, COPY, evidenceFor, type Fixture } from "./fixtures";

const noop = () => {};

export type Case = { name: string; render: (f: Fixture) => ReactElement };

export const CASES: readonly Case[] = [
  // Risk
  {
    name: "RiskChip",
    render: ({ risk }) => <RiskChip chip={risk.chip} srPrefix={COPY.srDeliveryRisk} />,
  },
  { name: "Meter", render: ({ risk }) => <Meter chip={risk.chip} size="l" /> },
  {
    name: "RiskHeader",
    render: ({ risk }) => (
      <RiskHeader
        risk={risk}
        size="l"
        srPrefix={COPY.srDeliveryRisk}
        caption={risk.share.source_line}
      />
    ),
  },
  {
    name: "BandScale",
    render: ({ risk }) => (
      <BandScale bands={BANDS} current={risk.band?.code ?? null} label={COPY.scaleLabel} />
    ),
  },
  { name: "ConfidenceDots", render: ({ risk }) => <ConfidenceDots confidence={risk.confidence} /> },
  {
    name: "IconArray",
    render: ({ risk }) => (
      <IconArray frequency={risk.frequency} band={risk.band?.code} legend={COPY.legend} />
    ),
  },
  {
    name: "Riskometer",
    render: ({ risk }) => <Riskometer band={risk.band} label={risk.share.card_alt} bands={BANDS} />,
  },

  // Evidence
  {
    name: "ReasonList",
    render: ({ risk }) => <ReasonList reasons={risk.reasons} onOpenSource={noop} />,
  },
  {
    name: "SourceChip",
    render: ({ page }) => {
      const row = page.records[0]!;
      return (
        <SourceChip source={{ label: row.chip, evidence_url: row.evidence_url }} onOpen={noop} />
      );
    },
  },
  {
    name: "EvidenceDrawer",
    render: (f) => (
      <EvidenceDrawer
        evidence={evidenceFor(f)}
        open
        onOpenChange={noop}
        labels={{ close: COPY.closeEvidence, lanes: COPY.lanes, ...COPY.evidence }}
      />
    ),
  },
  {
    name: "DeveloperSaysField",
    render: ({ risk }) => (
      <DeveloperSaysField
        says={risk.developer_response ?? risk.pending[0]?.developer_says ?? null}
      />
    ),
  },
  {
    name: "FromDeveloperBlock",
    render: ({ page }) => (
      <FromDeveloperBlock
        data={page.from_developer}
        priceListHeading={<h3>{page.from_developer?.price_lists[0]?.label}</h3>}
      />
    ),
  },
  { name: "PendingFact", render: ({ risk }) => <PendingFact fact={risk.pending[0]} /> },
  {
    name: "DisclaimerLine",
    render: ({ risk }) => <DisclaimerLine meta={risk.meta} links={COPY.links} />,
  },

  // Data and instruments
  {
    name: "FactTile",
    render: ({ risk, page }) => (
      <FactTiles columns={3}>
        <FactTile
          label={page.truth_panel[1]?.label ?? risk.phase.name}
          value={risk.progress.line}
          emphasis="accent"
        />
        <FactTile
          label={risk.phase.locality_line}
          value={risk.price?.display_line ?? risk.phase.rera_number}
        />
      </FactTiles>
    ),
  },
  {
    name: "CostTable",
    render: ({ page }) => (
      <CostTable cost={page.cost} totalLabel={COPY.allIn} tagLabels={COPY.tags} />
    ),
  },
  {
    name: "TowerStack",
    render: ({ risk, page }) => (
      <TowerStack
        floors={page.progress.floors_per_tower}
        built={slabsFromPct(risk.progress.built_pct, page.progress.floors_per_tower ?? 20)}
        sold={slabsFromPct(risk.progress.sold_pct, page.progress.floors_per_tower ?? 20)}
        band={risk.band?.code}
      />
    ),
  },
  {
    name: "ReplaySlider",
    render: ({ page }) => (
      <ReplaySlider
        stops={page.progress.quarters}
        value={page.progress.quarters.length - 1}
        onChange={noop}
        label={page.progress.quarters.at(-1)?.label}
        previousLabel={COPY.earlier}
        nextLabel={COPY.later}
      />
    ),
  },

  // Primitives
  {
    name: "SectionBand",
    render: ({ risk }) => (
      <SectionBand tone="track" aria-labelledby="band-h">
        <h2 id="band-h">{risk.phase.name}</h2>
        <RiskChip chip={risk.chip} surface="track" />
      </SectionBand>
    ),
  },
  {
    name: "Pill",
    render: ({ page }) => (
      <div>
        <Pill tone={laneTone(page.records[0]!.lane)}>{COPY.lanes[page.records[0]!.lane]}</Pill>
        <Pill as="button" pressed onClick={noop}>
          {page.progress.towers?.[0] ?? page.risk.phase.short_code ?? page.risk.chip.label}
        </Pill>
      </div>
    ),
  },
  {
    name: "Button",
    render: ({ risk }) => (
      <div>
        <Button variant="primary" size="lg">
          {risk.phase.name}
        </Button>
        <Button variant="secondary">{risk.chip.label}</Button>
        <Button variant="tertiary">{risk.phase.developer.name}</Button>
        <Button asChild variant="secondary">
          <a href={risk.meta.methodology_url}>{risk.meta.model_version}</a>
        </Button>
      </div>
    ),
  },
  {
    name: "Sheet",
    render: ({ risk }) => (
      <Sheet open onOpenChange={noop} title={risk.phase.name} closeLabel={COPY.closeEvidence}>
        <p>{risk.progress.line}</p>
      </Sheet>
    ),
  },
  { name: "Toast", render: ({ risk }) => <Toast message={risk.share.caption} onDismiss={noop} /> },
];
