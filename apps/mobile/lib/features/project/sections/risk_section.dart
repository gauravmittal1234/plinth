import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/evidence.dart';
import '../../../data/trust.dart';
import '../project_copy.dart';
import '../widgets/expander.dart';

/// "Will it be delivered on time?" (AppProject's risk answer): the header,
/// the band-since trend, the dial/100-projects instrument, "the OC is not
/// the keys", a pending fact, and the reasons behind the band (collapsed).
class ProjectRiskSection extends ConsumerStatefulWidget {
  const ProjectRiskSection({super.key, required this.slug, required this.risk, this.bandSinceLine});

  final String slug;
  final c.RiskClass risk;

  /// `ProjectPage.progress.today.band_since_line` ("Elevated since 2 Oct
  /// 2026"): `RiskClass.progress` carries no replay, so the caller passes it
  /// in from `ProjectPage.progress`.
  final String? bandSinceLine;

  @override
  ConsumerState<ProjectRiskSection> createState() => _ProjectRiskSectionState();
}

class _ProjectRiskSectionState extends ConsumerState<ProjectRiskSection> {
  bool _dial = true;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final risk = widget.risk;
    final state = RiskState.ofChip(risk.chip);
    final bands = ref.watch(bandsProvider).value;
    final labels = bands == null ? null : [for (final b in bands) b.label];
    final frequency = risk.frequency;
    final sinceLine = widget.bandSinceLine;

    return SectionBand(
      question: ProjectCopy.willItBeOnTime,
      answer: risk.late12.line,
      children: [
        RiskHeader.fromProjectRisk(risk, scale: RiskHeaderScale.project),
        if (sinceLine != null) ...[
          const SizedBox(height: PlinthSpace.s8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2, right: 6),
                child: KitIcon(KitGlyph.trend, size: 16, color: tokens.muted),
              ),
              Expanded(
                child: Text(sinceLine, style: PlinthType.small.copyWith(color: tokens.muted)),
              ),
            ],
          ),
        ],
        if (frequency != null && labels != null) ...[
          const SizedBox(height: PlinthSpace.s24),
          Text(frequency.sentence, style: PlinthType.lead.copyWith(height: 1.5, color: tokens.ink)),
          const SizedBox(height: 4),
          Text(frequency.referenceClassLine, style: PlinthType.small.copyWith(color: tokens.muted)),
          const SizedBox(height: PlinthSpace.s16),
          PlinthSegmented<bool>(
            semanticLabel: 'Risk view',
            value: _dial,
            options: [SegmentOption(true, ProjectCopy.dial), SegmentOption(false, ProjectCopy.of100Projects)],
            onChanged: (v) => setState(() => _dial = v),
          ),
          const SizedBox(height: PlinthSpace.s20),
          Center(
            child: _dial
                ? Riskometer(state: state, labels: labels, sweep: false)
                : _IconArrayBlock(state: state, chip: risk.chip, frequency: frequency),
          ),
        ],
        const SizedBox(height: PlinthSpace.s24),
        Text(risk.late12.ocNotKeysLine, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
        if (risk.pending.isNotEmpty) ...[
          const SizedBox(height: PlinthSpace.s20),
          PendingFactNote(fact: risk.pending.first),
        ],
        const SizedBox(height: PlinthSpace.s24),
        ProjectExpander(
          title: '${ProjectCopy.whyBand} ${risk.chip.label}?',
          subtitle: risk.reasons.isEmpty ? null : ProjectCopy.seeReasons,
          children: [
            ReasonList(reasons: risk.reasons, onSource: (reason, source) => _openEvidence(context, source)),
            if (risk.whatWouldChange != null) ...[
              const SizedBox(height: PlinthSpace.s20),
              Text(risk.whatWouldChange!, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink2)),
            ],
            if (risk.developerResponse != null) ...[
              const SizedBox(height: PlinthSpace.s20),
              DeveloperSaysField(
                label: risk.developerResponse!.line,
                text: risk.developerResponse!.text,
                compact: true,
              ),
            ],
          ],
        ),
        const SizedBox(height: PlinthSpace.s24),
        DisclaimerLine(line: risk.meta.disclaimerLine),
      ],
    );
  }

  Future<void> _openEvidence(BuildContext context, c.SourceRef source) async {
    final factId = source.factIds.isEmpty ? null : source.factIds.first;
    if (factId == null) return;
    final evidence = await ref.read(evidenceProvider(EvidenceRef(factId, slug: widget.slug)).future);
    if (!context.mounted) return;
    await showEvidenceSheet(context, evidence: evidence);
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
