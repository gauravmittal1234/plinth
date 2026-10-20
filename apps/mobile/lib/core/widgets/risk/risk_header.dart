import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import 'confidence_dots.dart';
import 'risk_meter.dart';
import 'risk_state.dart';

/// How large the band name is set.
enum RiskHeaderScale {
  /// DESIGN §4 item 5: the band name in display 30.
  standard(30),

  /// AppProject's risk section: 46.
  project(46),

  /// AppRisk's poster: the band name is the page, at 80.
  poster(80);

  const RiskHeaderScale(this.fontSize);

  final double fontSize;
}

/// The risk header (M), DESIGN §4 item 5: the 16 × 12 meter, the band name
/// large in its band colour, a caption, and, on its own line, the confidence
/// sentence with its dots (never attached to the band name).
///
/// The meter and name are one heading node for screen readers: "Delivery
/// risk Elevated, step 3 of 5".
class RiskHeader extends StatelessWidget {
  const RiskHeader({
    super.key,
    required this.chip,
    this.caption,
    this.confidence,
    this.confidenceLine,
    this.redFlag = false,
    this.scale = RiskHeaderScale.standard,
  });

  factory RiskHeader.fromSummary(
    c.RiskSummary summary, {
    Key? key,
    String? caption,
    RiskHeaderScale scale = RiskHeaderScale.standard,
  }) => RiskHeader(
    key: key,
    chip: summary.chip,
    caption: caption,
    confidence: summary.confidence?.level,
    confidenceLine: summary.confidence?.line,
    redFlag: summary.band?.setBy == c.BandSetBy.redFlagRule,
    scale: scale,
  );

  /// From the project page's risk (`ProjectPage.risk`).
  factory RiskHeader.fromProjectRisk(
    c.RiskClass risk, {
    Key? key,
    String? caption,
    RiskHeaderScale scale = RiskHeaderScale.standard,
  }) => RiskHeader(
    key: key,
    chip: risk.chip,
    caption: caption,
    confidence: risk.confidence?.level,
    confidenceLine: risk.confidence?.line,
    redFlag: risk.band?.setBy == c.BandSetBy.redFlagRule,
    scale: scale,
  );

  final c.Chip chip;

  /// A quiet line under the name, e.g. "Delivery risk · data as of 14 Oct 2026".
  final String? caption;

  /// `confidence.level` and `confidence.line` from the summary.
  final String? confidence;
  final String? confidenceLine;
  final bool redFlag;
  final RiskHeaderScale scale;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final state = RiskState.ofChip(chip);
    // Non-band labels are sentences ("Not enough history to score · no
    // penalty"): they stay at most 40 so they read as a line, not a poster.
    final size = state.isBand ? scale.fontSize : scale.fontSize.clamp(0, 40).toDouble();
    final name = PlinthType.display.copyWith(
      fontSize: size,
      height: size >= 46 ? 0.94 : 1.04,
      letterSpacing: -(size >= 46 ? 0.045 : 0.02) * size,
      color: state.nameColor(tokens),
    );
    final line = confidenceLine;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Semantics(
          container: true,
          header: true,
          label: riskSemanticsLabel(state, chip.label, redFlag: redFlag),
          excludeSemantics: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              RiskMeter(state: state, size: RiskMeterSize.header),
              const SizedBox(height: PlinthSpace.s12),
              Text(chip.label, style: name),
            ],
          ),
        ),
        if (caption != null) ...[
          const SizedBox(height: PlinthSpace.s8),
          Text(caption!, style: PlinthType.small.copyWith(color: tokens.muted)),
        ],
        if (line != null) ...[const SizedBox(height: PlinthSpace.s16), ConfidenceLine(level: confidence, line: line)],
      ],
    );
  }
}

/// The confidence sentence with its dots in front; the sentence's first
/// clause ("We're less certain about this one.") is set bold, as on AppRisk.
class ConfidenceLine extends StatelessWidget {
  const ConfidenceLine({super.key, required this.line, this.level});

  final String line;
  final String? level;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final style = PlinthType.body.copyWith(color: tokens.ink, height: 1.5);
    final cut = line.indexOf('. ');
    final lead = cut < 0 ? line : line.substring(0, cut + 1);
    final rest = cut < 0 ? '' : line.substring(cut + 1);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (level != null)
          Padding(
            padding: const EdgeInsets.only(top: 8, right: 10),
            child: ConfidenceDots(level: level!, size: 8),
          ),
        Expanded(
          child: Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: lead,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                TextSpan(text: rest),
              ],
            ),
            style: style,
          ),
        ),
      ],
    );
  }
}
