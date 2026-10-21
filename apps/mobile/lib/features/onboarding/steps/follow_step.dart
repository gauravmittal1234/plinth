import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/follow.dart';
import '../../../data/search.dart';
import '../onboarding_controller.dart';
import '../onboarding_copy.dart';

/// "Follow your first project" — a real search (`api.search_projects`), the
/// same list and order Explore uses: "Order never follows money" holds here
/// too, so this shows the server's own `sort_line` rather than the
/// artboard's "Listed by distance from your corridor" (a line this build has
/// no corridor-distance sort to back, AGENTS.md rule 10).
class FollowStep extends ConsumerStatefulWidget {
  const FollowStep({super.key});

  @override
  ConsumerState<FollowStep> createState() => _FollowStepState();
}

class _FollowStepState extends ConsumerState<FollowStep> {
  late final TextEditingController _query = TextEditingController(
    text: ref.read(onboardingControllerProvider).searchQuery,
  );

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final query = ref.watch(onboardingControllerProvider.select((s) => s.searchQuery));
    final results = ref.watch(searchProvider(SearchQuery(q: query)));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterApp, PlinthSpace.s12, PlinthLayout.gutterApp, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(OnboardingCopy.followHeadline, style: PlinthType.title.copyWith(color: tokens.ink)),
              const SizedBox(height: PlinthSpace.s8),
              Text(OnboardingCopy.followBody, style: PlinthType.lead.copyWith(color: tokens.ink)),
              const SizedBox(height: PlinthSpace.s16),
              PlinthSearchField(
                controller: _query,
                hint: OnboardingCopy.searchHint,
                onChanged: (q) => ref.read(onboardingControllerProvider.notifier).setSearchQuery(q),
              ),
              const SizedBox(height: PlinthSpace.s16),
            ],
          ),
        ),
        switch (results) {
          AsyncData(value: final v) when v.items.isEmpty => Padding(
            padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
            child: Text(OnboardingCopy.noMatch(query), style: PlinthType.body.copyWith(color: tokens.ink)),
          ),
          AsyncData(value: final v) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
            child: Column(
              children: [
                for (final item in v.items) _FollowRow(card: item),
                const SizedBox(height: PlinthSpace.s8),
                Text(v.sortLine, style: PlinthType.caption.copyWith(color: tokens.ink2)),
              ],
            ),
          ),
          AsyncError() => Padding(
            padding: const EdgeInsets.symmetric(horizontal: PlinthLayout.gutterApp),
            child: Text(
              'Could not load projects to follow right now.',
              style: PlinthType.body.copyWith(color: tokens.ink2),
            ),
          ),
          _ => const Padding(
            padding: EdgeInsets.symmetric(vertical: PlinthSpace.s32),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
        },
        const SizedBox(height: PlinthSpace.s24),
      ],
    );
  }
}

class _FollowRow extends ConsumerWidget {
  const _FollowRow({required this.card});

  final ProjectCard card;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final followed = ref.watch(followTypeProvider(card.slug)) != null;
    return Padding(
      padding: const EdgeInsets.only(bottom: PlinthSpace.s8),
      child: PlinthListRow(
        leading: ProjectThumb(imageUrl: card.imageUrl),
        title: card.name,
        subtitle: '${card.chip.label} · ${card.priceLine}',
        trailing: PlinthButton(
          kind: PlinthButtonKind.tonal,
          compact: true,
          pressed: followed,
          label: followed ? OnboardingCopy.following : OnboardingCopy.follow,
          onPressed: () => _toggle(context, ref, followed),
        ),
      ),
    );
  }

  Future<void> _toggle(BuildContext context, WidgetRef ref, bool followed) async {
    final controller = ref.read(followsProvider.notifier);
    if (followed) {
      await controller.unfollow(card.slug);
      if (context.mounted) showPlinthToast(context, '${OnboardingCopy.unfollowedToast} ${card.name}');
      return;
    }
    try {
      await controller.follow(card.slug);
      if (context.mounted) showPlinthToast(context, '${OnboardingCopy.followedToast} ${card.name}');
    } on Exception {
      if (context.mounted) showPlinthToast(context, OnboardingCopy.followFailed);
    }
  }
}
