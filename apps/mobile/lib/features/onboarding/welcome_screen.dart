import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show AlertPrefsMap, ChannelPrefs, QuietHours;
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../app/routes.dart';
import '../../core/widgets/widgets.dart';
import '../../data/alerts.dart';
import '../../data/auth.dart';
import '../../data/follow.dart';
import '../../data/local_store.dart';
import 'onboarding_controller.dart';
import 'onboarding_copy.dart';
import 'sign_in_flow_controller.dart';
import 'steps/alerts_step.dart';
import 'steps/buying_step.dart';
import 'steps/code_step.dart';
import 'steps/done_step.dart';
import 'steps/follow_step.dart';
import 'steps/location_step.dart';
import 'steps/phone_step.dart';
import 'steps/welcome_step.dart';

/// `localStore` key the Done step sets once this run reaches the end, so a
/// later launch can open Explore directly instead of this screen again.
///
/// Nothing here starts the app on `/welcome` yet: `app/router.dart`'s
/// `initialLocation` is T06's and still always opens Explore (see this PR's
/// Handoff note).
const onboardingSeenStoreKey = 'onboarding.seen.v1';

/// The 8-step first run (WORK_BREAKDOWN T48): the card builds, what you're
/// buying, location, sign in, code, follow your first project, alerts, done.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  late final SignInFlowController _signIn = SignInFlowController(ref.read(authRepositoryProvider));

  @override
  void dispose() {
    _signIn.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final flow = ref.watch(onboardingControllerProvider);
    final notifier = ref.read(onboardingControllerProvider.notifier);
    final step = flow.step;
    return Scaffold(
      backgroundColor: tokens.bg,
      body: SafeArea(
        child: Column(
          children: [
            _Header(step: step, onBack: notifier.back, onSkip: notifier.skip),
            Expanded(
              child: SingleChildScrollView(
                child: switch (step) {
                  OnboardingStep.welcome => const WelcomeStep(),
                  OnboardingStep.buying => const BuyingStep(),
                  OnboardingStep.location => const LocationStep(),
                  OnboardingStep.phone => PhoneStep(signIn: _signIn),
                  OnboardingStep.code => CodeStep(signIn: _signIn),
                  OnboardingStep.follow => const FollowStep(),
                  OnboardingStep.alerts => const AlertsStep(),
                  OnboardingStep.done => DoneStep(signIn: _signIn),
                },
              ),
            ),
            _BottomBar(step: step, notifier: notifier, signIn: _signIn),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.step, required this.onBack, required this.onSkip});

  final OnboardingStep step;
  final VoidCallback onBack;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) {
    final tokens = PlinthTokens.of(context);
    final progressStep = progressStepOf(step);
    final hasSkip = skipTargetOf(step) != null;
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, PlinthSpace.s8, PlinthLayout.gutterApp, PlinthSpace.s8),
      child: Row(
        children: [
          if (step == OnboardingStep.welcome)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: PlinthSpace.s12),
              child: Text(
                OnboardingCopy.plinth,
                style: TextStyle(
                  fontFamily: PlinthType.displayFamily,
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  color: tokens.ink,
                ),
              ),
            )
          else
            IconButton(
              onPressed: onBack,
              tooltip: OnboardingCopy.back,
              icon: Icon(Icons.arrow_back_rounded, color: tokens.ink),
            ),
          Expanded(
            child: progressStep == 0
                ? const SizedBox.shrink()
                : Center(
                    child: Semantics(
                      label: 'Step $progressStep of 5',
                      child: ExcludeSemantics(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            for (var i = 1; i <= 5; i++) ...[
                              if (i > 1) const SizedBox(width: 4),
                              Container(
                                width: 28,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: i <= progressStep ? tokens.ink : tokens.track,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
          ),
          if (hasSkip)
            TextButton(
              onPressed: onSkip,
              child: Text(OnboardingCopy.skip, style: PlinthType.button.copyWith(color: tokens.ink)),
            )
          else
            const SizedBox(width: 48, height: 48),
        ],
      ),
    );
  }
}

class _BottomBar extends ConsumerWidget {
  const _BottomBar({required this.step, required this.notifier, required this.signIn});

  final OnboardingStep step;
  final OnboardingController notifier;
  final SignInFlowController signIn;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = PlinthTokens.of(context);
    final actions = _actionsFor(context, ref, step, notifier, signIn);
    return DecoratedBox(
      decoration: BoxDecoration(color: tokens.bg),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          PlinthLayout.gutterApp,
          PlinthSpace.s12,
          PlinthLayout.gutterApp,
          PlinthSpace.s16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            PlinthButton(
              key: const Key('onboarding-primary'),
              label: actions.primaryLabel,
              expand: true,
              onPressed: actions.onPrimary,
            ),
            if (actions.secondaryLabel != null) ...[
              const SizedBox(height: 4),
              PlinthButton(
                kind: PlinthButtonKind.tertiary,
                label: actions.secondaryLabel!,
                onPressed: actions.onSecondary,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

typedef _Actions = ({String primaryLabel, VoidCallback? onPrimary, String? secondaryLabel, VoidCallback? onSecondary});

_Actions _actionsFor(
  BuildContext context,
  WidgetRef ref,
  OnboardingStep step,
  OnboardingController notifier,
  SignInFlowController signIn,
) {
  switch (step) {
    case OnboardingStep.welcome:
      return (
        primaryLabel: OnboardingCopy.welcomePrimary,
        onPrimary: () => notifier.goTo(OnboardingStep.buying),
        secondaryLabel: OnboardingCopy.welcomeSecondary,
        onSecondary: notifier.exploreWithoutAccount,
      );
    case OnboardingStep.buying:
      return (
        primaryLabel: OnboardingCopy.buyingPrimary,
        onPrimary: () => notifier.goTo(OnboardingStep.location),
        secondaryLabel: null,
        onSecondary: null,
      );
    case OnboardingStep.location:
      return (
        primaryLabel: OnboardingCopy.locationPrimary,
        onPrimary: () => notifier.goTo(OnboardingStep.phone),
        secondaryLabel: null,
        onSecondary: null,
      );
    case OnboardingStep.phone:
      return (
        primaryLabel: signIn.viaWhatsApp ? OnboardingCopy.sendCodeOnWhatsApp : OnboardingCopy.sendCodeBySms,
        onPrimary: signIn.busy
            ? null
            : () async {
                final ok = await signIn.sendCode();
                if (ok) notifier.goTo(OnboardingStep.code);
              },
        secondaryLabel: OnboardingCopy.notNowExploreFirst,
        onSecondary: notifier.exploreWithoutAccount,
      );
    case OnboardingStep.code:
      return (
        primaryLabel: OnboardingCopy.verify,
        onPrimary: signIn.busy
            ? null
            : () async {
                final ok = await signIn.verify();
                if (ok) {
                  notifier.goTo(OnboardingStep.follow);
                  if (context.mounted) showPlinthToast(context, OnboardingCopy.signedInToast);
                }
              },
        secondaryLabel: null,
        onSecondary: null,
      );
    case OnboardingStep.follow:
      final count = ref.watch(followsProvider).length;
      return (
        primaryLabel: OnboardingCopy.followPrimary(count),
        onPrimary: () => notifier.goTo(OnboardingStep.alerts),
        secondaryLabel: null,
        onSecondary: null,
      );
    case OnboardingStep.alerts:
      return (
        primaryLabel: OnboardingCopy.turnOnAlerts,
        onPrimary: () => _turnOnAlerts(context, ref, notifier),
        secondaryLabel: OnboardingCopy.alertsNotNow,
        onSecondary: () => notifier.goTo(OnboardingStep.done),
      );
    case OnboardingStep.done:
      return (
        primaryLabel: OnboardingCopy.openExplore,
        onPrimary: () => _finish(context, ref),
        secondaryLabel: OnboardingCopy.changeInYou,
        onSecondary: () => context.go(Routes.you),
      );
  }
}

Future<void> _turnOnAlerts(BuildContext context, WidgetRef ref, OnboardingController notifier) async {
  final flow = ref.read(onboardingControllerProvider);
  try {
    await ref.read(alertPrefsProvider.future); // the controller must finish its first build before `.save` runs
    await ref
        .read(alertPrefsProvider.notifier)
        .save(
          AlertPrefsMap(
            push: ChannelPrefs(bandChange: 'instant', filings: 'instant'),
            whatsapp: flow.whatsAppAlertOn ? ChannelPrefs(bandChange: 'instant') : null,
            quietHours: flow.quietHoursOn ? QuietHours(from: '22:00', to: '08:00') : null,
          ),
        );
  } on Exception {
    // A signed-out buyer (Welcome's "Explore without an account" skipped
    // straight here) or a server refusal still gets the toast below and the
    // honest "Off" the Done summary shows for it: nothing claims a record
    // that wasn't made (AGENTS.md rule 9).
  }
  notifier.setAlertsOn(true);
  notifier.goTo(OnboardingStep.done);
  if (context.mounted) showPlinthToast(context, OnboardingCopy.androidWillAskToast);
}

Future<void> _finish(BuildContext context, WidgetRef ref) async {
  await ref.read(localStoreProvider).write(onboardingSeenStoreKey, 'true');
  if (context.mounted) context.go(Routes.explore);
}
