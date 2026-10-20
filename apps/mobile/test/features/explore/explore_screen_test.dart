import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth/features/explore/project_card_tile.dart';

import '../../helpers/app_harness.dart';

/// T30 · AppExplore: search, corridor chips and the project list, all-in
/// price first (WORK_BREAKDOWN T30). The fixture search (`all-gurugram`) is
/// the same one T07's M0 gate checks: 8 seeded phases, lowest delivery risk
/// first.
void main() {
  // The shared `scrollIntoView` (app_harness.dart) assumes exactly one
  // Scrollable on screen; a single-line TextField adds its own internal one
  // for horizontal text scrolling, so this screen's own list is named
  // explicitly instead.
  Future<void> scrollExploreIntoView(WidgetTester tester, Finder finder) async {
    for (var i = 0; i < 24 && finder.evaluate().isEmpty; i++) {
      await tester.drag(find.byType(ListView), const Offset(0, -200));
      await tester.pump();
    }
    await tester.pumpAndSettle();
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
  }

  const order = [
    'Kestrel Park',
    'Cedar Walk, Phase 2',
    'Sapphire Grove, Phase 1',
    'Aurelia Heights, Phase 2',
    'Coral Towers',
    'Laurel Residency',
    'Juniper Enclave',
    'Heron Point, Phase 2',
  ];

  testWidgets('lists every seeded phase, lowest delivery risk first', (tester) async {
    await pumpPlinth(tester, location: Routes.explore);
    // Scrolling forward in this exact order only succeeds if the cards are
    // laid out in this order: scrollIntoView never scrolls back up.
    for (final name in order) {
      final finder = find.text(name);
      await scrollExploreIntoView(tester, finder);
      expect(finder, findsOneWidget, reason: name);
      expect(
        find.descendant(of: find.byType(ProjectCardTile), matching: find.byType(RiskChip)),
        findsWidgets,
        reason: '$name has a delivery risk chip',
      );
    }
  });

  testWidgets('each card shows its all-in price first', (tester) async {
    await pumpPlinth(tester, location: Routes.explore);
    final aurelia = find.text('Aurelia Heights, Phase 2');
    await scrollExploreIntoView(tester, aurelia);
    expect(find.text('₹2.74 Cr all-in · quoted ₹2.35 Cr'), findsOneWidget);
  });

  testWidgets('tapping the Aurelia card navigates to its project page', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.explore);
    final aurelia = find.text('Aurelia Heights, Phase 2');
    await scrollExploreIntoView(tester, aurelia);
    await tester.tap(aurelia);
    await tester.pumpAndSettle();
    expect(locationOf(container), '/gurugram/projects/aurelia-heights-phase-2');
  });

  testWidgets('a corridor chip narrows the list to that corridor', (tester) async {
    await pumpPlinth(tester, location: Routes.explore);
    await tester.tap(find.text('New Gurugram'));
    await tester.pumpAndSettle();
    expect(find.text('Coral Towers'), findsOneWidget);
    expect(find.text('Laurel Residency'), findsOneWidget);
    expect(find.text('Kestrel Park'), findsNothing);
  });

  testWidgets('typing in the search field narrows the list by name', (tester) async {
    await pumpPlinth(tester, location: Routes.explore);
    await tester.enterText(find.byType(TextField), 'kestrel');
    await tester.pumpAndSettle();
    expect(find.text('Kestrel Park'), findsOneWidget);
    expect(find.text('Aurelia Heights, Phase 2'), findsNothing);
    expect(find.byType(ProjectCardTile), findsOneWidget);
  });

  testWidgets('a search with no match shows the empty line, not a crash', (tester) async {
    await pumpPlinth(tester, location: Routes.explore);
    await tester.enterText(find.byType(TextField), 'nonexistent project xyz');
    await tester.pumpAndSettle();
    expect(find.byType(ProjectCardTile), findsNothing);
    expect(find.text('No projects match this search.'), findsOneWidget);
  });

  testWidgets('Scan RERA QR opens the scan placeholder', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.explore);
    await tester.tap(find.text('Scan RERA QR'));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.scan);
  });

  testWidgets('Map opens the map screen', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.explore);
    await tester.tap(find.text('Map'));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.map);
  });
}
