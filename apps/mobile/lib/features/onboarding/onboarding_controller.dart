import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The 8-step first run (WORK_BREAKDOWN T48; `AppOnboarding.dc.html`).
enum OnboardingStep { welcome, buying, location, phone, code, follow, alerts, done }

/// Where the progress bar sits for [step] (1 of 5 .. 5 of 5), or 0 before it
/// starts and once it's done. Phone and Code share a step: entering a code is
/// still "signing in".
int progressStepOf(OnboardingStep step) => switch (step) {
  OnboardingStep.buying => 1,
  OnboardingStep.location => 2,
  OnboardingStep.phone || OnboardingStep.code => 3,
  OnboardingStep.follow => 4,
  OnboardingStep.alerts => 5,
  _ => 0,
};

/// Only Welcome has no way back.
bool hasBackFrom(OnboardingStep step) => step != OnboardingStep.welcome;

OnboardingStep? previousOf(OnboardingStep step) => switch (step) {
  OnboardingStep.buying => OnboardingStep.welcome,
  OnboardingStep.location => OnboardingStep.buying,
  OnboardingStep.phone => OnboardingStep.location,
  OnboardingStep.code => OnboardingStep.phone,
  OnboardingStep.follow => OnboardingStep.code,
  OnboardingStep.alerts => OnboardingStep.follow,
  OnboardingStep.done => OnboardingStep.alerts,
  _ => null,
};

/// Where the header's Skip goes, or null when this step has none (Welcome,
/// Code — a code must be verified or abandoned by going back — and Done).
OnboardingStep? skipTargetOf(OnboardingStep step) => switch (step) {
  OnboardingStep.buying => OnboardingStep.location,
  OnboardingStep.location => OnboardingStep.phone,
  OnboardingStep.phone => OnboardingStep.done,
  OnboardingStep.follow => OnboardingStep.alerts,
  OnboardingStep.alerts => OnboardingStep.done,
  _ => null,
};

/// What's been picked so far, kept only on this phone (nothing here is sent
/// anywhere until the step that owns it sends it: a follow through
/// `api.follow`, alerts through `api.alert_prefs_set`). Reset each time the
/// flow is opened — this is a first-run screen, not a settings page.
@immutable
class OnboardingFlowState {
  const OnboardingFlowState({
    this.step = OnboardingStep.welcome,
    this.kind,
    this.corridors = const <String>{},
    this.locationOn = false,
    this.searchQuery = '',
    this.alertsOn = false,
    this.quietHoursOn = true,
    this.whatsAppAlertOn = false,
    this.tryProjectSlug,
  });

  final OnboardingStep step;

  /// 'uc' | 'ready' | 'check', or null: nothing preselected (the brief).
  final String? kind;

  /// Corridor keys picked on Location ('dxp', 'ng'; 'gcer' is "soon" and never
  /// lands here).
  final Set<String> corridors;
  final bool locationOn;
  final String searchQuery;

  /// Decided on the Alerts step; stays false whether declined or skipped.
  final bool alertsOn;
  final bool quietHoursOn;
  final bool whatsAppAlertOn;

  /// Which project the Welcome step's "try a project" tabs show, by slug;
  /// null until the real list loads and picks the first one.
  final String? tryProjectSlug;

  OnboardingFlowState copyWith({
    OnboardingStep? step,
    Object? kind = _unset,
    Set<String>? corridors,
    bool? locationOn,
    String? searchQuery,
    bool? alertsOn,
    bool? quietHoursOn,
    bool? whatsAppAlertOn,
    Object? tryProjectSlug = _unset,
  }) => OnboardingFlowState(
    step: step ?? this.step,
    kind: identical(kind, _unset) ? this.kind : kind as String?,
    corridors: corridors ?? this.corridors,
    locationOn: locationOn ?? this.locationOn,
    searchQuery: searchQuery ?? this.searchQuery,
    alertsOn: alertsOn ?? this.alertsOn,
    quietHoursOn: quietHoursOn ?? this.quietHoursOn,
    whatsAppAlertOn: whatsAppAlertOn ?? this.whatsAppAlertOn,
    tryProjectSlug: identical(tryProjectSlug, _unset) ? this.tryProjectSlug : tryProjectSlug as String?,
  );
}

const _unset = Object();

/// Corridor keys the Location step shows, in order (the artboard's static
/// `CORR`: a small, fixed taxonomy of corridors Plinth covers, not a fact
/// from any payload). 'gcer' is announced but not open yet.
const onboardingCorridors = <String>['dxp', 'ng', 'gcer'];
const onboardingSoonCorridor = 'gcer';

class OnboardingController extends Notifier<OnboardingFlowState> {
  @override
  OnboardingFlowState build() => const OnboardingFlowState();

  void goTo(OnboardingStep step) => state = state.copyWith(step: step);

  void back() {
    final to = previousOf(state.step);
    if (to != null) goTo(to);
  }

  /// The header's Skip. Phone and Alerts land on Done with nothing decided
  /// for them (matching their own secondary button, so Skip never says
  /// something different from "Not now").
  void skip() {
    final to = skipTargetOf(state.step);
    if (to == null) return;
    if (state.step == OnboardingStep.phone || state.step == OnboardingStep.alerts) {
      state = state.copyWith(step: to, alertsOn: false);
    } else {
      goTo(to);
    }
  }

  /// Welcome's own secondary action: straight to Done, signed out, no alerts.
  void exploreWithoutAccount() => state = state.copyWith(step: OnboardingStep.done, alertsOn: false);

  void pickKind(String kind) => state = state.copyWith(kind: kind);

  void toggleCorridor(String key) {
    final next = {...state.corridors};
    next.contains(key) ? next.remove(key) : next.add(key);
    state = state.copyWith(corridors: next);
  }

  void setLocationOn(bool on) => state = state.copyWith(locationOn: on);

  void setSearchQuery(String q) => state = state.copyWith(searchQuery: q);

  void pickTryProject(String slug) => state = state.copyWith(tryProjectSlug: slug);

  void setAlertsOn(bool on) => state = state.copyWith(alertsOn: on);

  void setQuietHoursOn(bool on) => state = state.copyWith(quietHoursOn: on);

  void setWhatsAppAlertOn(bool on) => state = state.copyWith(whatsAppAlertOn: on);
}

final onboardingControllerProvider = NotifierProvider.autoDispose<OnboardingController, OnboardingFlowState>(
  OnboardingController.new,
);
