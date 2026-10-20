@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

import '../../helpers/app_harness.dart';

/// T30 · AppMap, Day and Night (WORK_BREAKDOWN T30 Accept: "widget tests and
/// goldens (Day/Night)"). CI (ci-mobile, Linux) renders the reference PNGs;
/// see test/flutter_test_config.dart. The map surface is the
/// `flutter test`-safe placeholder (map_surface.dart): the real MapLibre
/// canvas needs a device/emulator, which Linux CI's golden job does not run.
void main() {
  for (final (name, mode) in [('day', ThemeMode.light), ('night', ThemeMode.dark)]) {
    testWidgets('AppMap, $name', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(overrides: fixtureModeOverrides());
      addTearDown(container.dispose);
      if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      container.read(routerProvider).go(Routes.map);
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/map_screen_$name.png'));
    });
  }
}
