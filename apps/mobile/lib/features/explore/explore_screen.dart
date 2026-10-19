import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';
import '../../app/routes.dart';

// Owned by T30 (AppExplore). Placeholder from T06.

/// Tab 1: search, corridor chips and project cards, all-in price first.
class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Explore',
      artboard: 'AppExplore',
      task: 'T30',
      milestone: 'M1',
      links: [
        const PlaceholderLink('Map', Routes.map),
        PlaceholderLink('Aurelia Heights, Phase 2', Routes.projectOf('aurelia-heights-phase-2')),
        PlaceholderLink('Kestrel Park', Routes.projectOf('kestrel-park')),
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
