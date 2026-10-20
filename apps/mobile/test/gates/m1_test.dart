import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/artboard_placeholder.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/core/widgets/widgets.dart' show BandScale, RiskChip, RiskHeader, Riskometer;
import 'package:plinth/data/project.dart';
import 'package:plinth/features/explore/explore_screen.dart';
import 'package:plinth/features/explore/map_screen.dart';
import 'package:plinth/features/project/project_screen.dart';
import 'package:plinth/features/project/states/project_states_screen.dart';
import 'package:plinth/features/risk/risk_screen.dart';
import 'package:plinth/fixtures/fixture_mode.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import '../helpers/app_harness.dart';

/// T39 · M1 exit gate, app side (BUILD_PLAN §3 "M1: Know the builder";
/// WORK_BREAKDOWN T39). It checks the M1 items the app owns and points at the
/// tests that already prove the details, so nothing is asserted twice:
/// Explore and Map (test/features/explore), Project and its Simple view
/// (test/features/project), the 7 design states (test/features/project/states)
/// and Risk (test/features/risk), each with a golden test.
///
/// 1. Every M1 route opens its built screen, never the artboard placeholder.
/// 2. The goldens of every M1 screen are committed.
/// 3. All 8 seeded phases open with the chip their RiskSummary sends.
/// 4. S1 (bands_public off): only in ci-gate-m1, which saves the server's S1
///    payloads from CI's seeded database (PostgREST, as the app's
///    SupabaseProjectRepository reads them) and passes the folder in
///    `PLINTH_GATE_S1_DIR` (`--dart-define` or the environment). Elsewhere it
///    is skipped: the fixture world has no S1 payload, and S1 copy comes only
///    from the server.
void main() {
  /// The 8 seeded phases (DESIGN §5b; @plinth/fixtures PHASE_SLUGS).
  const phases = [
    'aurelia-heights-phase-2',
    'kestrel-park',
    'sapphire-grove-phase-1',
    'coral-towers',
    'laurel-residency',
    'juniper-enclave',
    'heron-point-phase-2',
    'cedar-walk-phase-2',
  ];

  /// packages/fixtures/expected/<fn>/<key>.json, read from the repository (flutter test runs in apps/mobile).
  Map<String, dynamic> expected(String fn, String key) =>
      jsonDecode(File('../../packages/fixtures/expected/$fn/$key.json').readAsStringSync()) as Map<String, dynamic>;

  group('M1 gate: the app screens are built', () {
    // BUILD_PLAN §3 M1: "App: Explore, Map, Project + States, Risk".
    final routes = <String, Type>{
      Routes.explore: ExploreScreen,
      Routes.map: MapScreen,
      Routes.projectOf('aurelia-heights-phase-2'): ProjectScreen,
      ProjectDesignState.severe.previewPath: ProjectStatesScreen,
      Routes.riskOf('aurelia-heights-phase-2'): RiskScreen,
    };
    for (final MapEntry(key: location, value: screen) in routes.entries) {
      testWidgets('$location opens $screen', (tester) async {
        final container = await pumpPlinth(tester, location: location);
        expect(locationOf(container), location);
        expect(find.byType(screen), findsOneWidget);
        expect(find.byType(ArtboardPlaceholder), findsNothing, reason: 'no stub left on an M1 route');
        expect(tester.takeException(), isNull);
      });
    }

    test('every M1 screen has its goldens committed', () {
      final goldens = [
        for (final theme in ['day', 'night']) ...[
          'test/features/explore/goldens/explore_screen_$theme.png',
          'test/features/explore/goldens/map_screen_$theme.png',
          'test/features/project/goldens/project_hero_risk_$theme.png',
          'test/features/project/goldens/project_simple_view_$theme.png',
          for (final s in ProjectDesignState.values) 'test/features/project/states/goldens/states_${s.id}_$theme.png',
        ],
        for (final band in ['low', 'moderate', 'elevated', 'high', 'severe'])
          'test/features/risk/goldens/risk_band_$band.png',
      ];
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      for (final path in goldens) {
        final file = File(path);
        expect(file.existsSync(), isTrue, reason: '$path is committed');
        expect(file.readAsBytesSync().take(8).toList(), pngSignature, reason: '$path is a PNG');
      }
      for (final test in [
        'test/features/explore/explore_screen_golden_test.dart',
        'test/features/explore/map_screen_golden_test.dart',
        'test/features/project/project_screen_golden_test.dart',
        'test/features/project/states/project_states_screen_golden_test.dart',
        'test/features/risk/risk_screen_golden_test.dart',
      ]) {
        expect(File(test).existsSync(), isTrue, reason: '$test renders them');
      }
    });

    for (final slug in phases) {
      testWidgets('$slug opens with the chip its RiskSummary sends', (tester) async {
        final chip = expected('risk_summary', slug)['chip'] as Map<String, dynamic>;
        await pumpPlinth(tester, location: Routes.projectOf(slug));
        expect(find.byType(ProjectScreen), findsOneWidget);
        expect(
          find.byWidgetPredicate((w) => w is RiskChip && w.chip.label == chip['label'] && w.chip.kind == chip['kind']),
          findsWidgets,
        );
        expect(tester.takeException(), isNull);
      });
    }
  });

  group('M1 gate: S1, bands not public (server payloads from ci-gate-m1)', () {
    const fromDefine = String.fromEnvironment('PLINTH_GATE_S1_DIR');
    final s1Dir = fromDefine.isNotEmpty ? fromDefine : Platform.environment['PLINTH_GATE_S1_DIR'];
    final skip = s1Dir == null || s1Dir.isEmpty;

    Map<String, dynamic> s1(String fn, String slug) =>
        jsonDecode(File('$s1Dir/$fn/$slug.json').readAsStringSync()) as Map<String, dynamic>;

    /// The app in FIXTURES mode, except that the phase reads return the
    /// server's S1 payloads. The window is phone-wide and very tall, so the
    /// lazy page builds every section at once and "nothing on screen" means
    /// nothing on the page.
    Future<ProviderContainer> pumpS1(WidgetTester tester, String location) async {
      usePhoneWindow(tester);
      tester.view.physicalSize = const Size(360 * 3, 16000 * 3);
      final List<Override> overrides = [
        ...fixtureModeOverrides().where((o) => o.origin != projectRepositoryProvider),
        projectRepositoryProvider.overrideWith((ref) => _S1ProjectRepository(s1)),
      ];
      final container = ProviderContainer(overrides: overrides);
      addTearDown(container.dispose);
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      container.read(routerProvider).go(location);
      await tester.pumpAndSettle();
      return container;
    }

    /// No band anywhere: the server's S1 chip is shown, and every chip, risk
    /// header, band scale and Riskometer is in a non-band state.
    void expectNoBand(WidgetTester tester, String s1Label) {
      final chips = [
        for (final w in tester.widgetList<RiskChip>(find.byType(RiskChip))) w.chip,
        for (final w in tester.widgetList<RiskHeader>(find.byType(RiskHeader))) w.chip,
      ];
      final scales = tester.widgetList<BandScale>(find.byType(BandScale)).toList();
      final dials = tester.widgetList<Riskometer>(find.byType(Riskometer)).toList();
      expect([for (final c in chips) c.label], contains(s1Label), reason: 'the server S1 chip is shown');
      expect([for (final c in chips) c.kind], everyElement(isNot(ChipKind.band)));
      expect([for (final s in scales) s.state.isBand], everyElement(isFalse), reason: 'no band scale marks a band');
      expect([for (final r in dials) r.state.isBand], everyElement(isFalse), reason: 'no Riskometer shows a band');
    }

    /// What a band would add, from the bands-on fixture: the frequency
    /// sentence, the reasons and the bands-on next-steps intro.
    void expectNoBandCopy(Map<String, dynamic> bandsOnPage) {
      final risk = bandsOnPage['risk'] as Map<String, dynamic>;
      expect(find.text((risk['frequency'] as Map)['sentence'] as String), findsNothing);
      for (final r in risk['reasons'] as List) {
        expect(find.textContaining((r as Map)['text'] as String), findsNothing);
      }
      expect(find.text((bandsOnPage['next_steps'] as Map)['intro_line'] as String), findsNothing);
    }

    for (final slug in ['aurelia-heights-phase-2', 'kestrel-park']) {
      testWidgets('$slug: AppProject renders the server S1 state, no band', skip: skip, (tester) async {
        final server = s1('project_page', slug);
        final risk = server['risk'] as Map<String, dynamic>;
        expect((risk['display'] as Map)['bands_public'], isFalse, reason: 'the payload is an S1 payload');
        expect(risk['band'], isNull);
        expect(risk, s1('risk_summary', slug), reason: 'one contract: project_page.risk is the RiskSummary');

        await pumpS1(tester, Routes.projectOf(slug));
        expect(find.byType(ProjectScreen), findsOneWidget);
        expect(tester.takeException(), isNull);
        expectNoBand(tester, (risk['chip'] as Map)['label'] as String);
        expect(find.text((server['next_steps'] as Map)['intro_line'] as String), findsWidgets);
        expectNoBandCopy(expected('project_page', slug));
      });

      testWidgets('$slug: AppRisk renders the server S1 state, no band', skip: skip, (tester) async {
        final server = s1('project_page', slug);
        await pumpS1(tester, Routes.riskOf(slug));
        expect(find.byType(RiskScreen), findsOneWidget);
        expect(tester.takeException(), isNull);
        expect(find.byType(CircularProgressIndicator), findsNothing, reason: 'the S1 page loaded');
        expectNoBand(tester, ((server['risk'] as Map)['chip'] as Map)['label'] as String);
        expect(find.text((server['next_steps'] as Map)['intro_line'] as String), findsWidgets);
        expectNoBandCopy(expected('project_page', slug));
      });
    }
  });
}

/// The server's S1 payloads for a phase (risk_summary, project_page); share
/// cards are not part of S1.
class _S1ProjectRepository implements ProjectRepository {
  _S1ProjectRepository(this._read);

  final Map<String, dynamic> Function(String fn, String slug) _read;

  @override
  Future<RiskSummary> riskSummary(PhaseRef phase) async => RiskSummary.fromJson(_read('risk_summary', phase.slug));

  @override
  Future<ProjectPage> projectPage(PhaseRef phase) async => ProjectPage.fromJson(_read('project_page', phase.slug));

  @override
  Future<ShareCard> shareCard(String code) => throw UnimplementedError('share cards are not part of S1');
}
