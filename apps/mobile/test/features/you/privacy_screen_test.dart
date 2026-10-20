import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/you/you_widgets.dart';

import '../../helpers/app_harness.dart';

// AppYou's Privacy screen (WORK_BREAKDOWN T51 accept): withdrawing C-1012-04
// changes the active count to 2, every consent ref matches C-MMDD-NN, no
// lender ever appears among the parties who can reach the buyer, and
// download/delete are honest about fixture mode (AGENTS.md rule 9).
final _refRe = RegExp(r'^C-\d{4}-\d{2}$');

void main() {
  testWidgets('loads with 3 active parties, no lender among them, and every ref matches C-MMDD-NN', (tester) async {
    await pumpPlinth(tester, signedIn: true, location: Routes.privacy);

    expect(find.text('3 parties can reach you right now; a relay doesn\'t count.'), findsOneWidget);
    expect(find.text('Orbis Land site office'), findsOneWidget);
    expect(find.text('Larkspur Realty'), findsOneWidget);
    expect(find.text('Meridian Habitat site office'), findsOneWidget);
    expect(find.textContaining('lender', findRichText: true), findsNothing);

    for (final ref in ['C-1012-04', 'C-1012-05', 'C-1015-02', 'C-1018-11', 'C-0902-01']) {
      expect(ref, matches(_refRe));
      final finder = find.textContaining(ref);
      await scrollIntoView(tester, finder.first);
      expect(finder, findsWidgets, reason: ref);
    }
  });

  testWidgets('withdrawing C-1012-04 changes the count to 2', (tester) async {
    await pumpPlinth(tester, signedIn: true, location: Routes.privacy);
    expect(find.text('3 parties can reach you right now; a relay doesn\'t count.'), findsOneWidget);

    final orbis = find.text('Orbis Land site office');
    await scrollIntoView(tester, orbis);
    final revoke = find.descendant(
      of: find.ancestor(of: orbis, matching: find.byType(YouPanel)),
      matching: find.text('Revoke'),
    );
    await tester.tap(revoke);
    await tester.pumpAndSettle();

    expect(find.text('Stop sharing your number with Orbis Land site office?'), findsOneWidget);
    await tester.tap(find.text('Stop sharing'));
    await tester.pumpAndSettle();

    expect(find.text('2 parties can reach you right now; a relay doesn\'t count.'), findsOneWidget);

    final history = find.text('What did I say yes to?');
    await scrollIntoView(tester, history);
    expect(find.text('withdrawn'), findsOneWidget);
  });

  testWidgets('download and delete are honest about fixture mode: no confirmation without a record', (tester) async {
    await pumpPlinth(tester, signedIn: true, location: Routes.privacy);

    final download = find.text('Prepare download');
    await scrollIntoView(tester, download);
    await tester.tap(download);
    await tester.pumpAndSettle();
    expect(find.textContaining('nothing was saved'), findsOneWidget);

    final delete = find.text('Delete my account');
    await scrollIntoView(tester, delete.last);
    await tester.tap(delete.last);
    await tester.pumpAndSettle();

    await tester.tap(find.text("I understand this can't be undone."));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Yes, delete my account'));
    await tester.pumpAndSettle();

    expect(find.textContaining('your account closes today and we erase your data within 30 days'), findsOneWidget);
  });
}
