import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// Search (API_CONTRACTS §4.3), typeahead and "add my project". Screens:
// AppExplore and AppMap (T30). Order never follows money: the server sorts.

/// One search, as `api.search_projects` takes it. Compared by value, so it
/// keys [searchProvider].
@immutable
class SearchQuery {
  const SearchQuery({
    this.q = '',
    this.filters,
    this.sort = defaultSort,
    this.bbox,
    this.cursor,
    this.limit = defaultLimit,
  });

  /// `lowest_risk`, the default sort (T13 publishes the others).
  static const defaultSort = 'lowest_risk';

  /// Page size (≤ 50, API_CONTRACTS §1 "Pagination").
  static const defaultLimit = 20;

  /// What the buyer typed. Empty lists every phase.
  final String q;

  /// Structured filters (chips), on top of what the server parses from [q].
  final SearchFilters? filters;
  final String sort;

  /// The map's bounding box `[west, south, east, north]`, for AppMap.
  final List<double>? bbox;

  /// The previous page's `next_cursor`.
  final String? cursor;
  final int limit;

  /// The RPC arguments. Every one is sent (nulls included), as the contract
  /// lists them; filters leave out unset fields.
  JsonMap toArgs() => {
    'p_q': q,
    'p_filters': filters == null ? null : compactJson(filters!.toJson()),
    'p_sort': sort,
    'p_bbox': bbox,
    'p_cursor': cursor,
    'p_limit': limit,
  };

  /// The search to save (`p_query` of `api.saved_search_save`): what was
  /// asked, without the page. Keys as the web's `SearchQuery`.
  JsonMap toSaved() => compactJson({'q': q, 'filters': filters?.toJson(), 'sort': sort, 'bbox': bbox});

  /// The next page of this search.
  SearchQuery next(String cursor) =>
      SearchQuery(q: q, filters: filters, sort: sort, bbox: bbox, cursor: cursor, limit: limit);

  String get _identity => '${toArgs()}';

  @override
  bool operator ==(Object other) => other is SearchQuery && other._identity == _identity;

  @override
  int get hashCode => _identity.hashCode;

  @override
  String toString() => 'SearchQuery(${toArgs()})';
}

abstract interface class SearchRepository {
  /// `api.search_projects(p_q, p_filters, p_sort, p_bbox, p_cursor, p_limit)`.
  Future<SearchResults> search(SearchQuery query);

  /// `api.suggest(p_q)`: ≤ 8 name, RERA and sector matches as the buyer types.
  Future<SuggestResults> suggest(String q);

  /// `api.request_project(p_name, p_rera)`: "add my project". Returns the
  /// R-MMDD-NN reference (shape pending, T45a), as JSON. Needs sign-in.
  Future<JsonMap> requestProject(String name, {String? rera});
}

class SupabaseSearchRepository implements SearchRepository {
  SupabaseSearchRepository(this._api);

  final ApiClient _api;

  @override
  Future<SearchResults> search(SearchQuery query) async =>
      SearchResults.fromJson(await _api.rpcMap('search_projects', query.toArgs()));

  @override
  Future<SuggestResults> suggest(String q) async => SuggestResults.fromJson(await _api.rpcMap('suggest', {'p_q': q}));

  @override
  Future<JsonMap> requestProject(String name, {String? rera}) =>
      _api.rpcMap('request_project', {'p_name': name, 'p_rera': rera});
}

/// Serves the fixture searches (`expected/search_projects`: all of Gurugram,
/// the canonical query, zero results, an unknown project, outside coverage).
/// Any other query text is `not_found`: the fixture world has no search engine.
class FixtureSearchRepository implements SearchRepository {
  FixtureSearchRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<SearchResults> search(SearchQuery query) async =>
      SearchResults.fromJson(await _world.read('search_projects', query.toArgs()));

  @override
  Future<SuggestResults> suggest(String q) async => SuggestResults.fromJson(await _world.read('suggest', {'p_q': q}));

  @override
  Future<JsonMap> requestProject(String name, {String? rera}) =>
      _world.rpcMap('request_project', {'p_name': name, 'p_rera': rera});
}

final searchRepositoryProvider = Provider<SearchRepository>(
  (ref) => SupabaseSearchRepository(ref.watch(apiClientProvider)),
);

/// Results for one search. `SearchQuery()` lists every phase, lowest delivery
/// risk first.
final searchProvider = FutureProvider.family<SearchResults, SearchQuery>(
  (ref, query) => ref.watch(searchRepositoryProvider).search(query),
  retry: noRetry,
);

/// Typeahead matches for what the buyer has typed so far.
final suggestProvider = FutureProvider.family<SuggestResults, String>(
  (ref, q) => ref.watch(searchRepositoryProvider).suggest(q),
  retry: noRetry,
);
