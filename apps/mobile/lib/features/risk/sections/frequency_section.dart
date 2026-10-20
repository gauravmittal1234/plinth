import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/trust.dart';
import '../risk_copy.dart';

/// "How often are projects like this late?" (AppRisk, DESIGN §4b): the band
/// instrument — the dial, or 100 projects as an icon array — behind a
/// segmented toggle, then the natural-frequency sentence, the reference
/// class and what "more than 12 months late" means for this phase.
///
/// Renders nothing when there is no frequency to show (a red-flag band,
/// Limited history, Not scored or a withheld band): [c.RiskClass.frequency]
/// is null exactly then (API_CONTRACTS §2).
class RiskFrequencySection extends ConsumerStatefulWidget {
  const RiskFrequencySection({super.key, required this.risk});

  final c.RiskClass risk;

  @override
  ConsumerState<RiskFrequencySection> createState() => _RiskFrequencySectionState();
}

class _RiskFrequencySectionState extends ConsumerState<RiskFrequencySection> {
  bool _dial = true;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final risk = widget.risk;
    final frequency = risk.frequency;
    final state = RiskState.ofChip(risk.chip);
    final bands = ref.watch(bandsProvider).value;
    final labels = bands == null ? null : [for (final b in bands) b.label];

    return SectionBand(
      question: RiskCopy.howOftenLate,
      answer: frequency?.sentence,
      tone: BandTone.track,
      children: [
        if (frequency != null && labels != null) ...[
          Text(frequency.referenceClassLine, style: PlinthType.small.copyWith(color: tokens.muted)),
          const SizedBox(height: PlinthSpace.s16),
          PlinthSegmented<bool>(
            semanticLabel: RiskCopy.riskView,
            value: _dial,
            options: [SegmentOption(true, RiskCopy.dial), SegmentOption(false, RiskCopy.of100Projects)],
            onChanged: (v) => setState(() => _dial = v),
          ),
          const SizedBox(height: PlinthSpace.s20),
          Center(
            child: _dial
                ? Riskometer(state: state, labels: labels, sweep: false)
                : _IconArrayBlock(state: state, chip: risk.chip, frequency: frequency),
          ),
          const SizedBox(height: PlinthSpace.s24),
        ],
        Text(risk.late12.line, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s12),
        Text(risk.late12.ocNotKeysLine, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink2)),
      ],
    );
  }
}

class _IconArrayBlock extends StatelessWidget {
  const _IconArrayBlock({required this.state, required this.chip, required this.frequency});

  final RiskState state;
  final c.Chip chip;
  final c.Frequency frequency;

  @override
  Widget build(BuildContext context) {
    final array = RiskIconArray.fromFrequency(chip, frequency)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        array,
        const SizedBox(height: PlinthSpace.s16),
        RiskIconArrayLegend(state: state, hatchedText: frequency.hatchLegend),
      ],
    );
  }
}
