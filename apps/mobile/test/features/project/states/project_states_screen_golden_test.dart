@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/app/theme_mode.dart';
import 'package:plinth/features/project/states/project_states_screen.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

import '../../../helpers/app_harness.dart';

/// AppProjectStates (WORK_BREAKDOWN T31b): the top of the page (hero, the
/// overlay flag and the top of the risk answer) for each of the 7 design
/// states, Day and Night — as `project_screen_golden_test.dart` does for
/// AppProject's own hero and risk. Goldens render and compare on Linux only
/// (`test/flutter_test_config.dart`); this run still builds and pumps every
/// screen, just without the pixel comparison.
void main() {
  for (final (name, mode) in [('day', ThemeMode.light), ('night', ThemeMode.dark)]) {
    for (final state in ProjectDesignState.values) {
      testWidgets('AppProjectStates ${state.label}, $name', (tester) async {
        usePhoneWindow(tester, pixelRatio: 1);
        final container = ProviderContainer(overrides: fixtureModeOverrides());
        addTearDown(container.dispose);
        if (mode == ThemeMode.dark) container.read(themeModeProvider.notifier).toggle();
        await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
        await tester.pumpAndSettle();
        container.read(routerProvider).go(state.previewPath);
        await tester.pumpAndSettle();
        await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/states_${state.id}_$name.png'));
      });
    }
  }
}
