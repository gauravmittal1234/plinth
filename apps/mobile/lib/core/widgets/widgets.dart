/// Plinth's app widget kit (WORK_BREAKDOWN T15): the Flutter side of the
/// web's `packages/web-ui` (T14), built from DESIGN.md §0, §3–§4c and the
/// phone artboards. Screens import this one file.
///
/// - Every colour comes from `PlinthTokens.of(context)`; no hex in widgets.
/// - Widgets take contract models (`plinth_contracts`) or plain strings from
///   them; risk copy is never composed here. Layout copy defaults live in
///   [KitCopy] and can be overridden.
/// - Every instrument has a screen-reader label, wraps at 200% text and
///   shows its end state under reduced motion.
/// - App UI v2 (product/design/review/benchmark-thapki.md): Figtree text,
///   Material *rounded* icons only, buttons whose labels never wrap, 56 dp
///   search field, scrolling chip rows, segmented controls, list rows and
///   cards with icon tiles and thumbnails, and the sheet pattern.
library;

export 'android/bottom_action_bar.dart';
export 'android/peek_sheet.dart' show PeekSheet, PeekSheetState;
export 'data/cost_table.dart';
export 'data/fact_tile.dart';
export 'data/replay_slider.dart';
export 'data/tower_stack.dart' show TowerStack;
export 'evidence/claim_fields.dart';
export 'evidence/disclaimer_line.dart';
export 'evidence/evidence_sheet.dart';
export 'evidence/reason_list.dart';
export 'evidence/source_chip.dart';
export 'foundation/glyphs.dart' show KitGlyph, KitIcon;
export 'foundation/kit_copy.dart';
export 'foundation/motion.dart';
export 'media/project_image.dart';
export 'primitives/buttons.dart';
export 'primitives/pills.dart';
export 'primitives/rows.dart';
export 'primitives/search_field.dart';
export 'primitives/section_band.dart';
export 'primitives/sheet.dart';
export 'primitives/toast.dart';
export 'risk/band_scale.dart';
export 'risk/confidence_dots.dart';
export 'risk/risk_chip.dart';
export 'risk/risk_header.dart';
export 'risk/risk_icon_array.dart' show IconArrayCellKind, RiskIconArray, RiskIconArrayLegend;
export 'risk/risk_meter.dart' show RiskMeter, RiskMeterSize;
export 'risk/risk_state.dart';
export 'risk/riskometer.dart' show Riskometer;
