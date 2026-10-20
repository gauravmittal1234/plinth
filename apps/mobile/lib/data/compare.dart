import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// Compare 2–4 phases side by side (API_CONTRACTS §4.5).

abstract interface class CompareRepository {
  /// `api.compare(p_slugs)`, 2–4 phases in the order given.
  Future<Compare> compare(List<String> slugs);
}

class SupabaseCompareRepository implements CompareRepository {
  SupabaseCompareRepository(this._api);

  final ApiClient _api;

  @override
  Future<Compare> compare(List<String> slugs) async =>
      Compare.fromJson(await _api.rpcMap('compare', CompareRequest(pSlugs: slugs).toJson()));
}

class FixtureCompareRepository implements CompareRepository {
  FixtureCompareRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<Compare> compare(List<String> slugs) async =>
      Compare.fromJson(await _world.read('compare', CompareRequest(pSlugs: slugs).toJson()));
}

final compareRepositoryProvider = Provider<CompareRepository>(
  (ref) => SupabaseCompareRepository(ref.watch(apiClientProvider)),
);

/// A comparison, keyed by the slugs joined with commas in order
/// (`aurelia-heights-phase-2,kestrel-park`), as the web's `?p=` has them.
final compareProvider = FutureProvider.family<Compare, String>(
  (ref, slugs) => ref.watch(compareRepositoryProvider).compare(slugs.split(',')),
  retry: noRetry,
);
