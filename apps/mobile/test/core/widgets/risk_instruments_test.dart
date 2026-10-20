import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/risk/risk_icon_array.dart';
import 'package:plinth/core/widgets/risk/riskometer.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'kit_harness.dart';

void main() {
  setUpAll(KitFixtures.load);

  group('RiskHeader', () {
    testWidgets('the meter and band name are one heading; confidence sits apart', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        RiskHeader.fromSummary(
          KitFixtures.of(RiskState.elevated),
          caption: 'Delivery risk · data as of 14 Oct 2026',
          scale: RiskHeaderScale.poster,
        ),
      );
      expect(
        tester.getSemantics(find.bySemanticsLabel('Delivery risk Elevated, step 3 of 5')),
        isSemantics(isHeader: true),
      );
      expect(find.textContaining("We're less certain about this one.", findRichText: true), findsOneWidget);
      expect(find.text('Delivery risk · data as of 14 Oct 2026'), findsOneWidget);
      final name = tester.widget<Text>(find.text('Elevated'));
      expect(name.style!.color, PlinthTokens.day.risk.elevated.text);
      expect(name.style!.fontSize, 80);
      handle.dispose();
    });

    testWidgets('a red-flag band says so; non-band states stay at 40 at most', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        Column(
          children: [
            RiskHeader.fromSummary(KitFixtures.of(RiskState.severe)),
            RiskHeader.fromSummary(KitFixtures.of(RiskState.limited), scale: RiskHeaderScale.poster),
          ],
        ),
      );
      expect(find.bySemanticsLabel('Delivery risk Severe, step 5 of 5, set by a red-flag rule'), findsOneWidget);
      final limited = tester.widget<Text>(find.text(KitFixtures.of(RiskState.limited).chip.label));
      expect(limited.style!.fontSize, 40);
      expect(limited.style!.color, PlinthTokens.day.ink2);
      handle.dispose();
    });
  });

  group('BandScale', () {
    testWidgets('names the scale and the current band from server labels', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(tester, BandScale(labels: KitFixtures.bandLabels, state: RiskState.high));
      expect(
        find.bySemanticsLabel('Delivery risk scale from Low to Severe. This project: High, step 4 of 5.'),
        findsOneWidget,
      );
      expect(find.text('High'), findsOneWidget);
      expect(tester.widget<Text>(find.text('High')).style!.fontWeight, FontWeight.w700);
      expect(tester.widget<Text>(find.text('Low')).style!.fontWeight, FontWeight.w400);
      handle.dispose();
    });

    testWidgets('marks no band for a non-band state', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(tester, BandScale(labels: KitFixtures.bandLabels, state: RiskState.notScored));
      expect(find.bySemanticsLabel('Delivery risk scale from Low to Severe.'), findsOneWidget);
      handle.dispose();
    });
  });

  group('RiskIconArray', () {
    testWidgets('Aurelia: 30 filled, 15 hatched, 55 empty, read as the frequency sentence', (tester) async {
      final handle = tester.ensureSemantics();
      final aurelia = KitFixtures.of(RiskState.elevated);
      await pumpKit(tester, RiskIconArray.fromSummary(aurelia)!);
      final painter =
          tester
                  .widget<CustomPaint>(
                    find.descendant(of: find.byType(RiskIconArray), matching: find.byType(CustomPaint)),
                  )
                  .painter!
              as IconArrayPainter;
      final kinds = [for (var k = 0; k < 100; k++) painter.kindOf(k)];
      expect(kinds.where((k) => k == IconArrayCellKind.filled).length, 30);
      expect(kinds.where((k) => k == IconArrayCellKind.hatched).length, 15);
      expect(kinds.where((k) => k == IconArrayCellKind.empty).length, 55);
      // Row-major: the first row is all filled, the hatch starts at cell 30.
      expect(kinds.take(30).toSet(), {IconArrayCellKind.filled});
      expect(kinds[30], IconArrayCellKind.hatched);
      expect(
        tester.getSemantics(find.byType(RiskIconArray)),
        isSemantics(label: aurelia.frequency!.sentence, isImage: true),
      );
      expect(tester.getSize(find.byType(RiskIconArray)), const Size.square(18.0 * 10 + 4 * 9));
      handle.dispose();
    });

    test('no frequency, no array: a red-flag band and the non-band states', () {
      for (final s in [RiskState.severe, RiskState.limited, RiskState.notScored, RiskState.withheld]) {
        expect(RiskIconArray.fromSummary(KitFixtures.of(s)), isNull, reason: '$s');
      }
    });

    testWidgets('the legend shows the hatch line only when there is one', (tester) async {
      final kestrel = KitFixtures.of(RiskState.low);
      final aurelia = KitFixtures.of(RiskState.elevated);
      await pumpKit(
        tester,
        Column(
          children: [
            RiskIconArrayLegend(state: RiskState.elevated, hatchedText: aurelia.frequency!.hatchLegend),
            RiskIconArrayLegend(state: RiskState.low, hatchedText: kestrel.frequency!.hatchLegend),
          ],
        ),
      );
      expect(find.text("Hatched: the 15 of 100 we're less certain about"), findsOneWidget);
      expect(find.text(KitCopy.iconArrayFilled), findsNWidgets(2));
      expect(find.text(KitCopy.iconArrayEmpty), findsNWidgets(2));
    });
  });

  group('Riskometer', () {
    RiskometerPainter painter(WidgetTester tester) =>
        tester
                .widget<CustomPaint>(find.descendant(of: find.byType(Riskometer), matching: find.byType(CustomPaint)))
                .painter!
            as RiskometerPainter;

    testWidgets('the needle sweeps from −90° to the band in 1.4 s', (tester) async {
      await pumpKit(tester, Riskometer(state: RiskState.elevated, labels: KitFixtures.bandLabels), settle: false);
      expect(painter(tester).needleDegrees, -90);
      await tester.pump(const Duration(milliseconds: 500));
      expect(painter(tester).needleDegrees, inExclusiveRange(-90, 0));
      await tester.pumpAndSettle();
      expect(painter(tester).needleDegrees, 0);
      expect(painter(tester).current, 3);
      expect(Riskometer.angleOf(RiskState.low), -72);
      expect(Riskometer.angleOf(RiskState.severe), 72);
    });

    testWidgets('reduced motion, or sweep off, rests at the band at once', (tester) async {
      await pumpKit(
        tester,
        Riskometer(state: RiskState.high, labels: KitFixtures.bandLabels),
        reduceMotion: true,
        settle: false,
      );
      expect(painter(tester).needleDegrees, 36);
      expect(tester.hasRunningAnimations, isFalse);
      await pumpKit(
        tester,
        // A new dial (not an update of the one above), mounted without the sweep.
        Riskometer(key: const ValueKey('quiet'), state: RiskState.low, labels: KitFixtures.bandLabels, sweep: false),
        settle: false,
      );
      expect(painter(tester).needleDegrees, -72);
    });

    testWidgets('a non-band state has no needle; the label says where it points', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        Column(
          children: [
            Riskometer(state: RiskState.limited, labels: KitFixtures.bandLabels),
            Riskometer(state: RiskState.moderate, labels: KitFixtures.bandLabels),
          ],
        ),
      );
      final dials = find.byType(Riskometer);
      final first =
          tester.widget<CustomPaint>(find.descendant(of: dials.first, matching: find.byType(CustomPaint))).painter!
              as RiskometerPainter;
      expect(first.needleDegrees, isNull);
      expect(first.current, isNull);
      expect(
        find.bySemanticsLabel('Riskometer pointing to Moderate, step 2 of 5, on a scale from Low to Severe.'),
        findsOneWidget,
      );
      handle.dispose();
    });
  });

  testWidgets('every instrument fits a phone at 200% text in every state', (tester) async {
    await pumpKit(
      tester,
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final s in RiskState.values) ...[
            RiskChip.fromSummary(KitFixtures.of(s)),
            RiskHeader.fromSummary(KitFixtures.of(s), caption: 'Delivery risk · data as of 14 Oct 2026'),
            BandScale(labels: KitFixtures.bandLabels, state: s),
            Riskometer(state: s, labels: KitFixtures.bandLabels),
            ?RiskIconArray.fromSummary(KitFixtures.of(s), cell: 16),
            RiskIconArrayLegend(state: s, hatchedText: KitFixtures.of(s).frequency?.hatchLegend),
          ],
        ],
      ),
      textScale: 2,
    );
    expect(tester.takeException(), isNull);
  });
}
