import 'package:flutter/material.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/widgets/widgets.dart';
import '../project_copy.dart';

/// The photo, title, developer line, RERA badge and risk chip
/// (`product/design/artboards/AppProject.dc.html` hero).
///
/// [hero.image_url] points at `packages/fixtures/media/*`, which this
/// package doesn't bundle as a Flutter asset yet, so the photo is an
/// illustrative placeholder carrying the server's caption rather than the
/// image itself (Handoff: a later task can wire the real asset once
/// `plinth_fixtures` ships media).
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
        PlinthLayout.gutterPhone,
        PlinthSpace.s16,
        PlinthLayout.gutterPhone,
        PlinthSpace.s24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _Photo(caption: hero.imageCaption),
          const SizedBox(height: PlinthSpace.s16),
          Semantics(
            header: true,
            child: Text(
              phase.name,
              style: PlinthType.display.copyWith(fontSize: 34, height: 1.02, letterSpacing: -0.03 * 34, color: tokens.ink),
            ),
          ),
          const SizedBox(height: PlinthSpace.s8),
          Text.rich(
            TextSpan(
              children: [
                const TextSpan(text: 'by '),
                TextSpan(text: developer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                TextSpan(text: ' · ${developer.claim.line}'),
              ],
            ),
            style: PlinthType.small.copyWith(color: tokens.ink2, height: 1.4),
          ),
          const SizedBox(height: 4),
          Text(phase.localityLine, style: PlinthType.small.copyWith(color: tokens.muted)),
          const SizedBox(height: PlinthSpace.s16),
          RiskChip(chip: chip),
          const SizedBox(height: PlinthSpace.s16),
          _ReraBadge(badge: hero.reraBadge),
        ],
      ),
    );
  }
}

class _Photo extends StatelessWidget {
  const _Photo({required this.caption});

  final String? caption;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(PlinthRadius.panel),
      child: AspectRatio(
        aspectRatio: 16 / 10,
        child: Container(
          color: tokens.photo,
          alignment: Alignment.bottomLeft,
          padding: const EdgeInsets.all(PlinthSpace.s12),
          child: caption == null
              ? null
              : DecoratedBox(
                  decoration: BoxDecoration(color: tokens.scrim, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Text(
                      caption!,
                      style: PlinthType.small.copyWith(color: tokens.onInverse),
                    ),
                  ),
                ),
        ),
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
          child: DecoratedBox(
            decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.pill)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              child: Text.rich(
                TextSpan(
                  children: [
                    const WidgetSpan(
                      alignment: PlaceholderAlignment.middle,
                      child: Padding(padding: EdgeInsets.only(right: 6), child: KitIcon(KitGlyph.external, size: 16)),
                    ),
                    TextSpan(text: 'RERA ${badge.number}'),
                  ],
                ),
                style: PlinthType.small.copyWith(fontWeight: FontWeight.w600, color: tokens.ink),
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
