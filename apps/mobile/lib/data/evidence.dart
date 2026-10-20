import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// The evidence drawer (F-06, API_CONTRACTS §4.6): one sourced fact, its
// document, dates, extract and how it was read. A reason's `SourceRef`
// carries the fact ids and `evidence_url` = `/evidence/<fact_id>`.

/// A fact to show, and the phase whose page opened the drawer.
@immutable
class EvidenceRef {
  const EvidenceRef(this.factId, {this.slug});

  final String factId;

  /// The phase being viewed. T13 adds the optional `p_slug` to
  /// `api.evidence`, so a shared group fact names the reason on this page.
  /// Sent only when set; leave it null until T13's function is live.
  final String? slug;

  @override
  bool operator ==(Object other) => other is EvidenceRef && other.factId == factId && other.slug == slug;

  @override
  int get hashCode => Object.hash(factId, slug);

  @override
  String toString() => slug == null ? factId : '$factId@$slug';
}

abstract interface class EvidenceRepository {
  /// `api.evidence(p_fact_id[, p_slug])`.
  Future<Evidence> evidence(EvidenceRef ref);
}

class SupabaseEvidenceRepository implements EvidenceRepository {
  SupabaseEvidenceRepository(this._api);

  final ApiClient _api;

  @override
  Future<Evidence> evidence(EvidenceRef ref) async =>
      Evidence.fromJson(await _api.rpcMap('evidence', {'p_fact_id': ref.factId, 'p_slug': ?ref.slug}));
}

class FixtureEvidenceRepository implements EvidenceRepository {
  FixtureEvidenceRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<Evidence> evidence(EvidenceRef ref) async =>
      Evidence.fromJson(await _world.read('evidence', {'p_fact_id': ref.factId, 'p_slug': ?ref.slug}));
}

final evidenceRepositoryProvider = Provider<EvidenceRepository>(
  (ref) => SupabaseEvidenceRepository(ref.watch(apiClientProvider)),
);

/// One evidence item for the drawer.
final evidenceProvider = FutureProvider.family<Evidence, EvidenceRef>(
  (ref, e) => ref.watch(evidenceRepositoryProvider).evidence(e),
  retry: noRetry,
);
