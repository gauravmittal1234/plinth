import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';
import '../project_format.dart';

/// The page close: the wordmark, the promise line, the disclaimer with its
/// links (once here; the other time is right after the band, G-18), and
/// "data as of" with the model version.
class ProjectFooterSection extends StatelessWidget {
  const ProjectFooterSection({super.key, required this.meta, this.onReportError, this.onHowWeMakeMoney});

  final c.RiskMeta meta;
  final VoidCallback? onReportError;
  final VoidCallback? onHowWeMakeMoney;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ColoredBox(
      color: tokens.bg,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, PlinthSpace.s40, PlinthLayout.gutterPhone, PlinthSpace.s56),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Plinth', style: PlinthType.h2.copyWith(color: tokens.ink)),
            const SizedBox(height: 4),
            Text(meta.promiseLine, style: PlinthType.body.copyWith(color: tokens.ink2)),
            const SizedBox(height: PlinthSpace.s24),
            DisclaimerLine(
              line: meta.disclaimerLine,
              links: [
                KitLink(ProjectCopy.howWeMakeMoney, onHowWeMakeMoney),
                KitLink(ProjectCopy.reportError, onReportError),
              ],
              metaLine: 'Data as of ${formatDisplayDate(meta.dataAsOf)} · model ${meta.modelVersion}',
            ),
          ],
        ),
      ),
    );
  }
}
