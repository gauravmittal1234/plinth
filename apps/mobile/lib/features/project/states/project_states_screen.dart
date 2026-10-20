import 'package:flutter/material.dart';

import '../../../app/artboard_placeholder.dart';

// Stub from T31a; owned by T31b (WORK_BREAKDOWN T31b, OWNERSHIP.md). Fills the
// 7 design-state variants: Severe, Stalled, Limited history, Not scored,
// Stale, Re-scoring, Facts-only (product/design/artboards/AppProjectStates.dc.html).

/// `AppProjectStates`: the same route as [ProjectScreen], previewed in
/// FIXTURES mode with `?state=` (WORK_BREAKDOWN §2). Production state always
/// comes from `RiskSummary.display`, so this screen is never reached outside
/// fixtures/dev review.
class ProjectStatesScreen extends StatelessWidget {
  const ProjectStatesScreen({super.key, required this.slug, required this.state});

  final String slug;
  final String state;

  @override
  Widget build(BuildContext context) {
    return ArtboardPlaceholder(
      title: 'Project states',
      artboard: 'AppProjectStates',
      task: 'T31b',
      milestone: 'M1',
      details: {'slug': slug, 'state': state},
    );
  }
}
