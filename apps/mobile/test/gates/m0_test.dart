import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/core/widgets/widgets.dart' show RiskChip;
import 'package:plinth/data/search.dart';
import 'package:plinth/features/explore/project_card_tile.dart';
import 'package:plinth/features/explore/seeded_phases.dart';
import 'package:plinth/fixtures/fixture_mode.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart';

import '../helpers/app_harness.dart';

/// T07 · M0 gate (BUILD_PLAN §3 M0 exit; WORK_BREAKDOWN T07): in FIXTURES mode
/// the app opens on Explore, and Explore lists the seeded phases from the
/// fixture search, each opening its project screen.
void main() {
  /// The 8 seeded phases (DESIGN §5b) as the fixture search orders them:
  /// lowest delivery risk first, with each card's chip label.
  const seeded = <(String, String, String)>[
    ('kestrel-park', 'Kestrel Park', 'Low'),
    ('cedar-walk-phase-2', 'Cedar Walk, Phase 2', 'Moderate'),
    ('sapphire-grove-phase-1', 'Sapphire Grove, Phase 1', 'Moderate'),
    ('aurelia-heights-phase-2', 'Aurelia Heights, Phase 2', 'Elevated'),
    ('coral-towers', 'Coral Towers', 'High'),
    ('laurel-residency', 'Laurel Residency', 'Severe'),
    ('juniper-enclave', 'Juniper Enclave', 'Not enough history to score · no penalty'),
    ('heron-point-phase-2', 'Heron Point, Phase 2', 'Not scored'),
  ];

  test('tests run in FIXTURES mode', () {
    expect(kFixtures, isTrue);
  });

  test('the fixture search covers every seeded phase', () async {
    TestWidgetsFlutterBinding.ensureInitialized();
    final raw = await rootBundle.loadString(
      plinthExpectedAsset('search_projects', seededPhasesSearchKey),
      cache: false,
    );
    final json = jsonDecode(raw) as Map<String, dynamic>;
    final items = (json['items'] as List<dynamic>).cast<Map<String, dynamic>>();
    expect([for (final i in items) i['slug']], [for (final s in seeded) s.$1]);
    expect(json['hidden_count'], 0);
  });

  testWidgets('the app opens on Explore with the seeded phases', (tester) async {
    final container = await pumpPlinth(tester);
    expect(locationOf(container), Routes.explore);
    expect(find.text('Which home are you buying?'), findsOneWidget);

    // Explore's own data path (AppExplore, T30): the same fixture search as
    // `seededPhasesSearchKey`, now wired through `searchProvider`.
    final results = container.read(searchProvider(const SearchQuery())).value;
    expect(results, isNotNull, reason: 'the fixture search loaded');
    expect([for (final p in results!.items) p.slug], [for (final s in seeded) s.$1]);

    for (final (slug, name, chip) in seeded) {
      final title = find.text(name);
      await scrollIntoView(tester, title);
      expect(title.hitTestable(), findsOneWidget, reason: slug);
      final tile = find.ancestor(of: title, matching: find.byType(ProjectCardTile));
      expect(
        find.descendant(of: tile, matching: find.byWidgetPredicate((w) => w is RiskChip && w.chip.label == chip)),
        findsOneWidget,
        reason: '$slug chip',
      );
    }
  });

  testWidgets('a seeded phase opens its project screen', (tester) async {
    final container = await pumpPlinth(tester);
    final aurelia = find.text('Aurelia Heights, Phase 2');
    await scrollIntoView(tester, aurelia);
    await tester.tap(aurelia);
    await tester.pumpAndSettle();
    expect(locationOf(container), Routes.projectOf('aurelia-heights-phase-2'));
    expect(find.text('AppProject'), findsOneWidget);
  });
}
