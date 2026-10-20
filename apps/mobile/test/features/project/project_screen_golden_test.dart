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

/// AppProject on the Aurelia fixture, Day and Night: the hero and the top of
/// the risk answer, as a buyer sees it on open (WORK_BREAKDOWN T31a).
void main() {
  for (final (name, mode) in [('day', ThemeMode.light), ('night', ThemeMode.dark)]) {
    testWidgets('AppProject hero and risk, $name', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(overrides: fixtureModeOverrides());
      addTearDown(container.dispose);
      if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      container.read(routerProvider).go(Routes.projectOf('aurelia-heights-phase-2'));
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/project_hero_risk_$name.png'));
    });

    testWidgets('AppProject Simple view, $name', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(overrides: fixtureModeOverrides());
      addTearDown(container.dispose);
      if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      container.read(routerProvider).go(Routes.projectOf('aurelia-heights-phase-2'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Simple view'));
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/project_simple_view_$name.png'));
    });
  }
}
