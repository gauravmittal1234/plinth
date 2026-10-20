import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';

/// The picture, title, developer line, RERA badge and risk chip
/// (`product/design/artboards/AppProject.dc.html` hero; app UI v2).
///
/// The picture is the illustrative image the payload names in
/// [c.ProjectHero.imageUrl], bundled with the app, under the server's own
/// caption ("Images on this page are illustrative"). With no picture it
/// shows a quiet building icon, never a flat grey box.
class ProjectHeroSection extends StatelessWidget {
  const ProjectHeroSection({super.key, required this.phase, required this.hero, required this.chip});

  final c.PhaseSummary phase;
  final c.ProjectHero hero;
  final c.Chip chip;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final developer = phase.developer;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        PlinthLayout.gutterApp,
        PlinthSpace.s8,
        PlinthLayout.gutterApp,
        // The risk band below opens with its own 32 dp section gap.
        PlinthSpace.s4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          ProjectHeroImage(imageUrl: hero.imageUrl, caption: hero.imageCaption, aspectRatio: 16 / 11),
          const SizedBox(height: PlinthSpace.s20),
          Semantics(
            header: true,
            child: Text(phase.name, style: PlinthType.display.copyWith(color: tokens.ink)),
          ),
          const SizedBox(height: PlinthSpace.s8),
          Text.rich(
            TextSpan(
              children: [
                const TextSpan(text: 'by '),
                TextSpan(
                  text: developer.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                TextSpan(text: ' · ${developer.claim.line}'),
              ],
            ),
            style: PlinthType.meta.copyWith(color: tokens.ink2),
          ),
          const SizedBox(height: PlinthSpace.s4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 1),
                child: Icon(Icons.place_rounded, size: 18, color: tokens.ink2),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(phase.localityLine, style: PlinthType.meta.copyWith(color: tokens.ink2)),
              ),
            ],
          ),
          const SizedBox(height: PlinthSpace.s16),
          RiskChip(chip: chip),
          const SizedBox(height: PlinthSpace.s12),
          _ReraBadge(badge: hero.reraBadge),
        ],
      ),
    );
  }
}

class _ReraBadge extends StatelessWidget {
  const _ReraBadge({required this.badge});

  final c.ReraBadge badge;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return Semantics(
      container: true,
      button: true,
      label: '${ProjectCopy.showRera} for RERA ${badge.number}',
      excludeSemantics: true,
      onTap: () => _openAuthority(badge.authorityUrl),
      child: Pressable(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _openAuthority(badge.authorityUrl),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: PlinthLayout.touchApp),
            child: Align(
              alignment: AlignmentDirectional.centerStart,
              widthFactor: 1,
              heightFactor: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: tokens.chipFill,
                  borderRadius: BorderRadius.circular(PlinthRadius.pill),
                ),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(12, 9, 14, 9),
                  child: Text.rich(
                    TextSpan(
                      children: [
                        WidgetSpan(
                          alignment: PlaceholderAlignment.middle,
                          child: Padding(
                            padding: const EdgeInsetsDirectional.only(end: 6),
                            child: Icon(Icons.account_balance_rounded, size: 18, color: tokens.ink),
                          ),
                        ),
                        TextSpan(text: 'RERA ${badge.number}'),
                        WidgetSpan(
                          alignment: PlaceholderAlignment.middle,
                          child: Padding(
                            padding: const EdgeInsetsDirectional.only(start: 6),
                            child: KitIcon(KitGlyph.external, size: 16, color: tokens.ink2),
                          ),
                        ),
                      ],
                    ),
                    style: PlinthType.meta.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openAuthority(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
