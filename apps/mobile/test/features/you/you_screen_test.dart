import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/app/theme_mode.dart';

import '../../helpers/app_harness.dart';

// AppYou (WORK_BREAKDOWN T51): browsing shows no login wall, the "Who has my
// number?" teaser and alert toggles need a session, and the toggles default
// to §5b (api.alert_prefs_get: WhatsApp and the weekly digest on).

/// The Switch inside the toggle row named [title] (you_widgets.dart's
/// `YouToggleRow`: a title Column beside a Switch, both in one Row).
Finder switchFor(String title) => find.descendant(
  of: find.ancestor(of: find.text(title), matching: find.byType(Row)).first,
  matching: find.byType(Switch),
);

void main() {
  testWidgets('signed out: no sign-in text on screen, and no alert toggles', (tester) async {
    await pumpPlinth(tester, location: Routes.you);

    expect(find.text('Sign in with your phone'), findsNothing);
    expect(find.text('What have I agreed to?'), findsNothing);
    expect(find.text('Browse freely. Signing in only happens when you open Who has my number.'), findsOneWidget);

    final theme = find.text('How should Plinth look?');
    await scrollIntoView(tester, theme);
    expect(theme, findsOneWidget);

    final money = find.text('How we make money');
    await scrollIntoView(tester, money);
    expect(money, findsOneWidget);
    expect(find.textContaining('No developer pays us. Ever.'), findsOneWidget);
  });

  testWidgets('tapping Who has my number while signed out opens the sign-in sheet', (tester) async {
    await pumpPlinth(tester, location: Routes.you);
    await tester.tap(find.text('Who has my number?'));
    await tester.pumpAndSettle();
    expect(find.text('Sign in with your phone'), findsOneWidget);
  });

  testWidgets('signed in: shows the real count and alert toggles default to §5b', (tester) async {
    await pumpPlinth(tester, signedIn: true, location: Routes.you);

    expect(find.text('3 parties can reach you'), findsOneWidget);

    final waToggle = find.text('WhatsApp alerts for projects I follow');
    await scrollIntoView(tester, waToggle);
    expect(tester.widget<Switch>(switchFor('WhatsApp alerts for projects I follow')).value, isTrue);

    final digest = find.text('Weekly digest');
    await scrollIntoView(tester, digest);
    expect(tester.widget<Switch>(switchFor('Weekly digest')).value, isTrue);
    expect(find.textContaining('Sundays at 9 am'), findsOneWidget, reason: 'digest defaults on (§5b)');
  });

  testWidgets('turning WhatsApp off blocks the digest toggle with an explanation', (tester) async {
    await pumpPlinth(tester, signedIn: true, location: Routes.you);

    final waToggle = find.text('WhatsApp alerts for projects I follow');
    await scrollIntoView(tester, waToggle);
    await tester.tap(waToggle);
    await tester.pumpAndSettle();
    expect(tester.widget<Switch>(switchFor('WhatsApp alerts for projects I follow')).value, isFalse);

    final digest = find.text('Weekly digest');
    await scrollIntoView(tester, digest);
    await tester.tap(digest);
    await tester.pumpAndSettle();
    expect(find.text('Turn on WhatsApp alerts for projects I follow first.'), findsOneWidget);
    expect(tester.widget<Switch>(switchFor('Weekly digest')).value, isFalse, reason: 'the blocked tap changed nothing');
  });

  testWidgets('Day by default; picking Night updates the shared theme setting', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.you);
    expect(container.read(themeModeProvider), ThemeMode.light);

    final section = find.text('How should Plinth look?');
    await scrollIntoView(tester, section);
    await tester.tap(find.text('Night'));
    await tester.pumpAndSettle();

    expect(container.read(themeModeProvider), ThemeMode.dark);
  });
}
