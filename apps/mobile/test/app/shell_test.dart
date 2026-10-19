import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';

import '../helpers/app_harness.dart';

void main() {
  testWidgets('the shell has 4 tabs: Explore, Following, Ask Plinth, You', (tester) async {
    await pumpPlinth(tester);
    final bar = find.byType(NavigationBar);
    expect(bar, findsOneWidget);
    for (final label in ['Explore', 'Following', 'Ask Plinth', 'You']) {
      expect(
        find.descendant(of: bar, matching: find.text(label)),
        findsOneWidget,
        reason: label,
      );
    }
    expect(tester.getSize(bar).height, 64, reason: 'DESIGN §4.16: a 64 dp bar');
  });

  testWidgets('each tab opens its screen', (tester) async {
    final container = await pumpPlinth(tester);
    final bar = find.byType(NavigationBar);
    for (final (label, path, artboard) in [
      ('Following', Routes.following, 'AppFollowing'),
      ('Ask Plinth', Routes.ask, 'AppVoice'),
      ('You', Routes.you, 'AppYou'),
      ('Explore', Routes.explore, 'AppExplore'),
    ]) {
      await tester.tap(find.descendant(of: bar, matching: find.text(label)));
      await tester.pumpAndSettle();
      expect(locationOf(container), path);
      expect(find.text(artboard), findsOneWidget);
    }
  });

  testWidgets('a tab keeps its place; tapping it again returns to its first screen', (tester) async {
    final container = await pumpPlinth(tester);
    final bar = find.byType(NavigationBar);

    await tester.tap(find.text('Map'));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.map);

    await tester.tap(find.descendant(of: bar, matching: find.text('Following')));
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: bar, matching: find.text('Explore')));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.map, reason: 'Explore kept its place');

    await tester.tap(find.descendant(of: bar, matching: find.text('Explore')));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.explore);
  });

  testWidgets('a project opens full screen above the tabs, and back returns', (tester) async {
    final container = await pumpPlinth(tester);
    final aurelia = find.text('Aurelia Heights, Phase 2');
    await scrollIntoView(tester, aurelia);
    await tester.tap(aurelia);
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.projectOf('aurelia-heights-phase-2'));
    expect(find.text('AppProject'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.explore);
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
