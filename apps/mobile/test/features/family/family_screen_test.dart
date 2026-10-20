import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/family/family_copy.dart';
import 'package:plinth/features/family/family_screen.dart' show familyScreenKey;

import '../following/following_test_helpers.dart';

/// AppFamily's "Your circle" (WORK_BREAKDOWN T50): who follows with you,
/// invite someone on WhatsApp, and remove or cancel an invite with Undo.
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

  testWidgets('signed in, lists the circle and the default invite link', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    expect(find.text('Rohan (you)'), findsOneWidget);
    expect(find.text(FamilyCopy.meeraJoinedSub), findsOneWidget);
    expect(find.text(FamilyCopy.fatherInvitedSub), findsOneWidget);

    // The default scope is Aurelia Heights Ph 2: api.family_invite_create
    // answers with the AH2-7KQ fixture, and its bare link is shown.
    await tester.pumpAndSettle();
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

  testWidgets('Remove Meera, then Undo, restores her in the circle', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    await tester.pumpAndSettle();

    await tester.tap(find.text(FamilyCopy.remove));
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.removeMeeraTitle), findsOneWidget);

    await tester.tap(find.text(FamilyCopy.removeMeeraYes));
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.meeraRemovedSub), findsOneWidget);
    expect(find.text(FamilyCopy.removeMeeraToast), findsOneWidget);

    // "Undo" now reads on both the toast and the member row; either one
    // calls the same undo.
    await tester.tap(find.text(FamilyCopy.undo).first);
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.meeraJoinedSub), findsOneWidget);
    expect(find.text(FamilyCopy.meeraRemovedSub), findsNothing);
  });

  testWidgets('cancelling the invite, then Undo, restores it', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    await tester.pumpAndSettle();

    await tester.tap(find.text(FamilyCopy.cancelInvite));
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.cancelFatherTitle), findsOneWidget);

    // "Cancel invite" also names the member row's own action (still in the
    // tree behind the sheet); the sheet's own "Cancel invite" button is last.
    await tester.tap(find.text(FamilyCopy.cancelFatherYes).last);
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.fatherCancelledSub), findsOneWidget);

    await tester.tap(find.text(FamilyCopy.undo).first);
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.fatherInvitedSub), findsOneWidget);
  });

  testWidgets('declining to remove Meera keeps her in the circle', (tester) async {
    await pumpSignedIn(tester, location: Routes.family);
    await tester.pumpAndSettle();

    await tester.tap(find.text(FamilyCopy.remove));
    await tester.pumpAndSettle();
    await tester.tap(find.text(FamilyCopy.removeMeeraNo));
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.meeraJoinedSub), findsOneWidget);
  });
}
