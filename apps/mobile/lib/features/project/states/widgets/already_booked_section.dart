import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show FollowType;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../../app/routes.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../../data/follow.dart';
import '../../project_copy.dart';
import '../../widgets/expander.dart';
import '../project_states_copy.dart';

/// "Already booked here?" (every AppProjectStates state): the statutory
/// buyer-rights explainer and the I've-booked toggle (WORK_BREAKDOWN T31b's
/// "If you've already booked here", shared with T20c). These rights hold
/// regardless of the band, so unlike the rest of the page they read the
/// same in every state.
class AlreadyBookedSection extends ConsumerWidget {
  const AlreadyBookedSection({super.key, required this.slug, required this.projectName});

  final String slug;
  final String projectName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final followType = ref.watch(followTypeProvider(slug));
    final booked = followType == FollowType.booked;
    final body = PlinthType.body.copyWith(height: 1.5, color: tokens.ink);

    return Padding(
      padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 0, PlinthLayout.gutterPhone, PlinthSpace.s40),
      child: ProjectExpander(
        title: ProjectCopy.alreadyBooked,
        children: [
          Text(ProjectStatesCopy.alreadyBookedIntro, style: body),
          const SizedBox(height: PlinthSpace.s16),
          _Right(heading: ProjectStatesCopy.moneyBackHeading, body: ProjectStatesCopy.moneyBackBody),
          const SizedBox(height: PlinthSpace.s16),
          _Right(heading: ProjectStatesCopy.buyersTogetherHeading, body: ProjectStatesCopy.buyersTogetherBody),
          const SizedBox(height: PlinthSpace.s20),
          PlinthButton(
            label: booked ? ProjectStatesCopy.bookedHere : ProjectStatesCopy.iveBooked,
            glyph: KitGlyph.bookmark,
            pressed: booked,
            kind: booked ? PlinthButtonKind.primary : PlinthButtonKind.tonal,
            onPressed: () => _toggleBooked(context, ref, booked, followType),
          ),
          if (booked) ...[
            const SizedBox(height: PlinthSpace.s12),
            DecoratedBox(
              decoration: BoxDecoration(color: tokens.chipFillOnTrack, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                child: Text(
                  ProjectStatesCopy.bookedChip,
                  style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(ProjectStatesCopy.bookedNote, style: PlinthType.small.copyWith(color: tokens.ink2, height: 1.4)),
          ],
          const SizedBox(height: PlinthSpace.s20),
          PlinthButton(
            label: ProjectStatesCopy.beforeYouPayCta,
            kind: PlinthButtonKind.tertiary,
            onPressed: () => context.push(Routes.beforePay),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleBooked(BuildContext context, WidgetRef ref, bool booked, String? currentType) async {
    final controller = ref.read(followsProvider.notifier);
    try {
      if (booked) {
        await controller.setType(slug, FollowType.watching);
      } else if (currentType == null) {
        await controller.follow(slug, type: FollowType.booked);
      } else {
        await controller.setType(slug, FollowType.booked);
      }
    } on Exception {
      if (context.mounted) showPlinthToast(context, ProjectStatesCopy.couldNotUpdateBooked);
    }
  }
}

class _Right extends StatelessWidget {
  const _Right({required this.heading, required this.body});

  final String heading;
  final String body;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(heading, style: PlinthType.body.copyWith(fontWeight: FontWeight.w700, color: tokens.ink)),
        const SizedBox(height: 4),
        Text(body, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink2)),
      ],
    );
  }
}
