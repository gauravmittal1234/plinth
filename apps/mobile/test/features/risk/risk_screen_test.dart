import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/risk/risk_screen.dart';

import '../../helpers/app_harness.dart';

/// AppRisk (WORK_BREAKDOWN T32): the Aurelia fixture (Elevated, with a
/// pending QPR). Golden pixels live in risk_screen_golden_test.dart.
void main() {
  testWidgets('shows the band poster and the frequency sentence', (tester) async {
    await pumpPlinth(tester, location: Routes.riskOf('aurelia-heights-phase-2'));
    expect(find.byKey(riskScreenKey), findsOneWidget);
    expect(find.text('Elevated'), findsWidgets);

    final frequencySentence = find.text(
      'Between 30 and 45 of 100 similar Gurugram projects got their OC more than '
      '12 months after the original RERA date.',
    );
    await scrollIntoView(tester, frequencySentence);
    expect(frequencySentence, findsOneWidget);
  });

  testWidgets('shows the developer reply and the one pending fact', (tester) async {
    await pumpPlinth(tester, location: Routes.riskOf('aurelia-heights-phase-2'));

    final devSays = find.text('Developer says · not yet verified · 15 Oct 2026 · we check it by 5 Nov 2026');
    await scrollIntoView(tester, devSays);
    expect(devSays, findsOneWidget);

    final pending = find.textContaining('The Jul–Sep 2026 QPR is not on HARERA yet.');
    await scrollIntoView(tester, pending);
    expect(pending, findsOneWidget, reason: 'the one pending fact');
  });

  testWidgets('opening a source chip opens the evidence sheet for that fact', (tester) async {
    await pumpPlinth(tester, location: Routes.riskOf('aurelia-heights-phase-2'));

    // Reason 2 (Timeline)'s one source: "HARERA QPR register". The chip's
    // label sits in a Text.rich beside its document icon, so it is found by
    // substring (the icon is a WidgetSpan placeholder character).
    final source = find.textContaining('HARERA QPR register');
    await scrollIntoView(tester, source);
    // A chip right at the viewport's top edge can land under the app bar:
    // nudge it clear before tapping.
    await tester.drag(find.byType(Scrollable).first, const Offset(0, 120));
    await tester.pumpAndSettle();
    await tester.tap(source);
    await tester.pumpAndSettle();

    // The evidence sheet for reason 2 of 4: dates, the extract listing the
    // 3 late quarters, the read note and "View on HARERA" (Accept: T32).
    expect(find.text('Register checked live 14 Oct 2026'), findsOneWidget, reason: 'dates');
    expect(
      find.textContaining('Jul–Sep 2024 (12 days late), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days)'),
      findsOneWidget,
      reason: 'extract',
    );
    expect(find.textContaining('Due and filing dates read by software.'), findsOneWidget, reason: 'how we read it');
    expect(find.textContaining('View on HARERA'), findsOneWidget);
  });

  testWidgets('the pre-RERA history is collapsed by default and opens on tap', (tester) async {
    await pumpPlinth(tester, location: Routes.riskOf('aurelia-heights-phase-2'));

    final toggle = find.text('Before RERA · from court orders and news');
    await scrollIntoView(tester, toggle);
    expect(find.text('Northfield Greens, Sector 52'), findsNothing);

    await tester.tap(toggle);
    await tester.pumpAndSettle();
    final item = find.textContaining('Northfield Greens, Sector 52');
    await scrollIntoView(tester, item);
    expect(item, findsOneWidget);
    expect(find.text('None of this counts in the band.'), findsOneWidget);
  });

  testWidgets('so what now lists the next steps', (tester) async {
    await pumpPlinth(tester, location: Routes.riskOf('aurelia-heights-phase-2'));
    final heading = find.text('So what do we do now?');
    await scrollIntoView(tester, heading);
    expect(heading, findsOneWidget);
  });
}
