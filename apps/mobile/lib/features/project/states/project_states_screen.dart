import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../app/routes.dart';
import '../../../core/widgets/widgets.dart';
import '../../../data/project.dart';
import '../../../data/trust.dart';
import '../sections/built_section.dart';
import '../sections/footer_section.dart';
import '../sections/hero_section.dart';
import '../sections/risk_section.dart';
import 'widgets/already_booked_section.dart';
import 'widgets/state_cards.dart';

/// The 7 design-state variants (WORK_BREAKDOWN T31b, T20c): which fixture
/// demonstrates each, and whether it needs the fixture world's design-state
/// override (`PhaseRef.previewState`). Only Facts-only has one today
/// (`packages/fixtures/expected/project_page/_requests.json`); the rest are
/// each a fixture whose own `RiskClass.display` already is that state.
enum ProjectDesignState {
  severe('severe', 'Severe', 'laurel-residency'),
  stalled('stalled', 'Stalled', 'laurel-residency'),
  limitedHistory('limited_history', 'Limited history', 'juniper-enclave'),
  notScored('not_scored', 'Not scored', 'heron-point-phase-2'),
  stale('stale', 'Stale', 'coral-towers'),
  rescoring('rescoring', 'Re-scoring', 'sapphire-grove-phase-1'),
  factsOnly('facts_only', 'Facts-only', 'aurelia-heights-phase-2');

  const ProjectDesignState(this.id, this.label, this.defaultSlug);

  /// The route's `?state=` value.
  final String id;

  /// The dev-review label shown on the app bar; never a buyer-facing string.
  final String label;

  /// The fixture that demonstrates this state, when a caller doesn't pick one.
  final String defaultSlug;

  /// `PhaseRef.previewState`: null unless the fixture world needs a design
  /// state distinct from [defaultSlug]'s own (today: just `facts_only`).
  String? get fixturePreviewState => this == factsOnly ? id : null;

  /// `/gurugram/projects/<defaultSlug>?state=<id>`: the URL this state's
  /// goldens and widget tests open (WORK_BREAKDOWN T31b's accept line).
  String get previewPath => '${Routes.projectOf(defaultSlug)}?state=$id';

  static ProjectDesignState? ofId(String id) {
    for (final s in values) {
      if (s.id == id) return s;
    }
    return null;
  }
}

/// `AppProjectStates`: the same route as [ProjectScreen], previewed in
/// FIXTURES mode with `?state=` (WORK_BREAKDOWN §2). Production state always
/// comes from `RiskSummary.display`, so this screen is never reached outside
/// fixtures/dev review.
///
/// Reuses AppProject's hero, risk and built sections (T31a) as-is: each
/// already renders a state's band, confidence, frequency or pending fact
/// straight from the loaded [c.ProjectPage], the same way AppProject does.
/// This screen adds only what AppProject never shows: the red-flag rule's
/// own line, the Facts-only withheld banner, the records' age against the
/// 120-day stale line, and "If you've already booked here".
class ProjectStatesScreen extends ConsumerWidget {
  const ProjectStatesScreen({super.key, required this.slug, required this.state});

  final String slug;
  final String state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final design = ProjectDesignState.ofId(state);
    final phase = PhaseRef(slug, previewState: design?.fixturePreviewState);
    final pageAsync = ref.watch(projectPageProvider(phase));
    final tokens = PlinthTokens.of(context);

    return Scaffold(
      backgroundColor: tokens.bg,
      appBar: AppBar(backgroundColor: tokens.bg, elevation: 0, title: Text(design?.label ?? state)),
      body: SafeArea(
        top: false,
        child: switch (pageAsync) {
          AsyncData(:final value) => _StateContent(slug: slug, page: value.value),
          AsyncError() => _ErrorState(onRetry: () => ref.invalidate(projectPageProvider(phase))),
          _ => const Center(child: CircularProgressIndicator()),
        },
      ),
    );
  }
}

class _StateContent extends ConsumerWidget {
  const _StateContent({required this.slug, required this.page});

  final String slug;
  final c.ProjectPage page;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final risk = page.risk;
    final methodology = ref.watch(methodologyProvider).value?.value;
    final staleDays = methodology?.dataRules?.staleDays ?? 120;
    final band = risk.band;
    final withheld = risk.withheld;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        ProjectHeroSection(phase: risk.phase, hero: page.hero, chip: risk.chip),
        OverlayFlagRow(overlays: risk.display.overlays),
        ProjectRiskSection(slug: slug, risk: risk, bandSinceLine: page.progress.today.bandSinceLine),
        if (band?.rule != null) RedFlagRuleCard(rule: band!.rule!, catalogue: methodology?.redFlagRules),
        if (withheld != null) WithheldNotice(withheld: withheld),
        RecordsAgeSection(
          records: page.records,
          generatedAt: page.meta.generatedAt,
          staleDays: staleDays,
          ruleLine: methodology?.dataRules?.line,
        ),
        // AppProject's built section assumes at least 2 quarters on file
        // (its replay slider asserts `labels.length > 1`). Not scored
        // (Heron) has none yet; Limited history, Stale and Re-scoring have
        // just their first QPR, so AppProjectStates skips the section
        // rather than tripping that assertion (Handoff in the PR body).
        if (page.progress.quarters.length > 1) ProjectBuiltSection(progress: page.progress, answer: risk.progress.line),
        AlreadyBookedSection(slug: slug, projectName: risk.phase.name),
        ProjectFooterSection(meta: page.meta),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(PlinthSpace.s24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'This preview could not be loaded.',
              style: PlinthType.body.copyWith(color: PlinthTokens.of(context).ink),
            ),
            const SizedBox(height: PlinthSpace.s16),
            PlinthButton(label: 'Try again', onPressed: onRetry),
          ],
        ),
      ),
    );
  }
}
