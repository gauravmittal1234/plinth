import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/widgets/widgets.dart';
import '../../data/evidence.dart';
import '../project/project_format.dart';

/// One dated change from `FollowingFeed.changes`/`.record` (F-93): the date
/// and project, the server's sentence, a before/after pill when the payload
/// has one, the developer's reply when it added one, then its sources. Every
/// word here is the payload's; nothing is composed from a band or a date
/// beyond the display date format (AGENTS §5).
class ChangeItemTile extends ConsumerWidget {
  const ChangeItemTile({super.key, required this.item, required this.projectName});

  final c.ChangeItem item;
  final String projectName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final before = item.beforePill;
    final after = item.afterPill;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: PlinthSpace.s12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '${formatDisplayDate(item.occurredOn)} · $projectName',
            style: PlinthType.small.copyWith(color: tokens.muted),
          ),
          const SizedBox(height: 4),
          Text(item.line, style: PlinthType.body.copyWith(height: 1.45, color: tokens.ink)),
          if (before != null && after != null) ...[
            const SizedBox(height: PlinthSpace.s8),
            DecoratedBox(
              decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: before,
                        style: TextStyle(color: tokens.ink2, decoration: TextDecoration.lineThrough),
                      ),
                      const TextSpan(text: '  →  '),
                      TextSpan(
                        text: after,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  style: PlinthType.small.copyWith(color: tokens.ink),
                ),
              ),
            ),
          ],
          if (item.developerSays != null) ...[
            const SizedBox(height: PlinthSpace.s8),
            DeveloperSaysField(label: item.developerSays!.line, compact: true),
          ],
          if (item.sources.isNotEmpty) ...[
            const SizedBox(height: PlinthSpace.s8),
            Wrap(
              spacing: PlinthSpace.s8,
              runSpacing: 4,
              children: [
                for (final source in item.sources)
                  SourceChip.fromRef(source, onPressed: () => _openEvidence(context, ref, source)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _openEvidence(BuildContext context, WidgetRef ref, c.SourceRef source) async {
    final factId = source.factIds.isEmpty ? null : source.factIds.first;
    if (factId == null) return;
    final evidence = await ref.read(evidenceProvider(EvidenceRef(factId, slug: item.slug)).future);
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
