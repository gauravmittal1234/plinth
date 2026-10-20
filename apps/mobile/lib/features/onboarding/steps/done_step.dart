import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../../data/follow.dart';
import '../../../data/search.dart';
import '../../../data/session.dart';
import '../onboarding_controller.dart';
import '../onboarding_copy.dart';
import '../sign_in_flow_controller.dart';

/// "You're set." — a plain-language summary of exactly what this run
/// decided, read back from the real signed-in state and the real follows
/// (never from what the flow merely offered), closing on the one line that
/// never changes.
class DoneStep extends ConsumerWidget {
  const DoneStep({super.key, required this.signIn});

  final SignInFlowController signIn;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final state = ref.watch(onboardingControllerProvider);
    final signedIn = ref.watch(signedInProvider);
    final follows = ref.watch(followsProvider);
    final allProjects = ref.watch(searchProvider(const SearchQuery())).value?.items ?? const [];
    final followedNames = [
      for (final slug in follows.keys) ...allProjects.where((c) => c.slug == slug).map((c) => c.name),
    ];
    final corridorNames = [
      for (final key in state.corridors)
        switch (key) {
          'dxp' => OnboardingCopy.corridorDwarkaExpressway,
          'ng' => OnboardingCopy.corridorNewGurugram,
          _ => key,
        },
    ];
    final summary = <(String, String)>[
      (OnboardingCopy.summaryBuying, OnboardingCopy.kindWord(state.kind)),
      (
        OnboardingCopy.summaryLooking,
        corridorNames.isEmpty ? OnboardingCopy.lookingAllGurugram : corridorNames.join(', '),
      ),
      (
        OnboardingCopy.summaryAccount,
        signedIn ? '${signIn.masked}${OnboardingCopy.accountSameEverywhere}' : OnboardingCopy.accountNone,
      ),
      (
        OnboardingCopy.summaryFollowing,
        followedNames.isEmpty ? OnboardingCopy.followingNothingYet : followedNames.join(', '),
      ),
      (
        OnboardingCopy.summaryAlerts,
        state.alertsOn
            ? '${OnboardingCopy.alertsOnQuiet}${state.whatsAppAlertOn ? OnboardingCopy.alertsAlsoWhatsApp : ''}'
            : OnboardingCopy.alertsOff,
      ),
      (
        OnboardingCopy.summaryLocation,
        state.locationOn ? OnboardingCopy.locationOnLine : OnboardingCopy.locationOffLine,
      ),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        PlinthLayout.gutterApp,
        PlinthSpace.s24,
        PlinthLayout.gutterApp,
        PlinthSpace.s24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(OnboardingCopy.doneHeadline, style: PlinthType.display.copyWith(fontSize: 44, color: tokens.ink)),
          const SizedBox(height: PlinthSpace.s16),
          Text(
            signedIn ? OnboardingCopy.doneLineSignedIn : OnboardingCopy.doneLineSignedOut,
            style: PlinthType.lead.copyWith(color: tokens.ink),
          ),
          const SizedBox(height: PlinthSpace.s16),
          for (final (k, v) in summary)
            Padding(
              padding: const EdgeInsets.only(bottom: PlinthSpace.s12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 96,
                    child: Text(k, style: PlinthType.meta.copyWith(color: tokens.ink2)),
                  ),
                  Expanded(
                    child: Text(v, style: PlinthType.rowTitle.copyWith(color: tokens.ink)),
                  ),
                ],
              ),
            ),
          const SizedBox(height: PlinthSpace.s32),
          Text(
            OnboardingCopy.plinth,
            style: TextStyle(
              fontFamily: PlinthType.displayFamily,
              fontWeight: FontWeight.w800,
              fontSize: 64,
              height: 0.9,
              color: tokens.ink,
            ),
          ),
          const SizedBox(height: PlinthSpace.s8),
          Text(
            OnboardingCopy.doneTagline,
            style: TextStyle(
              fontFamily: PlinthType.displayFamily,
              fontWeight: FontWeight.w800,
              fontSize: 20,
              color: tokens.ink,
            ),
          ),
        ],
      ),
    );
  }
}
