import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/trust.dart';
import '../onboarding_controller.dart';
import '../onboarding_copy.dart';
import '../onboarding_format.dart';

/// `about().coverage.next`'s own name for the resale/ready-flat row
/// (API_CONTRACTS §3.1, `packages/fixtures/expected/about/default.json`) —
/// the only key that row carries (AGENTS.md rule 10's comment on
/// `coverageNextByName`).
const _resaleCoverageName = 'Resale and transfer checks';

/// "What are you buying?" — nothing preselected (the brief); stays on this
/// phone only, never sent anywhere.
class BuyingStep extends ConsumerWidget {
  const BuyingStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final kind = ref.watch(onboardingControllerProvider.select((s) => s.kind));
    final notifier = ref.read(onboardingControllerProvider.notifier);
    final resale = coverageNextByName(ref.watch(aboutProvider).value?.coverage.next, _resaleCoverageName);
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        PlinthLayout.gutterApp,
        PlinthSpace.s12,
        PlinthLayout.gutterApp,
        PlinthSpace.s24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(OnboardingCopy.buyingHeadline, style: PlinthType.title.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s8),
          Text(OnboardingCopy.buyingBody, style: PlinthType.lead.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s16),
          Semantics(
            container: true,
            label: OnboardingCopy.buyingHeadline,
            child: PlinthGroup(
              children: [
                _Kind(
                  title: OnboardingCopy.kindUcTitle,
                  sub: OnboardingCopy.kindUcSub,
                  on: kind == 'uc',
                  onTap: () => notifier.pickKind('uc'),
                ),
                _Kind(
                  title: OnboardingCopy.kindReadyTitle,
                  sub: resale == null
                      ? OnboardingCopy.kindReadySubGeneric
                      : OnboardingCopy.kindReadySub(resale.whenLine),
                  on: kind == 'ready',
                  onTap: () => notifier.pickKind('ready'),
                ),
                _Kind(
                  title: OnboardingCopy.kindCheckTitle,
                  sub: OnboardingCopy.kindCheckSub,
                  on: kind == 'check',
                  onTap: () => notifier.pickKind('check'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Kind extends StatelessWidget {
  const _Kind({required this.title, required this.sub, required this.on, required this.onTap});

  final String title;
  final String sub;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    return PlinthListRow(
      title: title,
      subtitle: sub,
      onTap: onTap,
      toggled: on,
      leading: Icon(
        on ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
        size: PlinthLayout.iconLg,
        color: on ? tokens.accent : tokens.ink2,
      ),
    );
  }
}
