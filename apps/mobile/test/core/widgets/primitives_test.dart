import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/android/peek_sheet.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'kit_harness.dart';

void main() {
  group('PlinthButton', () {
    testWidgets('primary is accent, tonal is track; a pressed toggle turns accent-soft', (tester) async {
      final handle = tester.ensureSemantics();
      var follows = 0;
      await pumpKit(
        tester,
        Column(
          children: [
            PlinthButton(label: 'Follow', glyph: KitGlyph.bookmark, pressed: false, onPressed: () => follows++),
            PlinthButton(label: 'Following', glyph: KitGlyph.bookmark, pressed: true, onPressed: () {}),
            PlinthButton(label: 'Ask Plinth', kind: PlinthButtonKind.tonal, onPressed: () {}),
            const PlinthButton(label: 'Nothing to do', onPressed: null),
            PlinthButton(label: 'Report an error', kind: PlinthButtonKind.tertiary, onPressed: () {}),
          ],
        ),
      );
      Color fill(int i) => tester
          .widget<Material>(find.descendant(of: find.byType(PlinthButton).at(i), matching: find.byType(Material)))
          .color!;
      expect(fill(0), PlinthTokens.day.accent);
      expect(fill(1), PlinthTokens.day.accentSoft);
      expect(fill(2), PlinthTokens.day.track);
      expect(fill(3), PlinthTokens.day.disabledBg);
      expect(tester.getSize(find.byType(PlinthButton).first).height, PlinthLayout.buttonPrimary);
      expect(tester.getSize(find.byType(PlinthButton).last).height, PlinthLayout.touchApp);
      expect(
        tester.getSemantics(find.byType(PlinthButton).at(1)),
        isSemantics(isSelected: true, isButton: true, label: 'Following'),
      );
      await tester.tap(find.byType(PlinthButton).first);
      expect(follows, 1);
      handle.dispose();
    });

    testWidgets('shrinks while pressed, but not under reduced motion', (tester) async {
      await pumpKit(tester, PlinthButton(label: 'Share', onPressed: () {}));
      final gesture = await tester.startGesture(tester.getCenter(find.byType(PlinthButton)));
      await tester.pumpAndSettle();
      expect(tester.widget<AnimatedScale>(find.byType(AnimatedScale)).scale, PlinthMotion.pressScale);
      await gesture.up();
      await tester.pumpAndSettle();
      expect(tester.widget<AnimatedScale>(find.byType(AnimatedScale)).scale, 1);
    });
  });

  group('pills', () {
    testWidgets('a filter pill reads as a selected button; inverse when on', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        Wrap(
          children: [
            PlinthPill(label: 'Under ₹2.5 Cr', selected: true, onPressed: () {}),
            PlinthPill(label: '3 BHK', onPressed: () {}),
          ],
        ),
      );
      expect(
        tester.getSemantics(find.byType(PlinthPill).first),
        isSemantics(isSelected: true, isButton: true, label: 'Under ₹2.5 Cr'),
      );
      expect(tester.getSemantics(find.byType(PlinthPill).last), isSemantics(isSelected: false));
      expect(tester.getSize(find.byType(PlinthPill).first).height, PlinthLayout.touchApp);
      handle.dispose();
    });

    testWidgets('the segmented control switches Dial and 100 projects', (tester) async {
      final handle = tester.ensureSemantics();
      final view = ValueNotifier('dial');
      await pumpKit(
        tester,
        ValueListenableBuilder(
          valueListenable: view,
          builder: (_, v, _) => PlinthSegmented<String>(
            semanticLabel: 'Risk view',
            options: const [SegmentOption('dial', 'Dial'), SegmentOption('array', '100 projects')],
            value: v,
            onChanged: (next) => view.value = next,
          ),
        ),
      );
      expect(tester.getSemantics(find.bySemanticsLabel('Dial')), isSemantics(isSelected: true));
      await tester.tap(find.text('100 projects'));
      await tester.pumpAndSettle();
      expect(view.value, 'array');
      expect(tester.getSemantics(find.bySemanticsLabel('100 projects')), isSemantics(isSelected: true));
      expect(tester.getSemantics(find.bySemanticsLabel('Dial')), isSemantics(isSelected: false));
      handle.dispose();
    });
  });

  group('SectionBand', () {
    testWidgets('the question is a heading; the band alternates tone', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpKit(
        tester,
        const Column(
          children: [
            SectionBand(question: 'Will it be delivered on time?', answer: 'Delivery risk is Elevated.'),
            SectionBand(question: 'How much is built?', tone: BandTone.track),
          ],
        ),
        scroll: false,
      );
      expect(tester.getSemantics(find.text('Will it be delivered on time?')), isSemantics(isHeader: true));
      final grounds = tester.widgetList<ColoredBox>(
        find.descendant(of: find.byType(SectionBand), matching: find.byType(ColoredBox)),
      );
      expect(grounds.map((b) => b.color), [PlinthTokens.day.bg, PlinthTokens.day.track]);
      handle.dispose();
    });

    testWidgets('rises in, and is simply there under reduced motion', (tester) async {
      await pumpKit(
        tester,
        const SectionBand(question: 'How much is built?', answer: 'x'),
        reduceMotion: true,
        settle: false,
      );
      for (final o in tester.widgetList<Opacity>(find.byType(Opacity))) {
        expect(o.opacity, 1);
      }
    });
  });

  group('sheets and toasts', () {
    testWidgets('a Plinth sheet opens with a heading and closes from its button', (tester) async {
      await pumpKit(
        tester,
        Builder(
          builder: (context) => PlinthButton(
            label: 'Share risk card',
            onPressed: () => showPlinthSheet<void>(
              context: context,
              builder: (_) => const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  PlinthSheetHeader(title: 'Share this risk card'),
                  SizedBox(height: 200),
                ],
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.byType(PlinthButton));
      await tester.pumpAndSettle();
      expect(find.text('Share this risk card'), findsOneWidget);
      await tester.tap(find.byTooltip(KitCopy.close));
      await tester.pumpAndSettle();
      expect(find.text('Share this risk card'), findsNothing);
    });

    testWidgets('under reduced motion the sheet is open on the next frame', (tester) async {
      await pumpKit(
        tester,
        Builder(
          builder: (context) => PlinthButton(
            label: 'Open',
            onPressed: () => showPlinthSheet<void>(
              context: context,
              builder: (_) => const PlinthSheetHeader(title: 'Sheet'),
            ),
          ),
        ),
        reduceMotion: true,
      );
      await tester.tap(find.byType(PlinthButton));
      await tester.pump();
      await tester.pump();
      final top = tester.getTopLeft(find.text('Sheet'));
      await tester.pumpAndSettle();
      expect(tester.getTopLeft(find.text('Sheet')), top, reason: 'no rise: it was already in place');
    });

    testWidgets('a toast is read out and leaves after 3.2 s', (tester) async {
      await pumpKit(
        tester,
        Builder(
          builder: (context) =>
              PlinthButton(label: 'Copy link', onPressed: () => showPlinthToast(context, 'Link copied')),
        ),
      );
      await tester.tap(find.byType(PlinthButton));
      await tester.pumpAndSettle();
      expect(find.text('Link copied'), findsOneWidget);
      await tester.pump(PlinthToast.duration);
      await tester.pumpAndSettle();
      expect(find.text('Link copied'), findsNothing);
    });
  });

  group('BottomActionBar', () {
    testWidgets('a plain nav-tone bar of 52 dp pills; the primary is accent', (tester) async {
      final handle = tester.ensureSemantics();
      var asked = 0;
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(360, 800);
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        MaterialApp(
          theme: kitTheme(),
          home: Scaffold(
            body: const SizedBox.expand(),
            bottomNavigationBar: BottomActionBar(
              actions: [
                // Short labels: the test font sets every glyph a full em wide.
                BottomAction(label: 'Ask', glyph: KitGlyph.sparkle, onPressed: () => asked++),
                BottomAction(label: 'Share', glyph: KitGlyph.share, primary: true, flex: 14, onPressed: () {}),
              ],
            ),
          ),
        ),
      );
      final bar = find.byType(BottomActionBar);
      expect(tester.getSize(bar).height, 52 + 28);
      expect(
        tester.widget<ColoredBox>(find.descendant(of: bar, matching: find.byType(ColoredBox)).first).color,
        PlinthTokens.day.nav,
      );
      expect(find.byType(FloatingActionButton), findsNothing);
      final ask = tester.getSize(find.byType(PlinthButton).first).width;
      final share = tester.getSize(find.byType(PlinthButton).last).width;
      expect(share / ask, closeTo(14 / 10, 0.01));
      await tester.tap(find.bySemanticsLabel('Ask'));
      expect(asked, 1);
      handle.dispose();
    });

    testWidgets('keeps clear of the system navigation bar', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = const Size(360, 800);
      tester.view.padding = const FakeViewPadding(bottom: 24);
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        MaterialApp(
          theme: kitTheme(),
          home: Scaffold(
            bottomNavigationBar: BottomActionBar(
              actions: [BottomAction(label: 'Follow', primary: true, onPressed: () {})],
            ),
          ),
        ),
      );
      expect(tester.getSize(find.byType(BottomActionBar)).height, 52 + 28 + 24);
    });
  });

  group('PeekSheet', () {
    Future<void> pumpSheet(
      WidgetTester tester, {
      bool reduceMotion = false,
      PeekSheetState initial = PeekSheetState.half,
      ValueChanged<PeekSheetState>? onChanged,
    }) => pumpKit(
      tester,
      Stack(
        children: [
          PeekSheet(
            initialState: initial,
            onStateChanged: onChanged,
            header: const Padding(padding: EdgeInsets.fromLTRB(16, 0, 16, 12), child: Text('6 projects')),
            builder: (context, controller) => ListView(
              controller: controller,
              children: [for (var i = 0; i < 20; i++) SizedBox(height: 80, child: Text('Project $i'))],
            ),
          ),
        ],
      ),
      scroll: false,
      size: const Size(360, 740),
      reduceMotion: reduceMotion,
    );

    double sheetHeight(WidgetTester tester) =>
        tester.getSize(find.descendant(of: find.byType(PeekSheet), matching: find.byType(DecoratedBox)).first).height;

    testWidgets('rests at 112, half or full; the handle steps and says where it is', (tester) async {
      final handle = tester.ensureSemantics();
      final states = <PeekSheetState>[];
      await pumpSheet(tester, initial: PeekSheetState.peek, onChanged: states.add);
      expect(sheetHeight(tester), PlinthLayout.sheetPeek);
      expect(find.bySemanticsLabel(KitCopy.peekHandlePeek), findsOneWidget);

      await tester.tap(find.bySemanticsLabel(KitCopy.peekHandlePeek));
      await tester.pumpAndSettle();
      expect(sheetHeight(tester), 380);
      expect(find.bySemanticsLabel(KitCopy.peekHandleHalf), findsOneWidget);

      await tester.tap(find.bySemanticsLabel(KitCopy.peekHandleHalf));
      await tester.pumpAndSettle();
      expect(sheetHeight(tester), 740, reason: 'full is the space it is given');

      await tester.tap(find.bySemanticsLabel(KitCopy.peekHandleFull));
      await tester.pumpAndSettle();
      expect(sheetHeight(tester), PlinthLayout.sheetPeek);
      expect(states, [PeekSheetState.half, PeekSheetState.full, PeekSheetState.peek]);
      handle.dispose();
    });

    testWidgets('a drag snaps to the nearest height; a fling goes one step', (tester) async {
      await pumpSheet(tester);
      final state = tester.state<PeekSheetStateHolder>(find.byType(PeekSheet));
      // Half (380) dragged up 200 → 580: nearest is full (740).
      await tester.drag(find.text('6 projects'), const Offset(0, -200));
      await tester.pumpAndSettle();
      expect(state.state, PeekSheetState.full);
      // A quick fling down from full goes to half.
      await tester.fling(find.text('6 projects'), const Offset(0, 80), 1500);
      await tester.pumpAndSettle();
      expect(state.state, PeekSheetState.half);
      expect(sheetHeight(tester), 380);
    });

    testWidgets('the list scrolls inside the sheet', (tester) async {
      await pumpSheet(tester);
      expect(find.text('Project 10'), findsNothing);
      await tester.drag(find.text('Project 1'), const Offset(0, -600));
      await tester.pumpAndSettle();
      expect(find.text('Project 1'), findsNothing);
    });

    testWidgets('reduced motion snaps at once; 200% text never overflows at peek', (tester) async {
      await pumpSheet(tester, reduceMotion: true);
      await tester.tap(find.bySemanticsLabel(KitCopy.peekHandleHalf));
      await tester.pump();
      expect(tester.hasRunningAnimations, isFalse);
      expect(sheetHeight(tester), 740);

      await pumpKit(
        tester,
        Stack(
          children: [
            PeekSheet(
              key: const ValueKey('large text'),
              initialState: PeekSheetState.peek,
              header: const Text('6 projects · sorted by relevance · data as of 14 Oct 2026'),
              builder: (context, controller) => ListView(controller: controller),
            ),
          ],
        ),
        scroll: false,
        textScale: 2,
      );
      expect(tester.takeException(), isNull);
    });
  });
}
