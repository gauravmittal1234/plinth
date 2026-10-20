import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/following/following_copy.dart';
import 'package:plinth/features/following/following_screen.dart' show followingScreenKey;

import 'following_test_helpers.dart';

/// AppFollowing (WORK_BREAKDOWN T50): opens on Updates with the "Since you
/// last looked" block, the follow-type sheet, and family faces.
void main() {
  testWidgets('signed out, browsing never forces sign-in', (tester) async {
    await pumpPlinth(tester, location: Routes.following);
    expect(find.byKey(followingScreenKey), findsOneWidget);
    expect(find.text(FollowingCopy.signInToSeeFollows), findsOneWidget);
    expect(find.text('Sign in with your phone'), findsNothing);
  });

  testWidgets('signed in, opens on Updates with 5 unread since the last look', (tester) async {
    await pumpSignedIn(tester, location: Routes.following);
    expect(find.text('${FollowingCopy.updatesTab} 5'), findsOneWidget);
    expect(find.textContaining('5 unread'), findsOneWidget);
    expect(find.text('What changed since 14 Oct?'), findsOneWidget);
    // Every one of the 5 unread changes is on screen.
    expect(
      find.text('New price list from the developer: 3 BHK quoted ₹1.95 Cr. All-in is now about ₹2.27 Cr.'),
      findsOneWidget,
    );
  });

  testWidgets('the Projects tab lists every followed project with its band', (tester) async {
    await pumpSignedIn(tester, location: Routes.following);
    await tester.tap(find.text(FollowingCopy.projectsTab));
    await tester.pumpAndSettle();
    expect(find.text('Sapphire Grove, Phase 1'), findsOneWidget);
    expect(find.text('Coral Towers'), findsOneWidget);
    expect(find.text('Aurelia Heights, Phase 2'), findsOneWidget);
    expect(find.text('Kestrel Park'), findsOneWidget);
    expect(find.text('Meera follows too'), findsWidgets);
  });

  testWidgets('a project row opens the follow-type sheet, and a choice is saved', (tester) async {
    await pumpSignedIn(tester, location: Routes.following);
    await tester.tap(find.text(FollowingCopy.projectsTab));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Just watching').first);
    await tester.pumpAndSettle();
    expect(find.text(FollowingCopy.haveYouBookedHere), findsOneWidget);
    expect(find.text(FollowingCopy.typeNotePrivate), findsOneWidget);

    await tester.tap(find.text(FollowingCopy.bookedTitle));
    await tester.pumpAndSettle();
    expect(find.text(FollowingCopy.typeNoteSaved), findsOneWidget);

    await tester.tap(find.text(FollowingCopy.done));
    await tester.pumpAndSettle();
    expect(find.text('Booked here'), findsOneWidget);
  });

  testWidgets('the family circle row opens the family circle', (tester) async {
    final container = await pumpSignedIn(tester, location: Routes.following);
    expect(find.text(FollowingCopy.familyCircle), findsOneWidget);
    await tester.tap(find.text(FollowingCopy.familyCircle));
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.family);
  });
}
