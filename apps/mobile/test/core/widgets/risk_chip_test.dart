import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/risk/risk_meter.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_contracts/plinth_contracts.dart' as c;
import 'package:plinth_tokens/plinth_tokens.dart';

import 'kit_harness.dart';

void main() {
  setUpAll(KitFixtures.load);

  group('RiskChip', () {
    testWidgets('reads "Delivery risk Elevated, step 3 of 5" as one node', (tester) async {
      final handle = tester.ensureSemantics();
      final aurelia = KitFixtures.of(RiskState.elevated);
      await pumpKit(tester, RiskChip(chip: aurelia.chip));
      expect(find.bySemanticsLabel('Delivery risk Elevated, step 3 of 5'), findsOneWidget);
      // The visible label is the server's, not composed here.
      expect(find.textContaining('Elevated', findRichText: true), findsOneWidget);
      handle.dispose();
    });

    testWidgets('adds confidence and the red-flag rule from the summary', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        Column(
          children: [
            RiskChip.fromSummary(KitFixtures.of(RiskState.elevated)),
            RiskChip.fromSummary(KitFixtures.of(RiskState.low)),
            RiskChip.fromSummary(KitFixtures.of(RiskState.severe)),
          ],
        ),
      );
      expect(find.bySemanticsLabel('Delivery risk Elevated, step 3 of 5, low confidence'), findsOneWidget);
      expect(find.bySemanticsLabel('Delivery risk Low, step 1 of 5, high confidence'), findsOneWidget);
      expect(find.bySemanticsLabel('Delivery risk Severe, step 5 of 5, set by a red-flag rule'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('every fixture state renders its own label and meter', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        Column(children: [for (final s in RiskState.values) RiskChip(chip: KitFixtures.of(s).chip)]),
      );
      for (final s in RiskState.values) {
        final chip = KitFixtures.of(s).chip;
        expect(RiskState.ofChip(chip), s, reason: '${stateFixtures[s]} reads as $s');
        final label = s.isBand
            ? 'Delivery risk ${chip.label}, step ${s.step} of 5'
            : 'Delivery risk ${chip.label.replaceAll(' · ', ', ')}';
        expect(find.bySemanticsLabel(label), findsOneWidget, reason: label);
      }
      expect(find.bySemanticsLabel('Delivery risk Not enough history to score, no penalty'), findsOneWidget);
      expect(find.bySemanticsLabel('Delivery risk Band withheld, facts only'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('sits on the band fill, or on track when not a band', (tester) async {
      await pumpKit(
        tester,
        Column(
          children: [
            RiskChip(chip: KitFixtures.of(RiskState.high).chip),
            RiskChip(chip: KitFixtures.of(RiskState.limited).chip),
          ],
        ),
      );
      Color fillOf(int i) =>
          (tester
                      .widget<DecoratedBox>(
                        find.descendant(of: find.byType(RiskChip).at(i), matching: find.byType(DecoratedBox)).first,
                      )
                      .decoration
                  as BoxDecoration)
              .color!;
      expect(fillOf(0), PlinthTokens.day.risk.high.fill);
      expect(fillOf(1), PlinthTokens.day.track);
    });

    testWidgets('wraps inside the pill at 200% text without overflowing', (tester) async {
      await pumpKit(
        tester,
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [for (final s in RiskState.values) RiskChip.fromSummary(KitFixtures.of(s))],
        ),
        textScale: 2,
      );
      expect(tester.takeException(), isNull);
      final juniper = tester.getSize(find.byType(RiskChip).at(RiskState.limited.index));
      expect(juniper.width, lessThanOrEqualTo(360 - 32));
      expect(juniper.height, greaterThan(PlinthComponents.chipHeight * 2), reason: 'the long label wrapped');
    });

    test('an unknown chip kind from a newer server reads as Not scored', () {
      final chip = c.Chip(kind: 'something_new', label: 'New', meterFilled: 0, step: null);
      expect(RiskState.ofChip(chip), RiskState.notScored);
      final broken = c.Chip(kind: c.ChipKind.band, label: 'Odd', meterFilled: 9, step: 9);
      expect(RiskState.ofChip(broken), RiskState.notScored);
    });
  });

  group('RiskMeter', () {
    RiskMeterPainter painterIn(WidgetTester tester, Finder meter) =>
        tester.widget<CustomPaint>(find.descendant(of: meter, matching: find.byType(CustomPaint))).painter!
            as RiskMeterPainter;

    testWidgets('fills `step` segments for each band, none otherwise', (tester) async {
      await pumpKit(tester, Column(children: [for (final s in RiskState.values) RiskMeter(state: s)]));
      for (final s in RiskState.values) {
        final p = painterIn(tester, find.byType(RiskMeter).at(s.index));
        expect(p.filledSegments, s.step, reason: '$s');
        expect(p.mode, s.meterMode);
      }
      expect(RiskState.limited.meterMode, RiskMeterMode.dashed);
      expect(RiskState.notScored.meterMode, RiskMeterMode.outlined);
      expect(RiskState.withheld.meterMode, RiskMeterMode.withheld);
    });

    testWidgets('steps from Moderate to Elevated (the band-steps move)', (tester) async {
      await pumpKit(tester, const RiskMeter(state: RiskState.elevated, fillFrom: 2), settle: false);
      final meter = find.byType(RiskMeter);
      expect(painterIn(tester, meter).filledSegments, 2);
      await tester.pump(const Duration(milliseconds: 200));
      expect(painterIn(tester, meter).fill, inExclusiveRange(2, 3));
      await tester.pumpAndSettle();
      expect(painterIn(tester, meter).filledSegments, 3);
    });

    testWidgets('under reduced motion it shows the end state at once', (tester) async {
      await pumpKit(tester, const RiskMeter(state: RiskState.elevated, fillFrom: 2), reduceMotion: true, settle: false);
      expect(painterIn(tester, find.byType(RiskMeter)).filledSegments, 3);
      expect(tester.hasRunningAnimations, isFalse);
    });

    testWidgets('animates when the band changes', (tester) async {
      final band = ValueNotifier(RiskState.moderate);
      await pumpKit(
        tester,
        ValueListenableBuilder(
          valueListenable: band,
          builder: (_, s, _) => RiskMeter(state: s),
        ),
      );
      band.value = RiskState.high;
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      expect(painterIn(tester, find.byType(RiskMeter)).fill, inExclusiveRange(2, 4));
      await tester.pumpAndSettle();
      expect(painterIn(tester, find.byType(RiskMeter)).filledSegments, 4);
    });

    testWidgets('is labelled only when it stands alone', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        const Column(
          children: [
            RiskMeter(state: RiskState.high, semanticLabel: 'Delivery risk High, step 4 of 5'),
            RiskMeter(state: RiskState.low),
          ],
        ),
      );
      expect(
        tester.getSemantics(find.byType(RiskMeter).first),
        isSemantics(label: 'Delivery risk High, step 4 of 5', isImage: true),
      );
      expect(find.bySemanticsLabel(RegExp('Low')), findsNothing);
      handle.dispose();
    });
  });

  group('ConfidenceDots', () {
    testWidgets('two dots: the second hollow when confidence is low', (tester) async {
      await pumpKit(
        tester,
        const Column(
          children: [
            ConfidenceDots(level: c.ConfidenceLevel.high),
            ConfidenceDots(level: c.ConfidenceLevel.low),
          ],
        ),
      );
      List<BoxDecoration> dots(int i) => [
        for (final w in tester.widgetList<Container>(
          find.descendant(of: find.byType(ConfidenceDots).at(i), matching: find.byType(Container)),
        ))
          w.decoration! as BoxDecoration,
      ];
      expect(dots(0).map((d) => d.border), [null, null]);
      expect(dots(1).first.border, isNull);
      expect(dots(1).last.border, isNotNull);
      expect(dots(1).last.color, isNull);
    });
  });
}
