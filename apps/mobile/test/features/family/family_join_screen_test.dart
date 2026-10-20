import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/family/family_copy.dart';
import 'package:plinth/features/family/family_join_screen.dart' show familyJoinScreenKey;

import '../../helpers/app_harness.dart';

/// The relative's opt-in screen (WORK_BREAKDOWN T50): public (no sign-in),
/// shows only what `api.family_invite_preview` confirms.
void main() {
  testWidgets('shows the invite exactly as the fixture answers it', (tester) async {
    await pumpPlinth(tester, location: Routes.familyJoinOf('AH2-7KQ'));
    expect(find.byKey(familyJoinScreenKey), findsOneWidget);
    expect(find.text('Rohan invited you'), findsOneWidget);
    expect(find.textContaining('Aurelia Heights, Phase 2'), findsWidgets);
    expect(find.text('RERA GGM/673/405/2022/117'), findsOneWidget);
    expect(
      find.text('An alert when its band changes, a QPR is filed or missed, its date moves or an order is passed.'),
      findsOneWidget,
    );
    expect(find.text('Rohan sees that you joined, never your number.'), findsOneWidget);
    expect(find.text(FamilyCopy.getAlertsOnWhatsApp), findsOneWidget);
  });

  testWidgets('"Not now" declines, honestly, without claiming a server record', (tester) async {
    await pumpPlinth(tester, location: Routes.familyJoinOf('AH2-7KQ'));
    await tester.tap(find.text(FamilyCopy.notNow));
    await tester.pumpAndSettle();
    expect(find.text(FamilyCopy.nothingWasSentTitle), findsOneWidget);
    expect(find.text(FamilyCopy.getAlertsOnWhatsApp), findsNothing);
  });

  testWidgets('an unknown code shows that the link no longer works', (tester) async {
    await pumpPlinth(tester, location: Routes.familyJoinOf('NOPE-000'));
    expect(find.byKey(familyJoinScreenKey), findsOneWidget);
    expect(find.text('This invite link no longer works.'), findsOneWidget);
  });
}
