import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'offline_cache.dart';
import 'session.dart';

// A phase: its RiskSummary (the one risk object, identical on web, app and
// WhatsApp; API_CONTRACTS §2), its project page (§4.2) and a shared card's
// "changed since" view. Screens: AppProject (T31a), AppProjectStates (T31b),
// AppRisk (T32).

/// A phase to read and, in FIXTURES builds, a design state to preview.
@immutable
class PhaseRef {
  const PhaseRef(this.slug, {this.previewState});

  final String slug;

  /// A design-state variant of the fixture world (`facts_only`), from the
  /// router's FIXTURES-only `?state=`. Live mode ignores it: production state
  /// always comes from `RiskSummary.display`.
  final String? previewState;

  @override
  bool operator ==(Object other) => other is PhaseRef && other.slug == slug && other.previewState == previewState;

  @override
  int get hashCode => Object.hash(slug, previewState);

  @override
  String toString() => previewState == null ? slug : '$slug?state=$previewState';
}

abstract interface class ProjectRepository {
  /// `api.risk_summary(p_slug)`.
  Future<RiskSummary> riskSummary(PhaseRef phase);

  /// `api.project_page(p_slug)`.
  Future<ProjectPage> projectPage(PhaseRef phase);

  /// `api.share_card(p_code)`: an old card and what changed since (M2).
  Future<ShareCard> shareCard(String code);
}

class SupabaseProjectRepository implements ProjectRepository {
  SupabaseProjectRepository(this._api);

  final ApiClient _api;

  @override
  Future<RiskSummary> riskSummary(PhaseRef phase) async =>
      RiskSummary.fromJson(await _api.rpcMap('risk_summary', {'p_slug': phase.slug}));

  @override
  Future<ProjectPage> projectPage(PhaseRef phase) async =>
      ProjectPage.fromJson(await _api.rpcMap('project_page', {'p_slug': phase.slug}));

  @override
  Future<ShareCard> shareCard(String code) async =>
      ShareCard.fromJson(await _api.rpcMap('share_card', {'p_code': code}));
}

class FixtureProjectRepository implements ProjectRepository {
  FixtureProjectRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<RiskSummary> riskSummary(PhaseRef phase) async =>
      RiskSummary.fromJson(await _world.read('risk_summary', {'p_slug': phase.slug}, phase.previewState));

  @override
  Future<ProjectPage> projectPage(PhaseRef phase) async =>
      ProjectPage.fromJson(await _world.read('project_page', {'p_slug': phase.slug}, phase.previewState));

  @override
  Future<ShareCard> shareCard(String code) async =>
      ShareCard.fromJson(await _world.read('share_card', {'p_code': code}));
}

final projectRepositoryProvider = Provider<ProjectRepository>(
  (ref) => SupabaseProjectRepository(ref.watch(apiClientProvider)),
);

/// A phase's RiskSummary. A followed phase also reads offline, from the copy
/// saved on the phone ([Cached.offline], with its "as of" date).
final riskSummaryProvider = FutureProvider.family<Cached<RiskSummary>, PhaseRef>((ref, phase) {
  final repo = ref.watch(projectRepositoryProvider);
  return readThrough(
    ref.watch(offlineCacheProvider),
    kind: 'risk_summary',
    // A design-state preview is never saved: its key matches no saved copy.
    id: phase.toString(),
    fetch: () => repo.riskSummary(phase),
    toJson: (v) => v.toJson(),
    fromJson: RiskSummary.fromJson,
    asOf: (v) => v.meta.dataAsOf,
  );
}, retry: noRetry);

/// A phase's project page; offline as [riskSummaryProvider].
final projectPageProvider = FutureProvider.family<Cached<ProjectPage>, PhaseRef>((ref, phase) {
  final repo = ref.watch(projectRepositoryProvider);
  return readThrough(
    ref.watch(offlineCacheProvider),
    kind: 'project_page',
    id: phase.toString(),
    fetch: () => repo.projectPage(phase),
    toJson: (v) => v.toJson(),
    fromJson: ProjectPage.fromJson,
    asOf: (v) => v.meta.dataAsOf,
  );
}, retry: noRetry);

/// A shared card and what changed since it was sent (`/c/<code>`).
final shareCardProvider = FutureProvider.family<ShareCard, String>(
  (ref, code) => ref.watch(projectRepositoryProvider).shareCard(code),
  retry: noRetry,
);
