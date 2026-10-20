import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'auth.dart';
import 'fixture_world.dart';
import 'local_store.dart';
import 'offline_cache.dart';
import 'project.dart';
import 'session.dart';
import 'sync_queue.dart';

// Following (API_CONTRACTS §4.7–§4.8): follow and unfollow a phase, the follow
// type (watching or booked), "Since you last looked" and the offline copy of
// followed projects. Screens: the Follow action on AppProject (T31a),
// AppFollowing (T50). Follows go through the SyncQueue, so they work offline.

abstract interface class FollowRepository {
  /// `api.follow(p_slug, p_follow_type, p_source, p_client_id)`.
  Future<Follow> follow(String slug, {required String type, required String source, required String clientId});

  /// `api.unfollow(p_slug, p_client_id)`.
  Future<Ok> unfollow(String slug, {required String clientId});

  /// `api.set_follow_type(p_slug, p_follow_type, p_client_id)`. "Booked" adds
  /// payment-stage alerts and returns links.
  Future<Follow> setFollowType(String slug, {required String type, required String clientId});

  /// `api.following_feed(p_since)`: what changed since [since] (an ISO date or
  /// timestamp), or since the buyer last looked when null.
  Future<FollowingFeed> feed({String? since});

  /// `api.mark_following_seen()`.
  Future<Ok> markSeen();

  /// `api.link_whatsapp_follows(p_accept)`: "Bring them here". Shape pending
  /// (T45a), returned as JSON.
  Future<JsonMap> linkWhatsappFollows({required bool accept});
}

JsonMap _followArgs(String slug, String type, String source, String clientId) =>
    FollowRequest(pSlug: slug, pFollowType: type, pSource: source, pClientId: clientId).toJson();

class SupabaseFollowRepository implements FollowRepository {
  SupabaseFollowRepository(this._api);

  final ApiClient _api;

  @override
  Future<Follow> follow(String slug, {required String type, required String source, required String clientId}) async =>
      Follow.fromJson(await _api.rpcMap('follow', _followArgs(slug, type, source, clientId)));

  @override
  Future<Ok> unfollow(String slug, {required String clientId}) async =>
      Ok.fromJson(await _api.rpcMap('unfollow', {'p_slug': slug, 'p_client_id': clientId}));

  @override
  Future<Follow> setFollowType(String slug, {required String type, required String clientId}) async => Follow.fromJson(
    await _api.rpcMap('set_follow_type', {'p_slug': slug, 'p_follow_type': type, 'p_client_id': clientId}),
  );

  @override
  Future<FollowingFeed> feed({String? since}) async =>
      FollowingFeed.fromJson(await _api.rpcMap('following_feed', {'p_since': since}));

  @override
  Future<Ok> markSeen() async => Ok.fromJson(await _api.rpcMap('mark_following_seen'));

  @override
  Future<JsonMap> linkWhatsappFollows({required bool accept}) =>
      _api.rpcMap('link_whatsapp_follows', {'p_accept': accept});
}

/// The fixture buyer's follows (`expected/following_feed`, T03b). A write is
/// held in the fixture session; its answer is the fixture payload for it, or
/// `not_found` when the fixture world has none yet.
class FixtureFollowRepository implements FollowRepository {
  FixtureFollowRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<Follow> follow(String slug, {required String type, required String source, required String clientId}) async =>
      Follow.fromJson(await _world.writeAnswered('follow', _followArgs(slug, type, source, clientId)));

  @override
  Future<Ok> unfollow(String slug, {required String clientId}) async {
    await _world.write('unfollow', {'p_slug': slug, 'p_client_id': clientId});
    return Ok(ok: true);
  }

  @override
  Future<Follow> setFollowType(String slug, {required String type, required String clientId}) async => Follow.fromJson(
    await _world.writeAnswered('set_follow_type', {'p_slug': slug, 'p_follow_type': type, 'p_client_id': clientId}),
  );

  @override
  Future<FollowingFeed> feed({String? since}) async =>
      FollowingFeed.fromJson(await _world.rpcMap('following_feed', {'p_since': since}));

  @override
  Future<Ok> markSeen() async {
    await _world.write('mark_following_seen', const {});
    return Ok(ok: true);
  }

  @override
  Future<JsonMap> linkWhatsappFollows({required bool accept}) async =>
      await _world.write('link_whatsapp_follows', {'p_accept': accept}) ?? const {'ok': true};
}

final followRepositoryProvider = Provider<FollowRepository>(
  (ref) => SupabaseFollowRepository(ref.watch(apiClientProvider)),
);

/// "Since you last looked" for the signed-in buyer, kept on the phone for
/// offline use; null when signed out.
final followingFeedProvider = FutureProvider<Cached<FollowingFeed>?>((ref) async {
  if (!ref.watch(signedInProvider)) return null;
  final repo = ref.watch(followRepositoryProvider);
  return readThrough(
    ref.watch(offlineCacheProvider),
    kind: 'following_feed',
    id: 'me',
    fetch: repo.feed,
    toJson: (v) => v.toJson(),
    fromJson: FollowingFeed.fromJson,
    keep: true,
  );
}, retry: noRetry);

/// The feed since a replay date (a jump chip's `date`).
final followingFeedSinceProvider = FutureProvider.family<FollowingFeed, String>(
  (ref, since) => ref.watch(followRepositoryProvider).feed(since: since),
  retry: noRetry,
);

/// Saves and drops the offline copies of followed projects.
class FollowedOffline {
  FollowedOffline(this._projects, this._cache);

  final ProjectRepository _projects;
  final OfflineCache _cache;

  /// Fetches and saves [slug]'s risk summary and project page. Best effort:
  /// offline, the next refresh saves them.
  Future<void> keep(String slug) async {
    final phase = PhaseRef(slug);
    try {
      final risk = await _projects.riskSummary(phase);
      await _cache.put('risk_summary', slug, risk.toJson(), asOf: risk.meta.dataAsOf);
      final page = await _projects.projectPage(phase);
      await _cache.put('project_page', slug, page.toJson(), asOf: page.meta.dataAsOf);
    } catch (e) {
      // Best effort, and never awaited: offline (or a payload this build
      // cannot read), the next refresh saves it. Nothing may escape.
      debugPrint('Offline copy of $slug not saved: $e');
    }
  }

  Future<void> drop(String slug) async {
    await _cache.remove('risk_summary', slug);
    await _cache.remove('project_page', slug);
  }

  /// Refreshes every followed project's saved copy.
  Future<void> refreshAll(Iterable<String> slugs) async {
    for (final slug in slugs) {
      await keep(slug);
    }
  }
}

final followedOfflineProvider = Provider<FollowedOffline>(
  (ref) => FollowedOffline(ref.watch(projectRepositoryProvider), ref.watch(offlineCacheProvider)),
);

/// The buyer's follows as this phone knows them: slug → follow type
/// ([FollowType]). The server's list (the feed's projects) with the changes
/// still in the SyncQueue on top, so a follow made offline shows at once.
class FollowsController extends Notifier<Map<String, String>> {
  static const storeKey = 'data.follows.v1';

  @override
  Map<String, String> build() {
    // A plain subscription: Riverpod pauses `ref.listen` while nothing
    // watches this controller, and a sign-out must always forget.
    final auth = ref.read(authRepositoryProvider).changes.listen((now) => now ? null : _forget());
    ref.onDispose(auth.cancel);
    ref.listen(followingFeedProvider, (_, next) {
      final feed = next.value?.value;
      if (feed != null) syncFrom(feed);
    });
    // A feed loaded before this controller: take it once build has returned.
    final loaded = ref.read(followingFeedProvider).value?.value;
    if (loaded != null) scheduleMicrotask(() => ref.mounted ? syncFrom(loaded) : null);
    final sub = ref.read(syncQueueProvider.notifier).outcomes.listen(_onOutcome);
    ref.onDispose(sub.cancel);
    unawaited(_load());
    return const {};
  }

  Future<void> _load() async {
    final raw = await ref.read(localStoreProvider).read(storeKey);
    if (raw == null || !ref.mounted || state.isNotEmpty) return;
    try {
      state = Map<String, String>.from(jsonDecode(raw) as Map);
    } catch (_) {}
  }

  Future<void> _save() async {
    if (!ref.mounted) return;
    await ref.read(localStoreProvider).write(storeKey, state.isEmpty ? null : jsonEncode(state));
  }

  /// Takes the server's list from [feed], keeps the queued changes on top,
  /// and refreshes the offline copies.
  void syncFrom(FollowingFeed feed) {
    final next = {for (final p in feed.projects) p.slug: p.followType};
    for (final w in ref.read(syncQueueProvider)) {
      _apply(next, w.fn, w.args);
    }
    state = next;
    unawaited(_save());
    unawaited(ref.read(followedOfflineProvider).refreshAll(next.keys));
  }

  static void _apply(Map<String, String> follows, String fn, JsonMap args) {
    final slug = args['p_slug'] as String?;
    if (slug == null) return;
    switch (fn) {
      case 'follow' || 'set_follow_type':
        follows[slug] = args['p_follow_type'] as String;
      case 'unfollow':
        follows.remove(slug);
    }
  }

  /// Follows [slug]. Shows at once; the SyncQueue sends it (offline, later).
  /// Returns the server's [Follow] (alerts line, private line) when it was
  /// sent and answered with one; null when it waits in the queue. When the
  /// server refuses, the follow is undone and the [ApiException] rethrown.
  Future<Follow?> follow(String slug, {String type = FollowType.watching}) async {
    final before = state[slug];
    _set(slug, type);
    unawaited(ref.read(followedOfflineProvider).keep(slug));
    final outcome = await ref.read(syncQueueProvider.notifier).send('follow', {
      'p_slug': slug,
      'p_follow_type': type,
      'p_source': FollowSource.app,
    });
    return _settle(outcome, slug, before);
  }

  /// Changes [slug]'s follow type (watching ↔ booked). As [follow].
  Future<Follow?> setType(String slug, String type) async {
    final before = state[slug];
    _set(slug, type);
    final outcome = await ref.read(syncQueueProvider.notifier).send('set_follow_type', {
      'p_slug': slug,
      'p_follow_type': type,
    });
    return _settle(outcome, slug, before);
  }

  /// Unfollows [slug] and drops its offline copy. As [follow].
  Future<void> unfollow(String slug) async {
    final before = state[slug];
    _set(slug, null);
    unawaited(ref.read(followedOfflineProvider).drop(slug));
    final outcome = await ref.read(syncQueueProvider.notifier).send('unfollow', {'p_slug': slug});
    await _settle(outcome, slug, before);
  }

  /// Marks "Since you last looked" as seen and reloads the feed.
  Future<void> markSeen() async {
    await ref.read(followRepositoryProvider).markSeen();
    if (ref.mounted) ref.invalidate(followingFeedProvider);
  }

  void _set(String slug, String? type) {
    if (!ref.mounted) return;
    state = {
      for (final e in state.entries)
        if (e.key != slug) e.key: e.value,
      slug: ?type,
    };
    unawaited(_save());
  }

  Future<Follow?> _settle(SyncOutcome outcome, String slug, String? before) async {
    switch (outcome.status) {
      case SyncStatus.sent:
        final json = outcome.payload('plinth.follow/1');
        return json == null ? null : Follow.fromJson(json);
      case SyncStatus.queued:
        return null;
      case SyncStatus.refused:
        _set(slug, before);
        throw outcome.error!;
    }
  }

  /// A queued change the server refused later (after a replay): reload the
  /// server's list.
  void _onOutcome(SyncOutcome outcome) {
    if (outcome.status == SyncStatus.refused && ref.mounted) ref.invalidate(followingFeedProvider);
  }

  Future<void> _forget() async {
    state = const {};
    await _save();
    if (ref.mounted) await ref.read(offlineCacheProvider).clear();
  }
}

final followsProvider = NotifierProvider<FollowsController, Map<String, String>>(FollowsController.new);

/// [slug]'s follow type ([FollowType]), or null when not followed.
final followTypeProvider = Provider.family<String?, String>((ref, slug) => ref.watch(followsProvider)[slug]);
