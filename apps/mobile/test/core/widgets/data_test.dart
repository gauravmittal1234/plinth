import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/data/tower_stack.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'kit_harness.dart';

void main() {
  setUpAll(KitFixtures.load);

  group('TowerStack', () {
    List<SlabPainter> slabs(WidgetTester tester) => [
      for (final p in tester.widgetList<CustomPaint>(
        find.descendant(of: find.byType(TowerStack), matching: find.byType(CustomPaint)),
      ))
        p.painter! as SlabPainter,
    ];

    testWidgets('20 slabs; the built ones fill in 45 ms apart', (tester) async {
      await pumpKit(tester, const TowerStack(built: 9), settle: false);
      expect(slabs(tester), hasLength(20));
      expect(slabs(tester).every((s) => s.built == 0), isTrue);
      await tester.pump(const Duration(milliseconds: 300));
      final mid = slabs(tester);
      expect(mid.first.built, greaterThan(mid[5].built), reason: 'lower slabs lead');
      await tester.pumpAndSettle();
      final done = slabs(tester);
      expect(done.take(9).every((s) => s.built == 1), isTrue);
      expect(done.skip(9).every((s) => s.built == 0), isTrue);
    });

    testWidgets('outlines the sold level in that quarter\'s band ink', (tester) async {
      await pumpKit(tester, const TowerStack(built: 8, soldFloor: 14, soldBand: RiskState.moderate));
      final s = slabs(tester);
      expect(s[13].sold, PlinthTokens.day.risk.moderate.ink);
      expect(s.where((p) => p.sold != null), hasLength(1));
    });

    testWidgets('reduced motion shows the built slabs at once; a change re-fills', (tester) async {
      final built = ValueNotifier(4);
      await pumpKit(
        tester,
        ValueListenableBuilder(
          valueListenable: built,
          builder: (_, b, _) => TowerStack(built: b),
        ),
        reduceMotion: true,
        settle: false,
      );
      expect(slabs(tester).where((s) => s.built == 1), hasLength(4));
      built.value = 9;
      await tester.pump();
      expect(slabs(tester).where((s) => s.built == 1), hasLength(9));
    });

    testWidgets('is hidden from screen readers (the tiles say it in words)', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        const Column(
          children: [
            TowerStack(built: 8),
            Row(
              children: [
                Expanded(
                  child: FactTile(label: 'Built', value: '41%'),
                ),
                Expanded(
                  child: FactTile(label: 'Sold', value: '72%'),
                ),
                Expanded(
                  child: FactTile(label: 'Time used', value: '77%'),
                ),
              ],
            ),
          ],
        ),
      );
      expect(find.bySemanticsLabel('Built\n41%'), findsOneWidget);
      expect(find.bySemanticsLabel('Time used\n77%'), findsOneWidget);
      handle.dispose();
    });

    test('the slab transform follows the artboard\'s CSS', () {
      // Higher slabs project higher on screen (towards the viewer).
      final low = _project(TowerStack.slabTransform(0, 78), Offset.zero);
      final high = _project(TowerStack.slabTransform(19, 78), Offset.zero);
      expect(high.dy, lessThan(low.dy - 100));
    });
  });

  group('ReplaySlider', () {
    testWidgets('steps through Aurelia\'s eight QPR quarters by slider and buttons', (tester) async {
      final handle = tester.ensureSemantics();
      final quarters = KitFixtures.aurelia.progress.quarters;
      final labels = [for (final q in quarters) q.label];
      final index = ValueNotifier(labels.length - 1);
      await pumpKit(
        tester,
        ValueListenableBuilder(
          valueListenable: index,
          builder: (_, i, _) => Column(
            children: [
              ReplayStepButtons(index: i, count: labels.length, onChanged: (v) => index.value = v),
              ReplaySlider(labels: labels, index: i, onChanged: (v) => index.value = v),
            ],
          ),
        ),
      );
      expect(find.text('Apr–Jun 2026'), findsNWidgets(2), reason: 'the heading and the last edge label');
      expect(find.text('Report 8 of 8 shown'), findsOneWidget);
      expect(
        tester.getSemantics(find.bySemanticsLabel(KitCopy.laterReport)),
        isSemantics(isButton: true, isEnabled: false, hasEnabledState: true),
      );

      await tester.tap(find.bySemanticsLabel(KitCopy.earlierReport));
      await tester.pumpAndSettle();
      expect(index.value, 6);
      expect(find.text('Jan–Mar 2026'), findsOneWidget);
      expect(find.text('Report 7 of 8 shown'), findsOneWidget);

      expect(find.semantics.byValue('Jan–Mar 2026'), findsOne);
      // The slider's own decrease action moves one quarter.
      tester.semantics.decrease(find.semantics.byValue('Jan–Mar 2026'));
      await tester.pumpAndSettle();
      expect(index.value, 5);

      index.value = 0;
      await tester.pumpAndSettle();
      expect(tester.getSemantics(find.bySemanticsLabel(KitCopy.earlierReport)), isSemantics(isEnabled: false));
      handle.dispose();
    });
  });

  group('CostTable', () {
    testWidgets('Aurelia: every charge, the All-in total and how far over the quote', (tester) async {
      final handle = tester.ensureSemantics();
      final cost = KitFixtures.aurelia.cost!;
      await pumpKit(tester, CostTable.fromProjectCost(cost));
      expect(find.text('Base'), findsOneWidget);
      expect(find.text('₹2.35 Cr'), findsOneWidget);
      expect(find.text('All-in'), findsOneWidget);
      expect(find.text('₹2.74 Cr'), findsOneWidget);
      expect(find.text('17% more than quoted · ₹18,900 per sq ft carpet'), findsOneWidget);
      expect(find.text('often negotiable'), findsNWidgets(2));
      expect(find.bySemanticsLabel('PLC (park-facing)\noften negotiable\n₹2.9 L'), findsOneWidget);
      handle.dispose();
    });
  });

  testWidgets('data widgets fit a phone at 200% text', (tester) async {
    final quarters = KitFixtures.aurelia.progress.quarters;
    await pumpKit(
      tester,
      Column(
        children: [
          CostTable.fromProjectCost(KitFixtures.aurelia.cost!),
          ReplaySlider(labels: [for (final q in quarters) q.label], index: 7, onChanged: (_) {}),
          ReplayStepButtons(index: 3, count: 8, onChanged: (_) {}),
          const Row(
            children: [
              Expanded(
                child: FactTile(label: 'Built', value: '41%'),
              ),
              Expanded(
                child: FactTile(label: 'Time used', value: '77%'),
              ),
            ],
          ),
          const TowerStack(built: 8, soldFloor: 14, soldBand: RiskState.elevated),
        ],
      ),
      textScale: 2,
    );
    expect(tester.takeException(), isNull);
  });
}

Offset _project(Matrix4 m, Offset p) => MatrixUtils.transformPoint(m, p);
