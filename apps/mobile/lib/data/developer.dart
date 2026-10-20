import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// A developer group's page (API_CONTRACTS §4.4): track record, ongoing
// phases, complaints and the facts-only notice.

abstract interface class DeveloperRepository {
  /// `api.developer_page(p_slug)`. [previewState] is a FIXTURES-only design
  /// state (`facts_only`); live mode ignores it.
  Future<DeveloperPage> developerPage(String slug, {String? previewState});
}

class SupabaseDeveloperRepository implements DeveloperRepository {
  SupabaseDeveloperRepository(this._api);

  final ApiClient _api;

  @override
  Future<DeveloperPage> developerPage(String slug, {String? previewState}) async =>
      DeveloperPage.fromJson(await _api.rpcMap('developer_page', {'p_slug': slug}));
}

class FixtureDeveloperRepository implements DeveloperRepository {
  FixtureDeveloperRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<DeveloperPage> developerPage(String slug, {String? previewState}) async =>
      DeveloperPage.fromJson(await _world.read('developer_page', {'p_slug': slug}, previewState));
}

final developerRepositoryProvider = Provider<DeveloperRepository>(
  (ref) => SupabaseDeveloperRepository(ref.watch(apiClientProvider)),
);

/// A developer group's page, by group slug.
final developerPageProvider = FutureProvider.family<DeveloperPage, String>(
  (ref, slug) => ref.watch(developerRepositoryProvider).developerPage(slug),
  retry: noRetry,
);
