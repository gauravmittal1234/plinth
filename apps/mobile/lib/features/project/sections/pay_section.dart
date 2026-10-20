import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';

/// "What will I really pay?": the static cost breakdown from the
/// developer's cost sheet (`ProjectPage.cost`), T32/T13's live calculator
/// arrives after M1.
class ProjectPaySection extends StatelessWidget {
  const ProjectPaySection({super.key, this.cost});

  final c.CostBreakdownClass? cost;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final breakdown = cost;
    if (breakdown == null) {
      return SectionBand(
        question: ProjectCopy.whatWillIPay,
        answer: 'Not on a cost sheet yet. Ask for it in writing.',
        tone: BandTone.track,
      );
    }
    return SectionBand(
      question: ProjectCopy.whatWillIPay,
      answer: breakdown.basisLine,
      tone: BandTone.track,
      children: [
        Text(
          breakdown.allInLabel,
          style: PlinthType.display.copyWith(fontSize: 40, letterSpacing: -0.03 * 40, color: tokens.ink),
        ),
        if (breakdown.perSqftCarpetLabel != null) ...[
          const SizedBox(height: 4),
          Text(
            '${ProjectCopy.payAllIn} · ${breakdown.perSqftCarpetLabel}',
            style: PlinthType.small.copyWith(color: tokens.muted),
          ),
        ],
        const SizedBox(height: PlinthSpace.s24),
        CostTable.fromProjectCost(breakdown),
        if (breakdown.areaLine != null || breakdown.negotiableLine != null) ...[
          const SizedBox(height: PlinthSpace.s16),
          Text(
            [breakdown.areaLine, breakdown.negotiableLine].whereType<String>().join(' '),
            style: PlinthType.small.copyWith(color: tokens.ink2, height: 1.4),
          ),
        ],
      ],
    );
  }
}
