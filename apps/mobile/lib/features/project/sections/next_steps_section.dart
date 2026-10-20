import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../app/routes.dart';
import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';

/// "So what do we do now?": 2–4 steps per band, the Gurugram base rate for
/// scale, and lower-band projects in the same corridor (`next_steps`). We
/// never say buy or don't buy (`NextSteps` docs).
class ProjectNextStepsSection extends StatelessWidget {
  const ProjectNextStepsSection({super.key, required this.nextSteps});

  final c.NextSteps nextSteps;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final nearby = nextSteps.lowerBandNearby;
    return SectionBand(
      question: ProjectCopy.soWhatNow,
      answer: nextSteps.introLine,
      tone: BandTone.track,
      children: [
        for (final (i, step) in nextSteps.steps.indexed) ...[
          if (i > 0) const SizedBox(height: PlinthSpace.s20),
          _Step(step: step),
        ],
        if (nextSteps.baseRateLine != null) ...[
          const SizedBox(height: PlinthSpace.s24),
          Text(nextSteps.baseRateLine!, style: PlinthType.small.copyWith(color: tokens.ink2, height: 1.4)),
        ],
        if (nearby.isNotEmpty) ...[
          const SizedBox(height: PlinthSpace.s24),
          Text(ProjectCopy.forScale, style: PlinthType.h3.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s12),
          for (final (i, p) in nearby.indexed) ...[
            if (i > 0) const SizedBox(height: PlinthSpace.s12),
            _Nearby(project: p),
          ],
          if (nextSteps.ruleLine != null) ...[
            const SizedBox(height: PlinthSpace.s8),
            Text(nextSteps.ruleLine!, style: PlinthType.small.copyWith(color: tokens.muted)),
          ],
        ],
      ],
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.step});

  final c.NextStep step;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return MergeSemantics(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(step.heading, style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink)),
          const SizedBox(height: 4),
          Text(step.body, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
        ],
      ),
    );
  }
}

class _Nearby extends StatelessWidget {
  const _Nearby({required this.project});

  final c.NearbyProject project;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final label = '${project.name ?? project.slug}, ${project.chip.label}, ${project.priceLine}';
    return Semantics(
      container: true,
      button: true,
      label: label,
      excludeSemantics: true,
      onTap: () => context.push(Routes.projectOf(project.slug)),
      child: Pressable(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => context.push(Routes.projectOf(project.slug)),
          child: DecoratedBox(
            decoration: BoxDecoration(color: tokens.bgSolid, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          project.name ?? project.slug,
                          style: PlinthType.body.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
                        ),
                        const SizedBox(height: 2),
                        Text(project.priceLine, style: PlinthType.small.copyWith(color: tokens.muted)),
                      ],
                    ),
                  ),
                  const SizedBox(width: PlinthSpace.s12),
                  RiskChip(chip: project.chip),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
