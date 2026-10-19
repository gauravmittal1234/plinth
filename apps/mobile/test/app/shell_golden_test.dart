@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

import '../helpers/app_harness.dart';

/// The tab shell on Explore, Day and Night: the 64 dp bar, the artboard's
/// tab icons and the placeholder page.
void main() {
  for (final (name, mode) in [('day', ThemeMode.light), ('night', ThemeMode.dark)]) {
    testWidgets('shell on Explore, $name', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(overrides: fixtureModeOverrides());
      addTearDown(container.dispose);
      if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/shell_explore_$name.png'));
    });
  }
}
