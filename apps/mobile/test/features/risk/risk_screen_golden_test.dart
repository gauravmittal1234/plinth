@Tags(['golden'])
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

import '../../helpers/app_harness.dart';

/// AppRisk's band poster, one fixture per band (WORK_BREAKDOWN T32 Accept:
/// "Goldens for the 5 bands"). Rendered and compared on Linux only
/// (test/flutter_test_config.dart); off Linux these still pump and build the
/// screen but skip the pixel comparison — see the PR body for the re-render
/// step.
void main() {
  for (final (slug, band) in [
    ('kestrel-park', 'low'),
    ('cedar-walk-phase-2', 'moderate'),
    ('aurelia-heights-phase-2', 'elevated'),
    ('coral-towers', 'high'),
    ('laurel-residency', 'severe'),
  ]) {
    testWidgets('AppRisk band poster, $band', (tester) async {
      usePhoneWindow(tester, pixelRatio: 1);
      final container = ProviderContainer(overrides: fixtureModeOverrides());
      addTearDown(container.dispose);
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
      await tester.pumpAndSettle();
      container.read(routerProvider).go(Routes.riskOf(slug));
      await tester.pumpAndSettle();
      await expectLater(find.byType(PlinthApp), matchesGoldenFile('goldens/risk_band_$band.png'));
    });
  }
}
