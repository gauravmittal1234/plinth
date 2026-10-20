import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth/features/explore/map_surface.dart';
import 'package:plinth/features/explore/project_card_tile.dart';

import '../../helpers/app_harness.dart';

/// T30 · AppMap: a MapLibre canvas with no basemap in fixtures, all-in pins,
/// the peek/half/full results sheet and the legend (WORK_BREAKDOWN T30).
void main() {
  // PeekSheet's own body list is lazy, like Explore's; scroll it directly
  // (its handle's own drag resizes the sheet, not the list, so the target is
  // the sheet's ListView specifically, not the shared `scrollIntoView`).
  Future<void> scrollSheetIntoView(WidgetTester tester, Finder finder) async {
    final sheetList = find.descendant(of: find.byType(PeekSheet), matching: find.byType(ListView));
    for (var i = 0; i < 24 && finder.evaluate().isEmpty; i++) {
      await tester.drag(sheetList, const Offset(0, -200));
      await tester.pump();
    }
    await tester.pumpAndSettle();
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
  }

  testWidgets('shows the no-basemap surface and an all-in pin for every project', (tester) async {
    await pumpPlinth(tester, location: Routes.map);
    expect(find.byType(MapSurfacePlaceholder), findsOneWidget);
    // Accept: "Pins show '₹2.74 Cr'" (Aurelia's `pin_label`).
    expect(find.text('₹2.74 Cr'), findsOneWidget);
    expect(find.text('₹2.44 Cr'), findsOneWidget); // Kestrel
    expect(find.text('Quoted ₹2.25 Cr'), findsOneWidget); // Juniper: no pin_label yet
  });

  testWidgets('the results sheet lists every project', (tester) async {
    await pumpPlinth(tester, location: Routes.map);
    expect(find.byType(ProjectCardTile), findsWidgets);
    final aurelia = find.descendant(of: find.byType(PeekSheet), matching: find.text('Aurelia Heights, Phase 2'));
    await scrollSheetIntoView(tester, aurelia);
    expect(aurelia, findsOneWidget);
  });

  testWidgets('a project row in the results sheet opens its project page', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.map);
    final aurelia = find.descendant(of: find.byType(PeekSheet), matching: find.text('Aurelia Heights, Phase 2'));
    await scrollSheetIntoView(tester, aurelia);
    await tester.tap(aurelia);
    await tester.pumpAndSettle();
    expect(locationOf(container), '/gurugram/projects/aurelia-heights-phase-2');
  });

  testWidgets('the legend names what pins show', (tester) async {
    await pumpPlinth(tester, location: Routes.map);
    expect(find.text('Pins show all-in prices'), findsOneWidget);
    expect(find.text('"Quoted" means no cost sheet yet.'), findsOneWidget);
  });

  testWidgets('the Delivery risk toggle swaps price pins for risk chips', (tester) async {
    await pumpPlinth(tester, location: Routes.map);
    expect(find.text('₹2.74 Cr'), findsOneWidget);
    await tester.tap(find.text('Delivery risk'));
    await tester.pumpAndSettle();
    expect(find.text('₹2.74 Cr'), findsNothing);
    // 8 cards in the sheet + at least one pin now drawing a RiskChip.
    expect(find.byType(RiskChip), findsWidgets);
  });

  testWidgets('back returns to Explore', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.map);
    await tester.tap(find.byTooltip('Back to Explore'));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.explore);
  });
}
