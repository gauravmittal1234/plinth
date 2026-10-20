import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/evidence.dart';
import '../risk_copy.dart';

/// "Why {band}?" (AppRisk's signature move): the band's reasons, strongest
/// first, each a line in a public record with a source chip into the
/// evidence sheet; then what would change the band, the developer's reply
/// and the one public fact that may still move it.
class RiskReasonsSection extends ConsumerWidget {
  const RiskReasonsSection({super.key, required this.slug, required this.risk});

  final String slug;
  final c.RiskClass risk;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    return SectionBand(
      question: RiskCopy.whyBand(risk.chip.label),
      answer: risk.reasons.isEmpty ? null : RiskCopy.reasonsIntro,
      children: [
        ReasonList(reasons: risk.reasons, onSource: (reason, source) => _openEvidence(context, ref, source)),
        if (risk.whatWouldChange != null) ...[
          const SizedBox(height: PlinthSpace.s24),
          Text(RiskCopy.whatWouldChangeHeading, style: PlinthType.h3.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s8),
          Text(risk.whatWouldChange!, style: PlinthType.body.copyWith(height: 1.5, color: tokens.ink)),
        ],
        if (risk.developerResponse != null) ...[
          const SizedBox(height: PlinthSpace.s24),
          DeveloperSaysField.fromResponse(risk.developerResponse!),
        ],
        if (risk.pending.isNotEmpty) ...[
          const SizedBox(height: PlinthSpace.s24),
          PendingFactNote(fact: risk.pending.first),
        ],
      ],
    );
  }

  Future<void> _openEvidence(BuildContext context, WidgetRef ref, c.SourceRef source) async {
    final factId = source.factIds.isEmpty ? null : source.factIds.first;
    if (factId == null) return;
    final evidence = await ref.read(evidenceProvider(EvidenceRef(factId, slug: slug)).future);
    if (!context.mounted) return;
    final official = evidence.officialUrl;
    await showEvidenceSheet(
      context,
      evidence: evidence,
      onOpenOriginal: official == null
          ? null
          : () => launchUrl(Uri.parse(official), mode: LaunchMode.externalApplication),
    );
  }
}
