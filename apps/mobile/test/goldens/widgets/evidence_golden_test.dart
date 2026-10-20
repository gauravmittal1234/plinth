@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'golden_harness.dart';

/// The evidence widgets × Day and Night: reasons for each scored band,
/// source chips on each ground, Aurelia's evidence sheet for reason 2, the
/// claim fields, the pending fact and the disclaimer.
void main() {
  setUpAll(KitFixtures.load);

  for (final (theme, night) in themes) {
    for (final s in RiskState.bands) {
      testWidgets('reason list, ${stateName(s)}, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'reason_list_${stateName(s)}_$theme',
          ReasonList(reasons: KitFixtures.of(s).reasons, onSource: (_, _) {}),
          night: night,
        );
      });
    }

    testWidgets('source chips, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'source_chips_$theme',
        Builder(
          builder: (context) {
            final tokens = PlinthTokens.of(context);
            Widget on(Color ground, SourceChipGround g) => ColoredBox(
              color: ground,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: SourceChip(label: 'HARERA orders', ground: g, onPressed: () {}),
              ),
            );
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                on(tokens.bg, SourceChipGround.page),
                on(tokens.track, SourceChipGround.track),
                on(tokens.claimBg, SourceChipGround.claim),
              ],
            );
          },
        ),
        night: night,
      );
    });

    testWidgets('evidence sheet, $theme', (tester) async {
      final aurelia = KitFixtures.of(RiskState.elevated);
      await expectKitGolden(
        tester,
        'evidence_sheet_$theme',
        Builder(
          builder: (context) {
            final tokens = PlinthTokens.of(context);
            return DecoratedBox(
              decoration: BoxDecoration(
                color: tokens.sheet,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: tokens.sheetShadow,
              ),
              child: SizedBox(
                height: 2200,
                child: EvidenceSheet(
                  evidence: KitFixtures.evidenceFor(aurelia, 2),
                  fact: aurelia.reasons[1].text,
                  subtitle: 'Evidence for reason 2 of 4',
                  highlight: '3 of the last 8 quarters',
                  onOpenOriginal: () {},
                  onOpenArchive: () {},
                  onReportError: () {},
                ),
              ),
            );
          },
        ),
        night: night,
        padding: const EdgeInsets.only(top: 24),
        viewHeight: 2300,
      );
    });

    testWidgets('developer says, $theme', (tester) async {
      final aurelia = KitFixtures.of(RiskState.elevated);
      await expectKitGolden(
        tester,
        'developer_says_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            DeveloperSaysField.fromResponse(
              aurelia.developerResponse!,
              note: 'Northfield Estates, via our developer reply portal.',
            ),
            const SizedBox(height: 16),
            DeveloperSaysField(label: aurelia.pending.single.developerSays!.line, compact: true),
          ],
        ),
        night: night,
      );
    });

    testWidgets('from the developer, $theme', (tester) async {
      final dev = KitFixtures.aurelia.fromDeveloper!;
      final list = dev.priceLists.first;
      Widget block({required bool open}) => FromDeveloperBlock(
        label: dev.label,
        initiallyExpanded: open,
        note: 'Shown as given, not verified by Plinth. It never moves the delivery risk.',
        children: [for (final item in list.items) Text('${item.unitLabel} ${item.priceLine}')],
      );
      await expectKitGolden(
        tester,
        'from_developer_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [block(open: false), const SizedBox(height: 24), block(open: true)],
        ),
        night: night,
      );
    });

    testWidgets('pending fact, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'pending_fact_$theme',
        PendingFactNote(fact: KitFixtures.of(RiskState.elevated).pending.single),
        night: night,
      );
    });

    testWidgets('disclaimer, $theme', (tester) async {
      final meta = KitFixtures.of(RiskState.elevated).meta;
      await expectKitGolden(
        tester,
        'disclaimer_$theme',
        DisclaimerLine(
          line: meta.disclaimerLine,
          links: [KitLink('Report an error', () {}), KitLink('How we make money', () {})],
          metaLine: 'Data as of 14 Oct 2026 · Model v1.2',
        ),
        night: night,
      );
    });
  }
}
