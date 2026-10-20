import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/core/clock.dart';
import 'package:plinth/data/fixture_providers.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart' show plinthFixedNow;

import '../../helpers/app_harness.dart' show usePhoneWindow;

export '../../helpers/app_harness.dart' show locationOf, pumpPlinth, routerOf, scrollIntoView, usePhoneWindow;

/// Pumps the whole app signed in as the fixture buyer (Rohan).
///
/// `pumpPlinth` (`test/helpers/app_harness.dart`, T06's) always starts
/// signed out: `signedInProvider.overrideWithValue(true)` alone is not
/// enough for Following or Family, because `FixtureWorld._requireSignIn`
/// checks `FixtureWorld.session.signedIn`, not that provider
/// (`lib/data/fixture_providers.dart`'s own `fixtureOverrides(signedIn:
/// true)` doc comment). This mirrors `fixtureModeOverrides()` with that flag
/// set, which `test/helpers/app_harness.dart` cannot do without an
/// `pumpPlinth` parameter (T06 owns that file; T50 does not).
Future<ProviderContainer> pumpSignedIn(
  WidgetTester tester, {
  String? location,
  List<Override> overrides = const [],
}) async {
  usePhoneWindow(tester);
  final container = ProviderContainer(
    overrides: [
      clockProvider.overrideWithValue(() => plinthFixedNow),
      ...fixtureOverrides(signedIn: true),
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
