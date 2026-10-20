import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/widgets/widgets.dart';
import '../../data/project.dart';
import 'risk_copy.dart';
import 'sections/footer_section.dart';
import 'sections/frequency_section.dart';
import 'sections/next_steps_section.dart';
import 'sections/pre_rera_section.dart';
import 'sections/reasons_section.dart';

/// The root of AppRisk (test/router hook): finds the real screen once it is
/// filled in, instead of the placeholder text a stub used to show.
const riskScreenKey = Key('app-risk-screen');

/// AppRisk (WORK_BREAKDOWN T32; AppRisk.dc.html): one phase's delivery risk
/// as its own, shareable page — "Will it be delivered on time?", the dial or
/// 100-projects instrument, the reasons behind the band with their evidence,
/// what would change it, the developer's reply, the pending fact, the
/// pre-RERA history and so what to do now.
///
/// Reads the phase's [ProjectPage] (T17): its `risk` is `RiskClass`, the
/// same object `api.risk_summary` serves (API_CONTRACTS §2) embedded
/// unchanged; `pre_rera` and `next_steps` sit beside it on that one payload.
class RiskScreen extends ConsumerWidget {
  const RiskScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phase = PhaseRef(slug);
    final pageAsync = ref.watch(projectPageProvider(phase));
    final tokens = PlinthTokens.of(context);

    return Scaffold(
      key: riskScreenKey,
      backgroundColor: tokens.bg,
      appBar: AppBar(backgroundColor: tokens.bg, elevation: 0),
      body: SafeArea(
        top: false,
        child: switch (pageAsync) {
          AsyncData(:final value) => _RiskBody(slug: slug, page: value.value),
          AsyncError() => _ErrorState(onRetry: () => ref.invalidate(projectPageProvider(phase))),
          _ => const Center(child: CircularProgressIndicator()),
        },
      ),
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
            Text(RiskCopy.couldNotLoad, style: PlinthType.body.copyWith(color: PlinthTokens.of(context).ink)),
            const SizedBox(height: PlinthSpace.s16),
            PlinthButton(label: RiskCopy.tryAgain, onPressed: onRetry),
          ],
        ),
      ),
    );
  }
}

class _RiskBody extends StatelessWidget {
  const _RiskBody({required this.slug, required this.page});

  final String slug;
  final c.ProjectPage page;

  @override
  Widget build(BuildContext context) {
    final risk = page.risk;
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        _RiskHeaderBlock(risk: risk),
        RiskFrequencySection(risk: risk),
        RiskReasonsSection(slug: slug, risk: risk),
        RiskPreReraSection(preRera: page.preRera),
        RiskNextStepsSection(nextSteps: page.nextSteps),
        RiskFooterSection(meta: risk.meta),
      ],
    );
  }
}

/// "Will it be delivered on time?", the phase line, the band poster and a
/// way to share the risk card (`share_plus`).
class _RiskHeaderBlock extends StatelessWidget {
  const _RiskHeaderBlock({required this.risk});

  final c.RiskClass risk;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final phase = risk.phase;
    return ColoredBox(
      color: tokens.bg,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(PlinthLayout.gutterPhone, 24, PlinthLayout.gutterPhone, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Semantics(
              header: true,
              child: Text(
                RiskCopy.willItBeOnTime,
                style: PlinthType.h1.copyWith(
                  fontSize: 34,
                  height: 1.02,
                  letterSpacing: -0.035 * 34,
                  color: tokens.ink,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text('${phase.name} · RERA ${phase.reraNumber}', style: PlinthType.small.copyWith(color: tokens.muted)),
            const SizedBox(height: PlinthSpace.s24),
            RiskHeader.fromProjectRisk(risk, scale: RiskHeaderScale.poster, caption: RiskCopy.deliveryRiskOurOpinion),
            const SizedBox(height: PlinthSpace.s24),
            PlinthButton(
              label: RiskCopy.shareRiskCard,
              kind: PlinthButtonKind.tonal,
              glyph: KitGlyph.share,
              onPressed: () => _share(risk),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _share(c.RiskClass risk) async {
    final share = risk.share;
    final text = [...share.lines, share.sourceLine, share.cardUrl, share.caption].join('\n');
    await SharePlus.instance.share(ShareParams(text: text, subject: risk.phase.name));
  }
}
