import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard, SearchResults;
import 'package:plinth_fixtures/plinth_fixtures.dart' show plinthExpectedAsset;

import '../../fixtures/fixture_mode.dart';

// M0 gate stand-in (T07; BUILD_PLAN §3 M0 exit: "the app, in FIXTURES mode,
// opens on Explore with the seeded phases"). Explore lists the cards of the
// fixture search over all of Gurugram, lowest delivery risk first, exactly as
// packages/fixtures/expected/search_projects/all-gurugram.json has them.
// T17's search repository and T30's Explore replace this file.

/// Fixture key of `api.search_projects` with an empty query: every seeded phase.
const seededPhasesSearchKey = 'all-gurugram';

/// The seeded phases' project cards. Empty outside FIXTURES mode until T17
/// wires `api.search_projects`.
final seededPhasesProvider = FutureProvider<List<ProjectCard>>((ref) async {
  if (!kFixtures) return const <ProjectCard>[];
  // Uncached: the provider keeps the result, and a bundle-cached future would
  // belong to the zone of whichever widget test loaded it first.
  final raw = await rootBundle.loadString(plinthExpectedAsset('search_projects', seededPhasesSearchKey), cache: false);
  return SearchResults.fromJson(jsonDecode(raw) as Map<String, dynamic>).items;
});
