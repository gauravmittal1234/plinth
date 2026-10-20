import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/kit_copy.dart';

/// How a 5-segment meter is drawn for a [RiskState] (DESIGN §3.2).
enum RiskMeterMode {
  /// A band: the first `step` segments in band ink, the rest empty.
  filled,

  /// Limited history: five dashed segments in the Limited ink.
  dashed,

  /// Not scored: five outlined segments in the Not-scored ink.
  outlined,

  /// Band withheld (facts only): five quiet outlines.
  withheld,
}

/// What a risk instrument shows: one of the five bands, or a non-band state.
///
/// Read it from the contract with [RiskState.ofChip] (`RiskSummary.chip`,
/// `ProjectCard.chip`), never from a label: labels are server copy.
enum RiskState {
  low(PlinthRiskKey.low),
  moderate(PlinthRiskKey.moderate),
  elevated(PlinthRiskKey.elevated),
  high(PlinthRiskKey.high),
  severe(PlinthRiskKey.severe),
  limited(PlinthRiskKey.limited),
  notScored(PlinthRiskKey.notScored),

  /// The developer group's band is withheld; the page shows facts only.
  withheld(PlinthRiskKey.notScored);

  const RiskState(this.key);

  /// The token key whose colours this state uses.
  final PlinthRiskKey key;

  /// The five bands, lowest first.
  static const bands = [low, moderate, elevated, high, severe];

  /// The state of a contract chip. A chip kind added later reads as
  /// [notScored], so an older app never shows a band it can't name.
  static RiskState ofChip(c.Chip chip) => switch (chip.kind) {
    c.ChipKind.band => ofStep(chip.step) ?? notScored,
    c.ChipKind.limitedHistory => limited,
    c.ChipKind.withheld => withheld,
    _ => notScored,
  };

  /// The band at meter [step] (1–5), or null.
  static RiskState? ofStep(int? step) => (step != null && step >= 1 && step <= 5) ? bands[step - 1] : null;

  /// The band for a `core.band` code ("elevated"), or null.
  static RiskState? ofBandCode(String? code) => switch (code) {
    c.BandCode.low => low,
    c.BandCode.moderate => moderate,
    c.BandCode.elevated => elevated,
    c.BandCode.high => high,
    c.BandCode.severe => severe,
    _ => null,
  };

  /// True for the five bands.
  bool get isBand => index <= RiskState.severe.index;

  /// Meter step 1–5 for a band, 0 otherwise.
  int get step => isBand ? index + 1 : 0;

  RiskMeterMode get meterMode => switch (this) {
    limited => RiskMeterMode.dashed,
    notScored => RiskMeterMode.outlined,
    withheld => RiskMeterMode.withheld,
    _ => RiskMeterMode.filled,
  };

  /// This state's band colours in [tokens].
  PlinthBandColors colors(PlinthTokens tokens) => tokens.risk.of(key);

  /// The chip and panel ground: the band fill, or `track` for the non-band
  /// states (DESIGN §0: Limited history sits on `t.track`).
  Color chipFill(PlinthTokens tokens) => isBand ? colors(tokens).fill : tokens.track;

  /// The label colour inside a chip: ink on a band fill, ink2 otherwise.
  Color chipText(PlinthTokens tokens) => isBand ? tokens.ink : tokens.ink2;

  /// The band name set large in colour (Low and Moderate use ink on Day).
  Color nameColor(PlinthTokens tokens) => isBand ? colors(tokens).text : tokens.ink2;
}

/// Screen-reader text for a risk chip or header: "Delivery risk Elevated,
/// step 3 of 5", plus the confidence and the red-flag rule when given.
///
/// [label] is the server's chip label; a " · " in it is read as a pause.
String riskSemanticsLabel(RiskState state, String label, {String? confidence, bool redFlag = false}) {
  final parts = <String>[
    '${KitCopy.deliveryRisk} ${label.replaceAll(' · ', ', ')}',
    if (state.isBand) KitCopy.stepOf(state.step),
    if (confidence == c.ConfidenceLevel.low) KitCopy.lowConfidence,
    if (confidence == c.ConfidenceLevel.high) KitCopy.highConfidence,
    if (redFlag) KitCopy.setByRule,
  ];
  return parts.join(', ');
}
