import 'package:flutter/material.dart';

import '../../app/artboard_placeholder.dart';
import '../../app/routes.dart';

// Owned by T31a (AppProject); the seven state variants in states/ go to T31b.
// Placeholder from T06.

/// One project phase: hero, risk, what now, built, homes, pay, afford the wait.
///
/// [previewState] is the `?state=` query value: FIXTURES mode previews the
/// AppProjectStates variants with it (WORK_BREAKDOWN §2). In production the
/// state always comes from `RiskSummary.display`.
class ProjectScreen extends StatelessWidget {
  const ProjectScreen({super.key, required this.slug, this.previewState});

  final String slug;
  final String? previewState;

  @override
  Widget build(BuildContext context) {
    final preview = previewState;
    return ArtboardPlaceholder(
      title: 'Project',
      artboard: preview == null ? 'AppProject' : 'AppProjectStates',
      task: preview == null ? 'T31a' : 'T31b',
      milestone: 'M1',
      details: {'slug': slug, 'state': ?preview},
      links: [PlaceholderLink('Delivery risk', Routes.riskOf(slug))],
    );
  }
}
