import 'package:flutter/material.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';

/// "What would it look like furnished?": a link out to AppVisualise (M5);
/// this page only carries the entry point, per WORK_BREAKDOWN T31a.
class ProjectFurnishSection extends StatelessWidget {
  const ProjectFurnishSection({super.key, required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    return SectionBand(
      question: ProjectCopy.furnishHeading,
      answer: ProjectCopy.furnishBody,
      children: [PlinthButton(label: ProjectCopy.tryOnYourRoom, kind: PlinthButtonKind.tonal, onPressed: onOpen)],
    );
  }
}
