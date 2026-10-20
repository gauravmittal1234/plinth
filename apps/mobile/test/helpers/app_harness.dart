import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/core/clock.dart';
import 'package:plinth/data/fixture_providers.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart' show plinthFixedNow;

/// A phone-sized test window: 360 x 800 dp.
void usePhoneWindow(WidgetTester tester, {double pixelRatio = 3}) {
  tester.view.devicePixelRatio = pixelRatio;
  tester.view.physicalSize = Size(360 * pixelRatio, 800 * pixelRatio);
  addTearDown(tester.view.reset);
}

/// Pumps the whole app in FIXTURES mode, as `main.dart` does, then opens
/// [location] when given. Returns the container to read providers from.
///
/// [signedIn] signs the fixture buyer in at the one place that matters: the
/// [FixtureWorld]'s own session (`fixtureOverrides`), not just the
/// `signedInProvider` the router reads. Overriding that provider alone would
/// let a route render while every buyer call it makes (`who_has_my_number`,
/// `alert_prefs_get`, …) still throws `auth_required` against a fixture world
/// that was never told anyone signed in.
Future<ProviderContainer> pumpPlinth(
  WidgetTester tester, {
  String? location,
  bool signedIn = false,
  List<Override> overrides = const [],
}) async {
  usePhoneWindow(tester);
  final container = ProviderContainer(
    overrides: [
      clockProvider.overrideWithValue(() => plinthFixedNow),
      ...fixtureOverrides(signedIn: signedIn),
      ...overrides,
    ],
  );
  addTearDown(container.dispose);
  await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
  await tester.pumpAndSettle();
  if (location != null) {
    container.read(routerProvider).go(location);
    await tester.pumpAndSettle();
  }
  return container;
}

/// Scrolls the page's list until [finder] is built and on screen, then settles,
/// so a tap lands on it rather than on whatever was there before the scroll.
///
/// Defaults to the outermost `Scrollable` on screen (`find.byType(Scrollable).first`):
/// a screen with a single-line `TextField` (e.g. AppExplore's search field)
/// adds its own internal `Scrollable` for horizontal text scrolling, so more
/// than one can be on screen at once. Pass [scrollable] to target a specific
/// one explicitly.
Future<void> scrollIntoView(WidgetTester tester, Finder finder, {Finder? scrollable}) async {
  await tester.scrollUntilVisible(finder, 120, scrollable: scrollable ?? find.byType(Scrollable).first);
  await tester.pumpAndSettle();
}

/// The router's current location.
String locationOf(ProviderContainer container) => container.read(routerProvider).state.uri.toString();

/// The route's current GoRouter, for navigation in tests.
GoRouter routerOf(ProviderContainer container) => container.read(routerProvider);
