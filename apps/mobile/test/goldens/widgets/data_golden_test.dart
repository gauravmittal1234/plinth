@Tags(['golden'])
library;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/widgets/widgets.dart';
import 'package:plinth_tokens/plinth_tokens.dart';

import 'golden_harness.dart';

/// The data instruments × Day and Night, from Aurelia's project page: the
/// replay tower with its tiles, the replay slider, the cost table and fact
/// tiles.
void main() {
  setUpAll(KitFixtures.load);

  for (final (theme, night) in themes) {
    testWidgets('tower stack, $theme', (tester) async {
      final progress = KitFixtures.aurelia.progress;
      final q = progress.quarters.last;
      // AppProject: built slabs = built% / 5; the sold line at sold% / 5, in
      // the band of that quarter.
      await expectKitGolden(
        tester,
        'tower_stack_$theme',
        Builder(
          builder: (context) => Column(
            children: [
              TowerStack(
                built: (q.builtPct! / 5).round(),
                floors: progress.floorsPerTower!,
                soldFloor: (q.soldPct! / 5).round(),
                soldBand: RiskState.ofBandCode(q.bandThen),
              ),
              Row(
                children: [
                  Expanded(
                    child: FactTile(
                      label: 'Built',
                      value: '${q.builtPct!.round()}%',
                      valueColor: PlinthTokens.of(context).accentText,
                    ),
                  ),
                  Expanded(
                    child: FactTile(
                      label: 'Sold',
                      value: '${q.soldPct!.round()}%',
                      valueColor: RiskState.ofBandCode(q.bandThen)!.colors(PlinthTokens.of(context)).ink,
                    ),
                  ),
                  Expanded(
                    child: FactTile(label: 'Time used', value: '${q.timeUsedPct!.round()}%'),
                  ),
                ],
              ),
            ],
          ),
        ),
        night: night,
      );
    });

    testWidgets('tower stack, tower A at slab 9, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'tower_stack_tower_a_$theme',
        TowerStack(built: KitFixtures.aurelia.progress.quarters.last.towers!['A']!),
        night: night,
      );
    });

    testWidgets('replay slider, $theme', (tester) async {
      final labels = [for (final q in KitFixtures.aurelia.progress.quarters) q.label];
      await expectKitGolden(
        tester,
        'replay_slider_$theme',
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            ReplayStepButtons(index: 7, count: labels.length, onChanged: (_) {}),
            const SizedBox(height: 16),
            ReplaySlider(labels: labels, index: 7, onChanged: (_) {}),
          ],
        ),
        night: night,
      );
    });

    testWidgets('cost table, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'cost_table_$theme',
        CostTable.fromProjectCost(KitFixtures.aurelia.cost!),
        night: night,
      );
    });

    testWidgets('fact tiles, $theme', (tester) async {
      await expectKitGolden(
        tester,
        'fact_tiles_$theme',
        const Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: FactTile(label: 'Built', value: '41%'),
                ),
                Expanded(
                  child: FactTile(label: 'Time used', value: '77%'),
                ),
              ],
            ),
            SizedBox(height: 16),
            FactTile(label: 'All-in', value: '₹2.74 Cr', align: CrossAxisAlignment.start, onTone: true),
          ],
        ),
        night: night,
      );
    });
  }
}
