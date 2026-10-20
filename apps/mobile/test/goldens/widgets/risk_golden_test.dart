@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ConfidenceLevel;

import 'golden_harness.dart';

/// The risk instruments in every risk state (the five bands, Limited
/// history, Not scored and a withheld band) × Day and Night, each drawn from
/// its fixture phase (kit_harness.dart `stateFixtures`).
void main() {
  setUpAll(KitFixtures.load);

  for (final (theme, night) in themes) {
    for (final s in RiskState.values) {
      final name = stateName(s);

      testWidgets('risk chip, $name, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'risk_chip_${name}_$theme',
          Align(alignment: Alignment.centerLeft, child: RiskChip.fromSummary(KitFixtures.of(s))),
          night: night,
        );
      });

      testWidgets('risk meter, $name, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'risk_meter_${name}_$theme',
          Row(
            children: [
              RiskMeter(state: s),
              const SizedBox(width: 24),
              RiskMeter(state: s, size: RiskMeterSize.header),
            ],
          ),
          night: night,
        );
      });

      testWidgets('risk header, $name, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'risk_header_${name}_$theme',
          RiskHeader.fromSummary(
            KitFixtures.of(s),
            caption: 'Delivery risk · data as of 14 Oct 2026',
            scale: RiskHeaderScale.project,
          ),
          night: night,
        );
      });

      testWidgets('band scale, $name, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'band_scale_${name}_$theme',
          Padding(
            padding: const EdgeInsets.all(6),
            child: BandScale(labels: KitFixtures.bandLabels, state: s),
          ),
          night: night,
        );
      });

      testWidgets('icon array, $name, $theme', (tester) async {
        // A red-flag band has no frequency of its own: the board shows its
        // band's published range (Methodology.bands). Non-band states have
        // no range: all 100 cells are empty.
        final summary = KitFixtures.of(s);
        final range = KitFixtures.bandRanges[s];
        final array =
            RiskIconArray.fromSummary(summary) ??
            RiskIconArray(
              state: s,
              filled: range?.low ?? 0,
              hatched: range == null ? 0 : range.high - range.low,
              semanticLabel: range?.sentence ?? summary.chip.label,
            );
        await expectKitGolden(
          tester,
          'icon_array_${name}_$theme',
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: array),
              const SizedBox(height: 20),
              RiskIconArrayLegend(
                state: s,
                hatchedText: summary.frequency?.hatchLegend ?? (array.hatched > 0 ? 'Hatched' : null),
              ),
            ],
          ),
          night: night,
        );
      });

      testWidgets('riskometer, $name, $theme', (tester) async {
        await expectKitGolden(
          tester,
          'riskometer_${name}_$theme',
          Center(
            child: Riskometer(state: s, labels: KitFixtures.bandLabels),
          ),
          night: night,
        );
      });
    }

    testWidgets('confidence dots, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'confidence_dots_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                ConfidenceDots(level: ConfidenceLevel.high),
                SizedBox(width: 24),
                ConfidenceDots(level: ConfidenceLevel.low),
              ],
            ),
            const SizedBox(height: 16),
            ConfidenceLine(
              level: KitFixtures.of(RiskState.elevated).confidence!.level,
              line: KitFixtures.of(RiskState.elevated).confidence!.line,
            ),
          ],
        ),
        night: night,
      );
    });
  }
}
