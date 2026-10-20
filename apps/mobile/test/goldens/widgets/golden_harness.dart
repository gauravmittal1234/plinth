import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import '../../core/widgets/kit_harness.dart';

export '../../core/widgets/kit_harness.dart';

/// Day and Night, as golden file suffixes.
const themes = <(String, bool)>[('day', false), ('night', true)];

/// The golden file stem of a risk state ("not_scored").
String stateName(RiskState s) => switch (s) {
  RiskState.notScored => 'not_scored',
  _ => s.name,
};

/// Renders [child] on a [width]-wide board in the app's Day or Night theme
/// and compares it with `<name>.png` beside this file. Pixels are compared
/// on Linux only (test/flutter_test_config.dart); text uses the test font
/// until the app bundles its fonts.
Future<void> expectKitGolden(
  WidgetTester tester,
  String name,
  Widget child, {
  required bool night,
  double width = 360,
  double viewHeight = 1600,
  EdgeInsets padding = const EdgeInsets.all(PlinthLayout.gutterPhone),
  bool reduceMotion = false,
}) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = Size(width, viewHeight);
  addTearDown(tester.view.reset);
  const board = ValueKey('golden-board');
  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: kitTheme(night: night),
      builder: (context, app) => MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: reduceMotion),
        child: app!,
      ),
      home: Builder(
        builder: (context) {
          final bg = PlinthTokens.of(context).bg;
          // Unbounded height, so the board (and its PNG) is as tall as its
          // content.
          return Material(
            color: bg,
            child: SingleChildScrollView(
              child: RepaintBoundary(
                key: board,
                child: Container(width: width, color: bg, padding: padding, child: child),
              ),
            ),
          );
        },
      ),
    ),
  );
  await tester.pumpAndSettle();
  await expectLater(find.byKey(board), matchesGoldenFile('$name.png'));
}
