// @plinth/web-ui (T14): the web kit shared by apps/web and apps/admin.
// DESIGN §0 (taste rules), §4 (components), §4a (guided story), §4b (live
// instruments). Props are typed from @plinth/contracts; every word a buyer reads
// comes from the payload or from the page (artboard copy), never from here.
// Styles: import "@plinth/web-ui/styles.css" once after the tokens theme.

// Risk
export { Meter, meterState, type MeterMode, type MeterProps, type MeterSize } from "./risk/meter";
export { RiskChip, type RiskChipProps } from "./risk/risk-chip";
export { RiskHeader, type RiskHeaderProps } from "./risk/risk-header";
export { BandScale, type BandScaleProps } from "./risk/band-scale";
export { ConfidenceDots, type ConfidenceDotsProps } from "./risk/confidence-dots";
export { IconArray, iconCells, type IconArrayProps, type IconCell } from "./risk/icon-array";
export { Riskometer, needleAngle, type RiskometerProps } from "./risk/riskometer";

// Evidence
export { ReasonList, type ReasonListProps } from "./evidence/reason-list";
export { SourceChip, type SourceChipProps, type SourceLike } from "./evidence/source-chip";
export {
  EvidenceDrawer,
  type EvidenceDrawerLabels,
  type EvidenceDrawerProps,
} from "./evidence/evidence-drawer";
export { DeveloperSaysField, type DeveloperSaysFieldProps } from "./evidence/developer-says-field";
export { FromDeveloperBlock, type FromDeveloperBlockProps } from "./evidence/from-developer-block";
export { PendingFact, type PendingFactProps } from "./evidence/pending-fact";
export { DisclaimerLine, type DisclaimerLineProps } from "./evidence/disclaimer-line";

// Data and instruments
export { FactTile, FactTiles, type FactTileProps, type FactTilesProps } from "./data/fact-tile";
export { CostTable, type CostTableProps } from "./data/cost-table";
export { TowerStack, slabsFromPct, type TowerStackProps } from "./data/tower-stack";
export { ReplaySlider, type ReplaySliderProps, type ReplayStop } from "./data/replay-slider";

// Primitives
export { SectionBand, type SectionBandProps } from "./primitives/section-band";
export { Pill, type PillProps, type PillTone } from "./primitives/pill";
export { Button, type ButtonProps, type ButtonVariant } from "./primitives/button";
export { Sheet, type SheetProps } from "./primitives/sheet";
export { Toast, type ToastProps } from "./primitives/toast";

// Helpers
export {
  BAND_CODES,
  bandOfStep,
  bandStyle,
  chipTone,
  isBandTone,
  riskVar,
  stepOfBand,
  type BandStyle,
  type ChipLike,
  type RiskTone,
} from "./lib/band";
export { laneTone, type Tone } from "./lib/lane";
export { useReducedMotion, REDUCED_MOTION_QUERY } from "./lib/motion";
