import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/theme/app_theme.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

/// The fixture phase behind each risk state (DESIGN §5b), as T14 renders
/// them on the web: the five bands, Limited history, Not scored and the
/// facts-only (withheld) variant of Aurelia.
const stateFixtures = <RiskState, String>{
  RiskState.low: 'kestrel-park',
  RiskState.moderate: 'sapphire-grove-phase-1',
  RiskState.elevated: 'aurelia-heights-phase-2',
  RiskState.high: 'coral-towers',
  RiskState.severe: 'laurel-residency',
  RiskState.limited: 'juniper-enclave',
  RiskState.notScored: 'heron-point-phase-2',
  RiskState.withheld: 'aurelia-heights-phase-2--facts-only',
};

/// The contract payloads the kit is tested with, read from the bundled
/// fixtures (packages/fixtures/expected) once per test file.
abstract final class KitFixtures {
  static late Map<RiskState, RiskSummary> summaries;

  /// The five band names, lowest first (`Methodology.bands`).
  static late List<String> bandLabels;

  /// The methodology's band ranges, for icon arrays where a summary has none.
  static late Map<RiskState, BandRange> bandRanges;

  /// Evidence by fact id.
  static late Map<String, Evidence> evidence;

  /// Aurelia's project page (progress quarters, cost, from the developer).
  static late ProjectPage aurelia;

  static bool _loaded = false;

  static Future<void> load() async {
    if (_loaded) return;
    summaries = {
      for (final e in stateFixtures.entries)
        e.key: RiskSummary.fromJson(await loadPlinthExpected('risk_summary', e.value)),
    };
    final methodology = Methodology.fromJson(await loadPlinthExpected('methodology', 'default'));
    final bands = [...methodology.bands]..sort((a, b) => a.step.compareTo(b.step));
    bandLabels = [for (final b in bands) b.label];
    bandRanges = {for (final b in bands) RiskState.ofStep(b.step)!: b};
    evidence = {
      for (final id in plinthExpectedKeys['evidence']!) id: Evidence.fromJson(await loadPlinthExpected('evidence', id)),
    };
    aurelia = ProjectPage.fromJson(await loadPlinthExpected('project_page', 'aurelia-heights-phase-2'));
    _loaded = true;
  }

  static RiskSummary of(RiskState state) => summaries[state]!;

  /// The evidence behind [summary]'s reason [rank] (its first source).
  static Evidence evidenceFor(RiskSummary summary, int rank) {
    final reason = summary.reasons.firstWhere((r) => r.rank == rank);
    return evidence[reason.sources.first.factIds.first]!;
  }
}

/// The app's Day or Night theme.
ThemeData kitTheme({bool night = false}) => night ? AppTheme.night() : AppTheme.day();

/// Pumps [child] on a phone-width page in the app's theme, with the text
/// size and reduced-motion settings a test asks for, then settles.
Future<void> pumpKit(
  WidgetTester tester,
  Widget child, {
  bool night = false,
  double textScale = 1,
  bool reduceMotion = false,
  Size size = const Size(360, 800),
  bool scroll = true,
  bool settle = true,
}) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = size;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: kitTheme(night: night),
      builder: (context, app) => MediaQuery(
        data: MediaQuery.of(context)
            .copyWith(textScaler: TextScaler.linear(textScale), disableAnimations: reduceMotion),
        child: app!,
      ),
      home: Scaffold(
        body: scroll
            ? SingleChildScrollView(padding: const EdgeInsets.all(PlinthLayout.gutterPhone), child: child)
            : child,
      ),
    ),
  );
  if (settle) await tester.pumpAndSettle();
}
