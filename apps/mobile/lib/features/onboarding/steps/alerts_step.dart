import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../core/widgets/widgets.dart';
import '../../../data/follow.dart';
import '../../../data/search.dart';
import '../onboarding_controller.dart';
import '../onboarding_copy.dart';

/// "Turn on alerts?" — utility only, quiet hours on by default, the WhatsApp
/// box unticked (the brief). "What one looks like" uses the real project the
/// buyer just followed, phrased as what will happen, never as an event that
/// didn't (AGENTS.md rule 10): no invented date, trigger or developer name.
class AlertsStep extends ConsumerWidget {
  const AlertsStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final state = ref.watch(onboardingControllerProvider);
    final notifier = ref.read(onboardingControllerProvider.notifier);
    final followed = ref.watch(followsProvider).keys.toList();
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
          Text(OnboardingCopy.alertsHeadline, style: PlinthType.title.copyWith(color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s8),
          Text.rich(
            TextSpan(
              style: PlinthType.lead.copyWith(color: tokens.ink),
              children: [
                const TextSpan(
                  text: OnboardingCopy.alertsBodyBold,
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const TextSpan(text: OnboardingCopy.alertsBody),
              ],
            ),
          ),
          const SizedBox(height: PlinthSpace.s16),
          _SamplePanel(followedSlugs: followed),
          const SizedBox(height: PlinthSpace.s16),
          const _AlertKindList(),
          const SizedBox(height: PlinthSpace.s12),
          PlinthGroup(
            children: [
              PlinthListRow(
                title: OnboardingCopy.quietHours,
                subtitle: OnboardingCopy.quietHoursBody,
                toggled: state.quietHoursOn,
                onTap: () => notifier.setQuietHoursOn(!state.quietHoursOn),
                trailing: IgnorePointer(
                  child: Switch(
                    value: state.quietHoursOn,
                    onChanged: (_) {},
                    activeThumbColor: tokens.onAccent,
                    activeTrackColor: tokens.accent,
                    inactiveTrackColor: tokens.track,
                  ),
                ),
              ),
              PlinthListRow(
                title: OnboardingCopy.alsoOnWhatsApp,
                subtitle: OnboardingCopy.replyStop,
                toggled: state.whatsAppAlertOn,
                onTap: () => notifier.setWhatsAppAlertOn(!state.whatsAppAlertOn),
                trailing: IgnorePointer(
                  child: Switch(
                    value: state.whatsAppAlertOn,
                    onChanged: (_) {},
                    activeThumbColor: tokens.onAccent,
                    activeTrackColor: tokens.accent,
                    inactiveTrackColor: tokens.track,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SamplePanel extends ConsumerWidget {
  const _SamplePanel({required this.followedSlugs});

  final List<String> followedSlugs;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    // The same "every covered project" search the Welcome and Follow steps
    // read, already cached: a followed slug's real current name, never an
    // invented one.
    final all = ref.watch(searchProvider(const SearchQuery())).value?.items ?? const [];
    String? name;
    for (final slug in followedSlugs) {
      final match = all.where((c) => c.slug == slug);
      if (match.isNotEmpty) {
        name = match.first.name;
        break;
      }
    }
    final title = name ?? OnboardingCopy.sampleGenericTitle;
    final body = name == null ? OnboardingCopy.sampleGenericBody : OnboardingCopy.sampleBodyPrefix;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s16, vertical: PlinthSpace.s12),
      decoration: BoxDecoration(color: tokens.track, borderRadius: BorderRadius.circular(PlinthRadius.panel)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(OnboardingCopy.whatOneLooksLike, style: PlinthType.caption.copyWith(color: tokens.ink2)),
          const SizedBox(height: 4),
          Text(title, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
          const SizedBox(height: 2),
          Text(body, style: PlinthType.body.copyWith(color: tokens.ink)),
        ],
      ),
    );
  }
}

class _AlertKindList extends StatelessWidget {
  const _AlertKindList();

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    const items = [OnboardingCopy.alertKindBand, OnboardingCopy.alertKindFiling, OnboardingCopy.alertKindVisit];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: PlinthSpace.s8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(Icons.check_rounded, size: PlinthLayout.iconMd, color: tokens.ink),
                ),
                const SizedBox(width: PlinthSpace.s8),
                Expanded(
                  child: Text(item, style: PlinthType.body.copyWith(color: tokens.ink)),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
