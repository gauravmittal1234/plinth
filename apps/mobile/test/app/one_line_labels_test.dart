import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';

import '../helpers/app_harness.dart';

/// App UI v2 acceptance (benchmark-thapki.md): button, chip and segment
/// labels never wrap at 360 dp, on a small 360 × 640 phone. Before v2 the
/// project action bar's "Ask Plinth" broke onto two lines.
void main() {
  /// A 360 × 640 dp phone, applied after the app is up.
  Future<void> smallPhone(WidgetTester tester, {double textScale = 1}) async {
    tester.view.physicalSize = const Size(360 * 3, 640 * 3);
    tester.platformDispatcher.textScaleFactorTestValue = textScale;
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await tester.pumpAndSettle();
  }

  /// How many lines [label]'s paragraph is laid out on.
  int linesOf(WidgetTester tester, Finder label) {
    final paragraph = tester.renderObject<RenderParagraph>(label);
    final text = paragraph.text.toPlainText();
    final boxes = paragraph.getBoxesForSelection(TextSelection(baseOffset: 0, extentOffset: text.length));
    return boxes.map((b) => b.top.round()).toSet().length;
  }

  /// [label] is on one line and drawn inside the control that holds it.
  void expectOneLine(WidgetTester tester, String label, {Finder? within}) {
    final finder = find.text(label);
    expect(finder, findsOneWidget, reason: label);
    expect(linesOf(tester, finder), 1, reason: '"$label" wraps');
    if (within != null) {
      final control = find.ancestor(of: finder, matching: within).first;
      final outer = tester.getRect(control).inflate(0.5);
      final inner = tester.getRect(finder);
      expect(outer.contains(inner.topLeft) && outer.contains(inner.bottomRight), isTrue, reason: '"$label" overflows');
    }
  }

  for (final scale in [1.0, 1.3]) {
    testWidgets('project action bar: Follow, Ask Plinth and Share stay on one line (text ×$scale)', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
      await smallPhone(tester, textScale: scale);

      final bar = find.byType(Material);
      expectOneLine(tester, 'Follow', within: bar);
      expectOneLine(tester, 'Ask Plinth', within: bar);
      expect(find.bySemanticsLabel('Share'), findsOneWidget, reason: 'Share is an icon button');

      // Following is longer than Follow, and replaces it once tapped.
      await tester.tap(find.bySemanticsLabel('Follow'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Turn on alerts'));
      await tester.pumpAndSettle();
      expectOneLine(tester, 'Following', within: bar);
      handle.dispose();
    });
  }

  testWidgets('Explore: Scan RERA QR, Map and the corridor chips stay on one line', (tester) async {
    await pumpPlinth(tester, location: Routes.explore);
    await smallPhone(tester);
    for (final label in ['Scan RERA QR', 'Map', 'All of Gurugram', 'Dwarka Expressway']) {
      expectOneLine(tester, label);
    }
    await tester.ensureVisible(find.text('New Gurugram'));
    await tester.pumpAndSettle();
    expectOneLine(tester, 'New Gurugram');
  });

  testWidgets('the follow sheet: Turn on alerts and Not now, just follow stay on one line', (tester) async {
    final handle = tester.ensureSemantics();
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await smallPhone(tester);
    await tester.tap(find.bySemanticsLabel('Follow'));
    await tester.pumpAndSettle();
    expectOneLine(tester, 'Turn on alerts', within: find.byType(Material));
    expectOneLine(tester, 'Not now, just follow');
    handle.dispose();
  });

  testWidgets('You: Who has my number? and Day / Night stay on one line', (tester) async {
    await pumpPlinth(tester, location: Routes.you);
    await smallPhone(tester);
    expectOneLine(tester, 'Who has my number?', within: find.byType(Material));
    final night = find.text('Night');
    await scrollIntoView(tester, night);
    expectOneLine(tester, 'Day');
    expectOneLine(tester, 'Night');
  });
}
