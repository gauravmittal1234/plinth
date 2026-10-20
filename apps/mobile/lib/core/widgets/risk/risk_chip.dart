import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../foundation/glyphs.dart';
import 'confidence_dots.dart';
import 'risk_meter.dart';
import 'risk_state.dart';

/// The risk chip (S), identical on every surface (DESIGN §0, §4 item 4):
/// borderless, the band fill on a pill, a mini 5-segment meter, a flag when a
/// red-flag rule sets the band, the server's label, and the confidence dots.
/// Limited history, Not scored and a withheld band sit on `track`.
///
/// One screen-reader node: "Delivery risk Elevated, step 3 of 5, low
/// confidence". At large text sizes the label wraps inside the pill.
class RiskChip extends StatelessWidget {
  const RiskChip({super.key, required this.chip, this.confidence, this.redFlag = false, this.fillFrom});

  /// From a risk summary: its chip, confidence and how the band was set.
  factory RiskChip.fromSummary(c.RiskSummary summary, {Key? key, int? fillFrom}) => RiskChip(
    key: key,
    chip: summary.chip,
    confidence: summary.confidence?.level,
    redFlag: summary.band?.setBy == c.BandSetBy.redFlagRule,
    fillFrom: fillFrom,
  );

  /// From the project page's risk (`ProjectPage.risk`).
  factory RiskChip.fromProjectRisk(c.RiskClass risk, {Key? key, int? fillFrom}) => RiskChip(
    key: key,
    chip: risk.chip,
    confidence: risk.confidence?.level,
    redFlag: risk.band?.setBy == c.BandSetBy.redFlagRule,
    fillFrom: fillFrom,
  );

  /// The contract chip (`RiskSummary.chip`, `ProjectCard.chip`).
  final c.Chip chip;

  /// `confidence.level` ("high" or "low"); no dots when null.
  final String? confidence;

  /// The band is set by a published red-flag rule, not the model.
  final bool redFlag;

  /// Animates the meter from this many segments (see [RiskMeter.fillFrom]).
  final int? fillFrom;

  RiskState get state => RiskState.ofChip(chip);

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final s = state;
    const gap = PlinthComponents.chipGap;
    const labelSize = PlinthComponents.chipLabelSize;
    final text = TextStyle(
      fontFamily: PlinthType.textFamily,
      fontFamilyFallback: PlinthType.textFallback,
      fontSize: labelSize,
      fontWeight: PlinthComponents.chipLabelWeight,
      height: 1,
      leadingDistribution: TextLeadingDistribution.even,
      color: s.chipText(tokens),
      fontFeatures: PlinthType.numerals,
    );
    const vertical = (PlinthComponents.chipHeight - labelSize) / 2;
    return Semantics(
      container: true,
      label: riskSemanticsLabel(s, chip.label, confidence: confidence, redFlag: redFlag),
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: s.chipFill(tokens),
          borderRadius: BorderRadius.circular(PlinthComponents.chipHeight / 2),
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(
            PlinthComponents.chipPaddingStart,
            vertical,
            PlinthComponents.chipPaddingEnd,
            vertical,
          ),
          child: Text.rich(
            TextSpan(
              children: [
                WidgetSpan(
                  alignment: PlaceholderAlignment.middle,
                  child: RiskMeter(state: s, fillFrom: fillFrom),
                ),
                const WidgetSpan(child: SizedBox(width: gap)),
                if (redFlag) ...[
                  WidgetSpan(
                    alignment: PlaceholderAlignment.middle,
                    child: KitIcon(KitGlyph.flag, size: 14, color: tokens.ink),
                  ),
                  const WidgetSpan(child: SizedBox(width: gap - 2)),
                ],
                TextSpan(text: chip.label),
                if (confidence != null) ...[
                  const WidgetSpan(child: SizedBox(width: gap)),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.middle,
                    child: ConfidenceDots(level: confidence!),
                  ),
                ],
              ],
            ),
            style: text,
          ),
        ),
      ),
    );
  }
}
