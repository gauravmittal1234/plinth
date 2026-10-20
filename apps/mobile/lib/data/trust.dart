import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'offline_cache.dart';
import 'session.dart';

// How the scores work and who runs Plinth (API_CONTRACTS §3.1): the
// methodology (bands, factors, red-flag rules, calibration) and the about
// page. The app needs the methodology's five bands to draw a band scale
// (T15's BandScale and Riskometer), because a RiskSummary carries only its
// own band.

abstract interface class TrustRepository {
  /// `api.methodology()` (T13).
  Future<Methodology> methodology();

  /// `api.about()` (T13).
  Future<About> about();
}

class SupabaseTrustRepository implements TrustRepository {
  SupabaseTrustRepository(this._api);

  final ApiClient _api;

  @override
  Future<Methodology> methodology() async => Methodology.fromJson(await _api.rpcMap('methodology'));

  @override
  Future<About> about() async => About.fromJson(await _api.rpcMap('about'));
}

class FixtureTrustRepository implements TrustRepository {
  FixtureTrustRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<Methodology> methodology() async => Methodology.fromJson(await _world.read('methodology'));

  @override
  Future<About> about() async => About.fromJson(await _world.read('about'));
}

final trustRepositoryProvider = Provider<TrustRepository>(
  (ref) => SupabaseTrustRepository(ref.watch(apiClientProvider)),
);

/// The published methodology. Kept on the phone, so a followed project's
/// band scale still draws offline.
final methodologyProvider = FutureProvider<Cached<Methodology>>((ref) {
  final repo = ref.watch(trustRepositoryProvider);
  return readThrough(
    ref.watch(offlineCacheProvider),
    kind: 'methodology',
    id: 'current',
    fetch: repo.methodology,
    toJson: (v) => v.toJson(),
    fromJson: Methodology.fromJson,
    asOf: (v) => v.meta.dataAsOf,
    keep: true,
  );
}, retry: noRetry);

/// The five bands, Low (step 1) to Severe (step 5), with their names and
/// "of 100" ranges as the server words them. Pass the labels to T15's
/// `BandScale` and `Riskometer`; never write band names in a client.
final bandsProvider = FutureProvider<List<BandRange>>((ref) async {
  final methodology = await ref.watch(methodologyProvider.future);
  return [...methodology.value.bands]..sort((a, b) => a.step.compareTo(b.step));
}, retry: noRetry);

/// The about page (who runs Plinth, how it makes money, coverage).
final aboutProvider = FutureProvider<About>((ref) => ref.watch(trustRepositoryProvider).about(), retry: noRetry);
