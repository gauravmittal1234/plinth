import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/search.dart';
import '../../explore/project_card_tile.dart';
import '../onboarding_controller.dart';
import '../onboarding_format.dart';
import '../onboarding_copy.dart';

/// "The card builds": a live risk card the buyer can flip between a few real
/// covered projects, before they've signed in to anything. The artboard
/// hand-picks three of its own fixture projects for this (Aurelia Heights,
/// Kestrel Park, Coral Towers) to show the layout; this build reads the real
/// `api.search_projects` list instead; a fixture or coverage change never
/// leaves it naming a project that doesn't exist (AGENTS.md rule 10).
class WelcomeStep extends ConsumerWidget {
  const WelcomeStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final results = ref.watch(searchProvider(const SearchQuery()));
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        PlinthLayout.gutterApp,
        PlinthSpace.s12,
        PlinthLayout.gutterApp,
        PlinthSpace.s24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(OnboardingCopy.welcomeHeadline, style: PlinthType.display.copyWith(fontSize: 40, color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s12),
          Text(OnboardingCopy.welcomeBody, style: PlinthType.lead.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s16),
          switch (results) {
            AsyncData(value: final v) when v.items.isNotEmpty => _Cards(
              items: v.items.take(3).toList(),
              dataAsOf: v.meta?.dataAsOf,
            ),
            AsyncError() => Text(
              'Could not load a project to show here yet.',
              style: PlinthType.body.copyWith(color: tokens.ink2),
            ),
            _ => const Padding(
              padding: EdgeInsets.symmetric(vertical: PlinthSpace.s32),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
          },
        ],
      ),
    );
  }
}

class _Cards extends ConsumerWidget {
  const _Cards({required this.items, required this.dataAsOf});

  final List<ProjectCard> items;
  final String? dataAsOf;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final picked = ref.watch(onboardingControllerProvider.select((s) => s.tryProjectSlug));
    final current = items.firstWhere((c) => c.slug == picked, orElse: () => items.first);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (items.length > 1)
          PlinthChipRow(
            children: [
              for (final item in items)
                _TryTab(
                  name: item.name,
                  on: item.slug == current.slug,
                  onTap: () => ref.read(onboardingControllerProvider.notifier).pickTryProject(item.slug),
                ),
            ],
          ),
        if (items.length > 1) const SizedBox(height: PlinthSpace.s12),
        ProjectCardTile(key: ValueKey(current.slug), card: current),
        const SizedBox(height: PlinthSpace.s12),
        Text(
          dataAsOf == null
              ? OnboardingCopy.welcomeDisclaimer
              : '${OnboardingCopy.welcomeDisclaimer} ${OnboardingCopy.welcomeDataAsOf(formatDisplayDate(dataAsOf!))}',
          style: PlinthType.caption.copyWith(color: tokens.ink2),
        ),
      ],
    );
  }
}

class _TryTab extends StatelessWidget {
  const _TryTab({required this.name, required this.on, required this.onTap});

  final String name;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Semantics(
      button: true,
      selected: on,
      label: name,
      excludeSemantics: true,
      onTap: onTap,
      child: Pressable(
        child: Material(
          color: on ? tokens.inverse : tokens.track,
          borderRadius: BorderRadius.circular(PlinthRadius.pill),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Text(name, style: PlinthType.label.copyWith(color: on ? tokens.onInverse : tokens.ink)),
            ),
          ),
        ),
      ),
    );
  }
}
