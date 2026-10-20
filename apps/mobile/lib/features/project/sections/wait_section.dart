import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';
import '../project_format.dart';

/// "Can we afford the wait?": the static answer at `wait_defaults`
/// (`ProjectPage.afford_default`). The app has no EMI sliders in M1, so it
/// states its loan assumption instead of offering one (fixpass-buyer.md §2);
/// the interactive calculator arrives with T13's live `api.afford_the_wait`.
class ProjectWaitSection extends StatelessWidget {
  const ProjectWaitSection({super.key, required this.waitDefaults, this.afford});

  final c.WaitDefaults waitDefaults;
  final c.AffordTheWaitClass? afford;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final afford = this.afford;
    if (afford == null) {
      return const SizedBox.shrink();
    }
    return SectionBand(
      question: ProjectCopy.canWeAfford,
      answer: afford.answerLine,
      children: [
        Row(
          children: [
            Expanded(
              child: FactTile(
                label: ProjectCopy.takeHomeLabel,
                value: formatInrExact(waitDefaults.takeHomeInr),
                align: CrossAxisAlignment.start,
              ),
            ),
            Expanded(
              child: FactTile(
                label: ProjectCopy.rentLabel,
                value: formatInrExact(waitDefaults.rentInr),
                align: CrossAxisAlignment.start,
              ),
            ),
          ],
        ),
        const SizedBox(height: PlinthSpace.s8),
        Text(ProjectCopy.loanAssumptionLabel, style: PlinthType.small.copyWith(color: tokens.muted)),
        const SizedBox(height: PlinthSpace.s24),
        Row(
          children: [
            Expanded(
              child: FactTile(
                label: ProjectCopy.nowLabel,
                value: '₹${_short(afford.now.monthlyInr)}',
                valueColor: tokens.ink,
              ),
            ),
            Expanded(
              child: FactTile(
                label: afford.byCompletion.label,
                value: '₹${_short(afford.byCompletion.monthlyInr)}',
                valueColor: tokens.ink,
              ),
            ),
            Expanded(
              child: FactTile(
                label: ProjectCopy.afterKeysLabel,
                value: '₹${_short(afford.afterKeys.emiInr)}',
                valueColor: tokens.accentText,
              ),
            ),
          ],
        ),
        const SizedBox(height: PlinthSpace.s20),
        if (afford.frequencyLine != null)
          Text(afford.frequencyLine!, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
        const SizedBox(height: PlinthSpace.s16),
        Text(afford.assumptions.join(' '), style: PlinthType.small.copyWith(color: tokens.ink2, height: 1.4)),
        const SizedBox(height: PlinthSpace.s8),
        Text(afford.framingLine, style: PlinthType.small.copyWith(color: tokens.muted)),
        const SizedBox(height: PlinthSpace.s24),
        PlinthButton(label: ProjectCopy.checkBeforeYouPay, kind: PlinthButtonKind.inverse, onPressed: null),
        const SizedBox(height: PlinthSpace.s8),
        Text(ProjectCopy.neverMovesMoney, style: PlinthType.small.copyWith(color: tokens.muted)),
      ],
    );
  }

  static String _short(int inr) =>
      inr >= 100000 ? '${(inr / 100000).toStringAsFixed(1)} L' : formatInrExact(inr).substring(1);
}
