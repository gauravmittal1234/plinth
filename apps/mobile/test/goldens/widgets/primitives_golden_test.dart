@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'golden_harness.dart';

/// The primitives and the Android pieces × Day and Night: buttons, pills and
/// the segmented control, section bands, a sheet heading, the toast, the
/// bottom action bar and the peek sheet at its three heights.
void main() {
  setUpAll(KitFixtures.load);

  for (final (theme, night) in themes) {
    testWidgets('buttons, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'buttons_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PlinthButton(label: 'Follow', glyph: KitGlyph.bookmark, pressed: false, onPressed: () {}),
            const SizedBox(height: 8),
            PlinthButton(label: 'Following', glyph: KitGlyph.bookmark, pressed: true, onPressed: () {}),
            const SizedBox(height: 8),
            PlinthButton(label: 'Ask', glyph: KitGlyph.sparkle, kind: PlinthButtonKind.tonal, onPressed: () {}),
            const SizedBox(height: 8),
            PlinthButton(label: 'Check', kind: PlinthButtonKind.inverse, onPressed: () {}),
            const SizedBox(height: 8),
            const PlinthButton(label: 'Off', onPressed: null),
            PlinthButton(label: 'Report', kind: PlinthButtonKind.tertiary, onPressed: () {}),
          ],
        ),
        night: night,
      );
    });

    testWidgets('pills and segmented, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'pills_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Wrap(
              spacing: 8,
              children: [
                PlinthPill(label: '3 BHK', selected: true, onPressed: () {}),
                PlinthPill(label: 'Low', onPressed: () {}),
              ],
            ),
            const SizedBox(height: 16),
            PlinthSegmented<int>(
              options: const [SegmentOption(0, 'Dial'), SegmentOption(1, '100')],
              value: 0,
              onChanged: (_) {},
            ),
          ],
        ),
        night: night,
      );
    });

    testWidgets('section bands, $theme', (tester) async {
      final aurelia = KitFixtures.of(RiskState.elevated);
      await expectKitGolden(
        tester,
        'section_band_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SectionBand(
              question: 'On time?',
              answer: 'Delivery risk is Elevated.',
              children: [Align(alignment: Alignment.centerLeft, child: RiskChip.fromSummary(aurelia))],
            ),
            const SectionBand(question: 'How much is built?', answer: '41% is built.', tone: BandTone.track),
          ],
        ),
        night: night,
        padding: EdgeInsets.zero,
      );
    });

    testWidgets('sheet heading, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'sheet_header_$theme',
        Builder(
          builder: (context) {
            final tokens = PlinthTokens.of(context);
            return DecoratedBox(
              decoration: BoxDecoration(
                color: tokens.sheet,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: tokens.sheetShadow,
              ),
              child: const Padding(
                padding: EdgeInsets.only(top: 12, bottom: 24),
                child: PlinthSheetHeader(title: 'Share', subtitle: 'A link to the live card'),
              ),
            );
          },
        ),
        night: night,
        padding: const EdgeInsets.only(top: 24),
      );
    });

    testWidgets('toast, $theme', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(360, 200);
      addTearDown(tester.view.reset);
      const key = ValueKey('toast-board');
      await tester.pumpWidget(
        MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: kitTheme(night: night),
          home: RepaintBoundary(
            key: key,
            child: Scaffold(
              body: Builder(
                builder: (context) => Center(
                  child: PlinthButton(label: 'Copy', onPressed: () => showPlinthToast(context, 'Link copied')),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.byType(PlinthButton));
      await tester.pumpAndSettle();
      await expectLater(find.byKey(key), matchesGoldenFile('toast_$theme.png'));
      // Let the toast leave, so no timer outlives the test.
      await tester.pump(PlinthToast.duration);
      await tester.pumpAndSettle();
    });

    testWidgets('bottom action bar, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'bottom_action_bar_$theme',
        Column(
          children: [
            BottomActionBar(
              actions: [
                BottomAction(label: 'Ask', glyph: KitGlyph.sparkle, onPressed: () {}),
                BottomAction(label: 'Share', glyph: KitGlyph.share, primary: true, flex: 14, onPressed: () {}),
              ],
            ),
            const SizedBox(height: 16),
            BottomActionBar(
              actions: [
                BottomAction(
                  label: 'Following',
                  glyph: KitGlyph.bookmark,
                  primary: true,
                  pressed: true,
                  onPressed: () {},
                ),
                BottomAction(label: 'Ask', glyph: KitGlyph.sparkle, onPressed: () {}),
              ],
            ),
          ],
        ),
        night: night,
        padding: EdgeInsets.zero,
      );
    });

    for (final state in PeekSheetState.values) {
      testWidgets('peek sheet, ${state.name}, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'peek_sheet_${state.name}_$theme',
          Builder(
            builder: (context) => SizedBox(
              height: 740,
              child: ColoredBox(
                // The map behind it.
                color: PlinthTokens.of(context).photo,
                child: Stack(
                  children: [
                    PeekSheet(
                      initialState: state,
                      halfHeight: 380,
                      header: const Padding(padding: EdgeInsets.fromLTRB(16, 0, 16, 12), child: Text('6 projects')),
                      builder: (context, controller) => ListView(
                        controller: controller,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        children: [
                          for (final s in RiskState.values)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: RiskChip.fromSummary(KitFixtures.of(s)),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          night: night,
          padding: EdgeInsets.zero,
          viewHeight: 800,
        );
      });
    }
  }
}
