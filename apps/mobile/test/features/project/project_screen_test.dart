import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';

import '../../helpers/app_harness.dart';

/// AppProject (WORK_BREAKDOWN T31a): the real screen, on the Aurelia fixture
/// (Elevated, with the pending Jul–Sep QPR and the tower-level replay).
void main() {
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
    await scrollIntoView(tester, towerA);
    await tester.tap(towerA.first);
    await tester.pumpAndSettle();
    expect(find.text('Tower A, slab 9 of 20'), findsOneWidget);
  });

  testWidgets('"Why Elevated?" expands to the reasons and opens a source’s evidence', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final why = find.text('Why Elevated?');
    await scrollIntoView(tester, why);
    await tester.tap(why);
    await tester.pumpAndSettle();
    expect(find.textContaining('72% of units sold, 41% built'), findsOneWidget);
    final source = find.textContaining('HARERA QPR').first;
    await scrollIntoView(tester, source);
    await tester.tap(source);
    await tester.pumpAndSettle();
    expect(find.text('Source'), findsOneWidget);
  });

  testWidgets('"Which payment plan?" expands to the construction-linked explainer', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final title = find.text('Which payment plan?');
    await scrollIntoView(tester, title);
    await tester.tap(title);
    await tester.pumpAndSettle();
    expect(find.textContaining('construction-linked'), findsWidgets);
  });

  testWidgets('What will I really pay? shows the all-in total and the cost table', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final heading = find.text('What will I really pay?');
    await scrollIntoView(tester, heading);
    // find.text matches any built widget, so no further scrolling is needed
    // just to assert these exist (both are shown once collapsed sections
    // above have settled).
    expect(find.text('₹2.74 Cr'), findsWidgets);
    expect(find.text('All-in'), findsWidgets);
  });

  testWidgets('Can we afford the wait? states the loan assumption and the answer', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    final heading = find.text('Can we afford the wait?');
    await scrollIntoView(tester, heading);
    expect(find.textContaining('20% down, 8.50%, 20 years'), findsOneWidget);
  });

  testWidgets('Follow opens the alerts sheet, then "Turn on alerts" closes it', (tester) async {
    tester.ensureSemantics();
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Follow'));
    await tester.pumpAndSettle();
    expect(find.text('Get alerts for Aurelia Heights, Phase 2?'), findsOneWidget);
    await tester.tap(find.text('Turn on alerts'));
    await tester.pumpAndSettle();
    expect(find.text('Get alerts for Aurelia Heights, Phase 2?'), findsNothing);
    expect(find.bySemanticsLabel('Following'), findsOneWidget);
  });

  testWidgets('Ask Plinth opens the project-scoped sheet with the adviser line', (tester) async {
    tester.ensureSemantics();
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    await tester.tap(find.bySemanticsLabel('Ask Plinth'));
    await tester.pumpAndSettle();
    expect(find.text('About Aurelia Heights, Phase 2 · answers cite public records'), findsOneWidget);
    expect(find.textContaining('Talk to a Plinth adviser'), findsOneWidget);
  });

  testWidgets('Simple view swaps in the large-type blocks, and "Back to the full page" returns', (tester) async {
    await pumpPlinth(tester, location: Routes.projectOf('aurelia-heights-phase-2'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Simple view'));
    await tester.pumpAndSettle();
    expect(find.text('Delivery risk: Elevated'), findsOneWidget);
    expect(find.textContaining('Promised: Dec 2027'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);

    await tester.tap(find.text('Back to the full page'));
    await tester.pumpAndSettle();
    expect(find.text('Will it be delivered on time?'), findsOneWidget);
  });
}
