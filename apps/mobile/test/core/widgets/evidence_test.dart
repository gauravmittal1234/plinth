import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'kit_harness.dart';

void main() {
  setUpAll(KitFixtures.load);

  group('ReasonList', () {
    testWidgets('a real list, strongest first, each source opening its own evidence', (tester) async {
      final handle = tester.ensureSemantics();
      final aurelia = KitFixtures.of(RiskState.elevated);
      final opened = <(int, String)>[];
      await pumpKit(
        tester,
        ReasonList(reasons: aurelia.reasons, onSource: (r, s) => opened.add((r.rank, s.factIds.first))),
      );
      // Factor group written into the sentence; no index numbers on screen.
      expect(find.textContaining('Finances: 72% of units sold, 41% built.', findRichText: true), findsOneWidget);
      expect(find.text('1'), findsNothing);

      final list = tester.getSemantics(find.byType(ReasonList));
      expect(list.role, SemanticsRole.list);
      final items = <SemanticsNode>[];
      list.visitChildren((n) {
        items.add(n);
        return true;
      });
      expect(items.map((n) => n.role), List.filled(4, SemanticsRole.listItem));

      await tester.tap(find.textContaining('HARERA QPR register', findRichText: true));
      await tester.pumpAndSettle();
      expect(opened, [(2, 'dff74c62-2384-5736-88b1-02fac3a33a69')]);
      handle.dispose();
    });

    testWidgets('renders nothing without reasons', (tester) async {
      await pumpKit(tester, ReasonList(reasons: KitFixtures.of(RiskState.limited).reasons, onSource: (_, _) {}));
      expect(tester.getSize(find.byType(ReasonList)), Size.zero);
    });

    testWidgets('reduced motion shows every reason at once', (tester) async {
      await pumpKit(
        tester,
        ReasonList(reasons: KitFixtures.of(RiskState.elevated).reasons, onSource: (_, _) {}),
        reduceMotion: true,
        settle: false,
      );
      for (final o in tester.widgetList<Opacity>(
        find.descendant(of: find.byType(ReasonList), matching: find.byType(Opacity)),
      )) {
        expect(o.opacity, 1);
      }
    });
  });

  group('SourceChip', () {
    testWidgets('a tone pill, 48 dp tall to tap, read as a button', (tester) async {
      final handle = tester.ensureSemantics();
      var taps = 0;
      await pumpKit(
        tester,
        Wrap(
          children: [
            SourceChip(label: 'HARERA QPR · Apr–Jun 2026', onPressed: () => taps++),
            SourceChip(label: 'On track', ground: SourceChipGround.track, onPressed: () {}),
            SourceChip(label: 'On claim', ground: SourceChipGround.claim, onPressed: () {}),
            SourceChip(label: 'Short', onPressed: () {}),
          ],
        ),
      );
      // A one-line chip is exactly the 48 dp target; a wrapped one grows.
      expect(tester.getSize(find.byType(SourceChip).at(3)).height, PlinthLayout.touchApp);
      expect(tester.getSize(find.byType(SourceChip).first).height, greaterThanOrEqualTo(PlinthLayout.touchApp));
      expect(
        tester.getSemantics(find.byType(SourceChip).first),
        isSemantics(label: 'HARERA QPR · Apr–Jun 2026', hint: KitCopy.openEvidence, isButton: true, hasTapAction: true),
      );
      await tester.tap(find.byType(SourceChip).first);
      expect(taps, 1);
      Color fill(int i) =>
          (tester
                      .widget<DecoratedBox>(
                        find.descendant(of: find.byType(SourceChip).at(i), matching: find.byType(DecoratedBox)),
                      )
                      .decoration
                  as BoxDecoration)
              .color!;
      expect(
        [fill(0), fill(1), fill(2)],
        [PlinthTokens.day.chipFill, PlinthTokens.day.chipFillOnTrack, PlinthTokens.day.chipFillOnClaim],
      );
      handle.dispose();
    });
  });

  group('EvidenceSheet', () {
    testWidgets('reason 2 lists the three late filings, from the evidence fixture', (tester) async {
      final aurelia = KitFixtures.of(RiskState.elevated);
      final evidence = KitFixtures.evidenceFor(aurelia, 2);
      await pumpKit(
        tester,
        SizedBox(
          height: 760,
          child: EvidenceSheet(
            evidence: evidence,
            fact: aurelia.reasons[1].text,
            subtitle: 'Evidence for reason 2 of 4',
            highlight: '3 of the last 8 quarters',
          ),
        ),
      );
      expect(find.text('HARERA QPR register'), findsOneWidget);
      expect(find.text('Records show', findRichText: true), findsNothing);
      expect(find.textContaining('Records show', findRichText: true), findsOneWidget);
      expect(
        find.textContaining(
          'Jul–Sep 2024 (12 days late), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days)',
          findRichText: true,
        ),
        findsOneWidget,
      );
      expect(find.text('3 of the last 8 quarters'), findsOneWidget, reason: 'the highlighted figure');
      expect(find.text('Extract · register'), findsOneWidget);
      expect(find.text(KitCopy.evidenceNoDeveloperNote), findsOneWidget);
      expect(find.text(evidence.correctionsLine), findsOneWidget);
      expect(find.textContaining('View on HARERA', findRichText: true), findsOneWidget);
    });

    testWidgets('opens as a sheet; buttons call back; Copy citation confirms; close pops', (tester) async {
      final evidence = KitFixtures.evidenceFor(KitFixtures.of(RiskState.elevated), 1);
      final calls = <String>[];
      await pumpKit(
        tester,
        Builder(
          builder: (context) => PlinthButton(
            label: 'Open',
            onPressed: () => showEvidenceSheet(
              context,
              evidence: evidence,
              onOpenOriginal: () => calls.add('original'),
              onOpenArchive: () => calls.add('archive'),
              onReportError: () => calls.add('report'),
              onCopyCitation: () => calls.add('cite'),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Open', findRichText: true));
      await tester.pumpAndSettle();
      expect(find.byType(EvidenceSheet), findsOneWidget);

      Future<void> tapText(String text) async {
        final target = find.textContaining(text, findRichText: true);
        await tester.ensureVisible(target);
        await tester.pumpAndSettle();
        await tester.tap(target);
        await tester.pump();
      }

      await tapText('View on HARERA');
      await tapText(KitCopy.archivedCopy);
      await tapText(KitCopy.reportError);
      await tapText(KitCopy.copyCitation);
      expect(calls, ['original', 'archive', 'report', 'cite']);
      expect(find.textContaining(KitCopy.citationCopied, findRichText: true), findsOneWidget);

      await tester.tap(find.byTooltip(KitCopy.closeEvidence));
      await tester.pumpAndSettle();
      expect(find.byType(EvidenceSheet), findsNothing);
    });

    testWidgets('fits a phone at 200% text', (tester) async {
      final evidence = KitFixtures.evidenceFor(KitFixtures.of(RiskState.elevated), 2);
      await pumpKit(
        tester,
        SizedBox(
          height: 760,
          child: EvidenceSheet(evidence: evidence, fact: 'x', subtitle: 'y'),
        ),
        textScale: 2,
      );
      expect(tester.takeException(), isNull);
    });
  });

  group('claims and notes', () {
    testWidgets('Developer says is a claim tone field, never an outline', (tester) async {
      final aurelia = KitFixtures.of(RiskState.elevated);
      await pumpKit(tester, DeveloperSaysField.fromResponse(aurelia.developerResponse!, note: 'Via the reply portal.'));
      final box =
          tester
                  .widget<DecoratedBox>(
                    find.descendant(of: find.byType(DeveloperSaysField), matching: find.byType(DecoratedBox)).first,
                  )
                  .decoration
              as BoxDecoration;
      expect(box.color, PlinthTokens.day.claimBg);
      expect(box.border, isNull);
      expect(find.text(aurelia.developerResponse!.line), findsOneWidget);
      expect(find.text('“${aurelia.developerResponse!.text}”'), findsOneWidget);
    });

    testWidgets('From the developer opens and closes, announcing it', (tester) async {
      final handle = tester.ensureSemantics();
      final dev = KitFixtures.aurelia.fromDeveloper!;
      await pumpKit(
        tester,
        FromDeveloperBlock(
          label: dev.label,
          note: 'Shown as given. It never moves the delivery risk.',
          children: [Text(dev.priceLists.first.label)],
        ),
      );
      final button = find.bySemanticsLabel(dev.label);
      expect(tester.getSemantics(button), isSemantics(isButton: true, hasExpandedState: true, isExpanded: false));
      expect(find.text(dev.priceLists.first.label), findsNothing);
      await tester.tap(find.text(dev.label));
      await tester.pumpAndSettle();
      expect(tester.getSemantics(button), isSemantics(isExpanded: true));
      expect(find.text(dev.priceLists.first.label), findsOneWidget);
      handle.dispose();
    });

    testWidgets('a pending fact: the fact, its marker and the claim', (tester) async {
      final pending = KitFixtures.of(RiskState.elevated).pending.single;
      await pumpKit(tester, PendingFactNote(fact: pending));
      expect(find.textContaining(pending.line, findRichText: true), findsOneWidget);
      expect(find.textContaining(pending.markerLine!, findRichText: true), findsOneWidget);
      expect(find.text(pending.developerSays!.line), findsOneWidget);
    });

    testWidgets('the disclaimer is set in full with its links', (tester) async {
      final meta = KitFixtures.of(RiskState.elevated).meta;
      var reported = false;
      await pumpKit(
        tester,
        DisclaimerLine(
          line: meta.disclaimerLine,
          links: [KitLink('Report an error', () => reported = true), const KitLink('How we make money', null)],
          metaLine: 'Data as of 14 Oct 2026 · Model v1.2',
        ),
      );
      expect(
        find.text('Our opinion, based on public records. Not a credit rating. Not issued by any RERA.'),
        findsOneWidget,
      );
      final style = tester.widget<Text>(find.text(meta.disclaimerLine)).style!;
      expect(style.fontSize, greaterThanOrEqualTo(14));
      await tester.tap(find.textContaining('Report an error', findRichText: true));
      expect(reported, isTrue);
    });
  });

  test('lane labels cover every lane', () {
    for (final lane in Lane.values) {
      expect(KitCopy.lane(lane), isNotEmpty);
    }
    expect(KitCopy.lane(Lane.recordsShow), 'Records show');
    expect(KitCopy.lane(Lane.fromDeveloper), 'From the developer · not verified by Plinth');
  });
}
