import 'package:flutter/widgets.dart';

import 'project_content.dart';
import 'states/project_states_screen.dart';

/// One project phase: hero, risk, so what now, before booking, built, homes,
/// pay, afford the wait and furnish (WORK_BREAKDOWN T31a).
///
/// [previewState] is the `?state=` query value: FIXTURES mode previews the
/// AppProjectStates variants with it (T31b). In production the state always
/// comes from `RiskSummary.display`.
class ProjectScreen extends StatelessWidget {
  const ProjectScreen({super.key, required this.slug, this.previewState});

  final String slug;
  final String? previewState;

  @override
  Widget build(BuildContext context) {
    final preview = previewState;
    if (preview != null) return ProjectStatesScreen(slug: slug, state: preview);
    return ProjectContent(slug: slug);
  }
}
