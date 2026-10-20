import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/features/project/states/project_states_screen.dart';

import '../../../helpers/app_harness.dart';

/// AppProjectStates (WORK_BREAKDOWN T31b): the 7 design states, each on the
/// fixture that demonstrates it (`ProjectDesignState`). The same text
/// assertions as T20c's accept line (WebProjectStates).
void main() {
  Future<void> openState(WidgetTester tester, ProjectDesignState state) async {
    await pumpPlinth(tester, location: state.previewPath);
    await tester.pumpAndSettle();
  }

  /// Scrolls [finder] into view with a scroll budget deep enough for the
  /// full page (`scrollIntoView` in `test/helpers/app_harness.dart`, shared
  /// with every other project test, bounds its own scroll to 50 x 120 px —
  /// short of AppProjectStates' extra cards on top of AppProject's own
  /// sections).
  Future<void> reveal(WidgetTester tester, Finder finder) async {
    await tester.scrollUntilVisible(finder, 300, maxScrolls: 300);
    await tester.pumpAndSettle();
  }

  for (final state in ProjectDesignState.values) {
    testWidgets('${state.label} opens without error', (tester) async {
      await openState(tester, state);
      expect(tester.takeException(), isNull);
      expect(find.descendant(of: find.byType(AppBar), matching: find.text(state.label)), findsOneWidget);
    });
  }

  testWidgets('Severe (Laurel): "set by red-flag rule 1, not our model", and no "of 100"', (tester) async {
    await openState(tester, ProjectDesignState.severe);
    await reveal(tester, find.textContaining('Set by red-flag rule 1, not our model'));
    expect(find.textContaining('Set by red-flag rule 1, not our model'), findsOneWidget);
    expect(find.textContaining('of 100'), findsNothing);
  });

  testWidgets('Stalled (Laurel) shows the Stall flag', (tester) async {
    await openState(tester, ProjectDesignState.stalled);
    expect(find.text('Stall flag'), findsOneWidget);
  });

  testWidgets('Limited history (Juniper): "Not enough history to score · no penalty"', (tester) async {
    await openState(tester, ProjectDesignState.limitedHistory);
    expect(find.textContaining('Not enough history to score · no penalty'), findsWidgets);
  });

  testWidgets('Not scored (Heron) renders with no QPR on file yet', (tester) async {
    await openState(tester, ProjectDesignState.notScored);
    expect(find.textContaining('Not scored'), findsWidgets);
    await reveal(tester, find.text('The records, as they stand'));
    // The built section needs at least 2 quarters on file (its replay
    // slider asserts as much); Heron has none yet, so AppProjectStates
    // skips the section rather than tripping that assertion.
    expect(find.text('How much is built?'), findsNothing);
  });

  testWidgets('Stale (Coral): the latest record reads 187 days old, past the stale line', (tester) async {
    await openState(tester, ProjectDesignState.stale);
    expect(find.text('Stale data'), findsOneWidget);
    await reveal(tester, find.textContaining('187 days old'));
    expect(find.textContaining('187 days old'), findsWidgets);
  });

  testWidgets('Re-scoring (Sapphire): "by 19 Oct 2026, 7:40 pm"', (tester) async {
    await openState(tester, ProjectDesignState.rescoring);
    expect(find.text('Re-scoring'), findsWidgets);
    await reveal(tester, find.textContaining('by 19 Oct 2026, 7:40 pm'));
    expect(find.textContaining('by 19 Oct 2026, 7:40 pm'), findsOneWidget);
  });

  testWidgets('Facts-only (Aurelia) withholds the band and shows why', (tester) async {
    await openState(tester, ProjectDesignState.factsOnly);
    await reveal(tester, find.textContaining('Band withheld pending review, from 18 Oct 2026'));
    expect(find.textContaining('Band withheld pending review, from 18 Oct 2026'), findsOneWidget);
    expect(find.textContaining('an application about our bands for the Northfield Estates group'), findsOneWidget);
  });

  testWidgets('"Already booked here?" expands to the buyer-rights explainer', (tester) async {
    await openState(tester, ProjectDesignState.severe);
    final title = find.text('Already booked here?');
    await reveal(tester, title);
    await tester.tap(title);
    await tester.pumpAndSettle();
    await reveal(tester, find.textContaining('Your money back, or interest'));
    expect(find.textContaining('Your money back, or interest'), findsOneWidget);
    // PlinthButton draws its label with Text.rich, next to its glyph icon
    // in the same run (a WidgetSpan), so matching its label needs
    // findRichText and a "contains" match rather than an exact one.
    expect(find.textContaining("I've booked here", findRichText: true), findsOneWidget);
  });

  testWidgets('"I\'ve booked here" toggles to "Booked here" with its alert note', (tester) async {
    await openState(tester, ProjectDesignState.severe);
    final title = find.text('Already booked here?');
    await reveal(tester, title);
    await tester.tap(title);
    await tester.pumpAndSettle();
    final toggle = find.textContaining("I've booked here", findRichText: true);
    await reveal(tester, toggle);
    await tester.tap(toggle, warnIfMissed: false);
    await tester.pumpAndSettle();
    expect(find.textContaining('Booked here', findRichText: true), findsWidgets);
    expect(find.text('Booked here · alerts for allottees'), findsOneWidget);
  });
}
