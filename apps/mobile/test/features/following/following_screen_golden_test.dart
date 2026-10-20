@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/core/clock.dart';
import 'package:plinth/data/fixture_providers.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart' show plinthFixedNow;

import '../../helpers/app_harness.dart';

/// AppFollowing on the fixture buyer's feed, Day and Night (WORK_BREAKDOWN
/// T50): opens on Updates, with "Since you last looked" at the top.
///
/// Goldens are rendered and compared on Linux only (`ci-mobile`); see
/// `test/flutter_test_config.dart`. This PR's goldens were generated on a
/// Mac and need a Linux re-render before they can be trusted (see the PR
/// body's note).
void main() {
  for (final (name, mode) in [('day', ThemeMode.light), ('night', ThemeMode.dark)]) {
    testWidgets('AppFollowing Updates, $name', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(
        overrides: [clockProvider.overrideWithValue(() => plinthFixedNow), ...fixtureOverrides(signedIn: true)],
      );
      addTearDown(container.dispose);
      if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      container.read(routerProvider).go(Routes.following);
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/following_updates_$name.png'));
    });
  }
}
