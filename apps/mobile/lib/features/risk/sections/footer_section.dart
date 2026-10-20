import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../risk_copy.dart';
import '../risk_format.dart';

/// The page close (AppRisk, as AppProject's footer, G-18): the wordmark, the
/// promise line, the disclaimer with its links, and "data as of" with the
/// model version.
class RiskFooterSection extends StatelessWidget {
  const RiskFooterSection({super.key, required this.meta});

  final c.RiskMeta meta;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ColoredBox(
      color: tokens.bg,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          PlinthLayout.gutterPhone,
          PlinthSpace.s40,
          PlinthLayout.gutterPhone,
          PlinthSpace.s56,
        ),
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
                // `methodology_url` is an in-app path ("/methodology"); no
                // screen owns that route yet, so this link is unwired, as
                // AppProject's footer leaves "How we make money" (T31a).
                const KitLink(RiskCopy.howWeMakeMoney, null),
              ],
              metaLine: RiskCopy.dataAsOf(formatDisplayDate(meta.dataAsOf), meta.modelVersion),
            ),
          ],
        ),
      ),
    );
  }
}
