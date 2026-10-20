import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth/app/not_found_screen.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/data/session.dart';

import '../helpers/app_harness.dart';

/// One registered path: a concrete location for it, the artboard its
/// placeholder names, and whether it sits inside the tab shell.
typedef Sample = ({String location, String artboard, bool tabs});

/// Every path in WORK_BREAKDOWN §2.2. A new route without a row here fails
/// "every registered path has a sample".
const samples = <String, Sample>{
  '/': (location: '/', artboard: 'AppExplore', tabs: true),
  Routes.explore: (location: '/explore', artboard: 'AppExplore', tabs: true),
  Routes.map: (location: '/explore/map', artboard: 'AppMap', tabs: true),
  Routes.following: (location: '/following', artboard: 'AppFollowing', tabs: true),
  Routes.family: (location: '/following/family', artboard: 'AppFamily', tabs: true),
  Routes.ask: (location: '/ask', artboard: 'AppVoice', tabs: true),
  Routes.you: (location: '/you', artboard: 'AppYou', tabs: true),
  Routes.privacy: (location: '/you/privacy', artboard: 'AppYou', tabs: true),
  Routes.welcome: (location: '/welcome', artboard: 'AppOnboarding', tabs: false),
  Routes.project: (location: '/gurugram/projects/aurelia-heights-phase-2', artboard: 'AppProject', tabs: false),
  Routes.risk: (location: '/gurugram/projects/aurelia-heights-phase-2/risk', artboard: 'AppRisk', tabs: false),
  Routes.familyJoin: (location: '/j/AH2-7KQ', artboard: 'AppFamily', tabs: false),
  Routes.scan: (location: '/scan', artboard: 'AppScan', tabs: false),
  Routes.claims: (location: '/check/claims', artboard: 'AppClaims', tabs: false),
  Routes.claim: (location: '/check/claims/example', artboard: 'AppClaims', tabs: false),
  Routes.costSheet: (location: '/check/cost-sheet', artboard: 'AppCostSheet', tabs: false),
  Routes.beforePay: (location: '/check/before-you-pay', artboard: 'AppBeforePay', tabs: false),
  Routes.payAsBuilt: (location: '/check/pay-as-built', artboard: 'AppPayAsBuilt', tabs: false),
  Routes.visit: (location: '/visits/example', artboard: 'AppVisitPass', tabs: false),
  Routes.visualise: (location: '/visualise', artboard: 'AppVisualiseCapture', tabs: false),
  Routes.visualiseResult: (location: '/visualise/example', artboard: 'AppVisualiseResult', tabs: false),
};

/// Full path patterns of every GoRoute in [routes].
List<String> patternsOf(List<RouteBase> routes, [String parent = '']) => [
  for (final route in routes)
    if (route is GoRoute) ...[
      _join(parent, route.path),
      ...patternsOf(route.routes, _join(parent, route.path)),
    ] else
      ...patternsOf(route.routes, parent),
];

String _join(String parent, String path) =>
    path.startsWith('/') ? path : (parent.endsWith('/') ? '$parent$path' : '$parent/$path');

/// A sign-in switch for tests.
class FakeAuth extends Notifier<bool> {
  FakeAuth(this.initial);

  final bool initial;

  @override
  bool build() => initial;

  void set(bool value) => state = value;
}

void main() {
  test('every registered path has a sample, and every sample is registered', () {
    final registered = patternsOf(appRoutes());
    expect(registered.toSet(), samples.keys.toSet());
    expect(registered.length, registered.toSet().length, reason: 'a path is registered twice');
  });

  testWidgets('pumps every registered route onto its placeholder', (tester) async {
    // Signed in, so account pages open too.
    final container = await pumpPlinth(tester, overrides: [signedInProvider.overrideWithValue(true)]);
    for (final MapEntry(key: pattern, value: s) in samples.entries) {
      routerOf(container).go(s.location);
      await tester.pumpAndSettle();
      expect(find.text(s.artboard), findsOneWidget, reason: '$pattern should show ${s.artboard}');
      expect(find.byType(NavigationBar), s.tabs ? findsOneWidget : findsNothing, reason: '$pattern tabs');
      expect(find.byType(NotFoundScreen), findsNothing, reason: pattern);
      expect(tester.takeException(), isNull, reason: pattern);
    }
  });

  testWidgets('the app opens on Explore', (tester) async {
    final container = await pumpPlinth(tester);
    expect(locationOf(container), Routes.explore);
    expect(find.text('AppExplore'), findsOneWidget);
  });

  testWidgets('browsing never redirects to sign-in', (tester) async {
    final container = await pumpPlinth(tester);
    for (final s in samples.values) {
      final path = Uri.parse(s.location).path;
      if (path == '/' || Routes.needsAccount(path)) continue;
      routerOf(container).go(s.location);
      await tester.pumpAndSettle();
      expect(locationOf(container), s.location);
      expect(find.text('Sign in with your phone'), findsNothing, reason: s.location);
    }
  });

  testWidgets('signed out, an account page opens You with the sign-in sheet', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.privacy);
    expect(Uri.parse(locationOf(container)).path, Routes.you);
    expect(Uri.parse(locationOf(container)).queryParameters, {'signin': '1', 'next': Routes.privacy});
    expect(find.text('Sign in with your phone'), findsOneWidget);
    expect(find.text('Then opens /you/privacy'), findsOneWidget);
  });

  testWidgets('signing out on an account page re-runs the redirect', (tester) async {
    final auth = NotifierProvider<FakeAuth, bool>(() => FakeAuth(true));
    final container = await pumpPlinth(
      tester,
      location: Routes.privacy,
      overrides: [signedInProvider.overrideWith((ref) => ref.watch(auth))],
    );
    expect(locationOf(container), Routes.privacy);

    container.read(auth.notifier).set(false);
    await tester.pumpAndSettle();
    expect(Uri.parse(locationOf(container)).path, Routes.you);
    expect(find.text('Sign in with your phone'), findsOneWidget);
  });

  test('accountRedirect only touches /you/* when signed out', () {
    expect(accountRedirect(Uri.parse('/you/privacy'), signedIn: false), '/you?signin=1&next=%2Fyou%2Fprivacy');
    expect(accountRedirect(Uri.parse('/you/privacy'), signedIn: true), isNull);
    expect(accountRedirect(Uri.parse('/you'), signedIn: false), isNull);
    expect(accountRedirect(Uri.parse('/following'), signedIn: false), isNull);
    expect(accountRedirect(Uri.parse('/gurugram/projects/kestrel-park'), signedIn: false), isNull);
  });

  testWidgets('FIXTURES mode previews a project state with ?state=', (tester) async {
    await pumpPlinth(tester, location: '/gurugram/projects/aurelia-heights-phase-2?state=stale');
    expect(find.text('AppProjectStates'), findsOneWidget);
    expect(find.textContaining('state  stale'), findsOneWidget);
  });

  testWidgets('an unknown link shows the not-found screen with a way back', (tester) async {
    final container = await pumpPlinth(tester, location: '/gurugram/developers/northfield-estates');
    expect(find.byType(NotFoundScreen), findsOneWidget);
    await tester.tap(find.text('Open Explore'));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.explore);
  });

  testWidgets('every App Link path in the manifest opens a screen', (tester) async {
    final manifest = File('android/app/src/main/AndroidManifest.xml').readAsStringSync();
    final prefixes = RegExp(r'android:path(?:Prefix)?="([^"]+)"').allMatches(manifest).map((m) => m[1]!).toList();
    expect(prefixes, isNotEmpty);
    final container = await pumpPlinth(tester, overrides: [signedInProvider.overrideWithValue(true)]);
    for (final prefix in prefixes) {
      // A prefix is opened with a sample tail where it ends in a slash.
      final location = switch (prefix) {
        '/gurugram/projects/' => '/gurugram/projects/aurelia-heights-phase-2',
        '/j/' => '/j/AH2-7KQ',
        _ => prefix,
      };
      routerOf(container).go(location);
      await tester.pumpAndSettle();
      expect(find.byType(NotFoundScreen), findsNothing, reason: '$prefix has no screen');
    }
  });
}
