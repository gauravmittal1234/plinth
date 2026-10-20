import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';

import '../../helpers/app_harness.dart';

/// AppProject (WORK_BREAKDOWN T31a): the real screen, on the Aurelia fixture
/// (Elevated, with the pending Jul–Sep QPR and the tower-level replay).
void main() {
  /// Scrolls [finder] into view and settles twice: a section's entrance
  /// ("Rise") animation starts the moment it is first built, so the first
  /// settle can still be mid-rise when it completes; the second call
  /// re-aligns to where the content actually rests before a tap lands on it.
  Future<void> reveal(WidgetTester tester, Finder finder) async {
    await scrollIntoView(tester, finder);
    await scrollIntoView(tester, finder);
  }

  testWidgets('the hero shows the project, the developer and the band chip', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    expect(find.text('Aurelia Heights, Phase 2'), findsWidgets);
    expect(find.textContaining('Northfield Estates'), findsOneWidget);
    expect(find.textContaining('Elevated'), findsWidgets);
  });

  testWidgets('the Late12 line reads "after Apr 2029"', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    expect(find.textContaining('after Apr 2029'), findsWidgets);
  });

  testWidgets('the confidence line never sits on the band name, and shows its dots', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    expect(find.textContaining("We're less certain about this one"), findsOneWidget);
  });

  testWidgets('picking Tower A shows "Tower A, slab 9 of 20"', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final towerA = find.text('A');
    await reveal(tester, towerA);
    await tester.tap(towerA.first);
    await tester.pumpAndSettle();
    expect(find.text('Tower A, slab 9 of 20'), findsOneWidget);
  });

  testWidgets('"Why Elevated?" expands to the reasons and opens a source’s evidence', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final why = find.text('Why Elevated?');
    await reveal(tester, why);
    await tester.tap(why);
    await tester.pumpAndSettle();
    expect(find.textContaining('72% of units sold, 41% built'), findsOneWidget);
    final source = find.textContaining('HARERA QPR').first;
    await reveal(tester, source);
    await tester.tap(source);
    await tester.pumpAndSettle();
    expect(find.text('Source'), findsOneWidget);
  });

  testWidgets('"Which payment plan?" expands to the construction-linked explainer', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final title = find.text('Which payment plan?');
    await reveal(tester, title);
    await tester.tap(title);
    await tester.pumpAndSettle();
    expect(find.textContaining('construction-linked'), findsWidgets);
  });

  testWidgets('What will I really pay? shows the all-in total and the cost table', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final heading = find.text('What will I really pay?');
    await reveal(tester, heading);
    // find.text matches any built widget once it has scrolled into the
    // list's build range, so no further scrolling is needed just to assert
    // these exist.
    expect(find.text('₹2.74 Cr'), findsWidgets);
    expect(find.text('All-in'), findsWidgets);
  });

  testWidgets('Can we afford the wait? states the loan assumption and the answer', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    // Two hops: the wait section sits far enough down that scrolling
    // straight to it can exhaust scrollIntoView's own scroll budget.
    await reveal(tester, find.text('What will I really pay?'));
    final heading = find.text('Can we afford the wait?');
    await reveal(tester, heading);
    expect(find.textContaining('20% down, 8.50%, 20 years'), findsOneWidget);
  });

  testWidgets('Follow opens the alerts sheet, then "Turn on alerts" closes it', (tester) async {
    // Disposed explicitly, at the end of this function: a handle registered
    // only with addTearDown is still open when the framework's own
    // end-of-test semantics-handle check runs.
    final handle = tester.ensureSemantics();
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Follow'));
    await tester.pumpAndSettle();
    expect(find.text('Get alerts for Aurelia Heights, Phase 2?'), findsOneWidget);
    await tester.tap(find.text('Turn on alerts'));
    await tester.pumpAndSettle();
    expect(find.text('Get alerts for Aurelia Heights, Phase 2?'), findsNothing);
    expect(find.bySemanticsLabel('Following'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('Ask Plinth opens the project-scoped sheet with the adviser line', (tester) async {
    final handle = tester.ensureSemantics();
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Ask Plinth'));
    await tester.pumpAndSettle();
    expect(find.text('About Aurelia Heights, Phase 2 · answers cite public records'), findsOneWidget);
    expect(find.textContaining('Talk to a Plinth adviser'), findsOneWidget);
    handle.dispose();
  });

  testWidgets('Simple view swaps in the large-type blocks, and "Back to the full page" returns', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Simple view'));
    await tester.pumpAndSettle();
    expect(find.text('Delivery risk: Elevated'), findsOneWidget);
    expect(find.textContaining('Promised: Dec 2027'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);

    // Two controls read "Back to the full page": the app bar's TextButton
    // (always on screen) and the Simple view's own closing PlinthButton,
    // which can be scrolled far down a long page; the app bar one is used
    // here since it's guaranteed to be on screen regardless of scroll.
    await tester.tap(find.widgetWithText(TextButton, 'Back to the full page'));
    await tester.pumpAndSettle();
    expect(find.text('Will it be delivered on time?'), findsOneWidget);
  });
}
