import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/family/family_copy.dart';
import 'package:plinth/features/family/family_screen.dart' show familyScreenKey;

import '../following/following_test_helpers.dart';

/// AppFamily's "Your circle" (WORK_BREAKDOWN T50): invite someone on
/// WhatsApp, and see what they'd get.
///
/// `api.family_circle` has no read contract or fixture yet (T45a), so this
/// screen never claims who is actually in the circle (AGENTS.md: facts come
/// from data, never code). These tests check it shows only the signed-in
/// buyer's own row, an honest "no members yet" line, and the real invite
/// the fixture answers with.
void main() {
  // "Copy link" calls Clipboard.setData, which needs a mock handler here:
  // tests run in a FakeAsync zone where an unmocked platform channel call
  // never resolves (flutter_test's TestDefaultBinaryMessenger doc comment).
  setUp(() {
    TestWidgetsFlutterBinding.ensureInitialized().defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (MethodCall methodCall) async => null,
    );
  });

  tearDown(() {
    TestWidgetsFlutterBinding.ensureInitialized().defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      null,
    );
  });

  testWidgets('signed out, browsing never forces sign-in', (tester) async {
    await pumpPlinth(tester, location: Routes.family);
    expect(find.byKey(familyScreenKey), findsOneWidget);
    expect(find.text(FamilyCopy.signInToSeeCircle), findsOneWidget);
    expect(find.text('Sign in with your phone'), findsNothing);
  });

  testWidgets('signed in, shows only the buyer\'s own row and the default invite link', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    await tester.pumpAndSettle();

    // Your own row, with no invented name. "You" also names the You tab in
    // the bottom nav still showing underneath, so scope to the circle list.
    expect(find.descendant(of: find.byType(ListView), matching: find.text(FamilyCopy.you)), findsOneWidget);
    // No named member is claimed without a recorded api.family_circle
    // answer (there is none yet): the honest line instead.
    expect(find.text(FamilyCopy.membersAppearLine), findsOneWidget);
    expect(find.text('Meera'), findsNothing);
    expect(find.text('Meera’s father'), findsNothing);
    expect(find.text('Rohan (you)'), findsNothing);

    // The default scope is Aurelia Heights Ph 2: api.family_invite_create
    // answers with the AH2-7KQ fixture, and its bare link is shown.
    expect(find.text('plinth.in/j/AH2-7KQ'), findsOneWidget);
  });

  testWidgets('picking "All 4 projects" produces the RC4-2MW link', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    await tester.pumpAndSettle();
    await tester.tap(find.text(FamilyCopy.scopeAll));
    await tester.pumpAndSettle();
    expect(find.text('plinth.in/j/RC4-2MW'), findsOneWidget);
  });

  testWidgets('copying the link shows a status line with it', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    await tester.pumpAndSettle();
    await tester.tap(find.text(FamilyCopy.copyLink));
    await tester.pumpAndSettle();
    expect(find.textContaining('Copied plinth.in/j/AH2-7KQ'), findsOneWidget);
  });
}
