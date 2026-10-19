import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/artboard_placeholder.dart';
import '../../app/routes.dart';
import 'seeded_phases.dart';

// Owned by T30 (AppExplore). Placeholder from T06; the M0 gate (T07) lists the
// seeded phases from the fixture search (seeded_phases.dart).

/// Tab 1: search, corridor chips and project cards, all-in price first.
class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phases = ref.watch(seededPhasesProvider).value ?? const [];
    return ArtboardPlaceholder(
      title: 'Explore',
      artboard: 'AppExplore',
      task: 'T30',
      milestone: 'M1',
      links: [
        const PlaceholderLink('Map', Routes.map),
        // The seeded phases, in the fixture search's order (lowest delivery risk
        // first); the note is the card's chip label, as the fixture has it.
        for (final p in phases) PlaceholderLink(p.name, Routes.projectOf(p.slug), note: p.chip.label),
        const PlaceholderLink('Scan RERA QR', Routes.scan),
        const PlaceholderLink('First run', Routes.welcome),
        const PlaceholderLink('Check claims', Routes.claims),
        const PlaceholderLink('Check a cost sheet', Routes.costSheet),
        const PlaceholderLink('Before you pay', Routes.beforePay),
        const PlaceholderLink('Pay as built', Routes.payAsBuilt),
        const PlaceholderLink('Picture it furnished', Routes.visualise),
      ],
    );
  }
}
