@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

import '../../helpers/app_harness.dart';

/// T30 · AppExplore, Day and Night (WORK_BREAKDOWN T30 Accept: "widget tests
/// and goldens (Day/Night)"). CI (ci-mobile, Linux) renders the reference
/// PNGs; see test/flutter_test_config.dart.
void main() {
  for (final (name, mode) in [('day', ThemeMode.light), ('night', ThemeMode.dark)]) {
    testWidgets('AppExplore, $name', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(overrides: fixtureModeOverrides());
      addTearDown(container.dispose);
      if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/explore_screen_$name.png'));
    });
  }
}
