import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'search.dart';
import 'session.dart';
import 'sync_queue.dart';

// Alert preferences and saved searches (API_CONTRACTS §4.9). Utility alerts
// only; WhatsApp needs the buyer's own opt-in, so turning it on without a
// linked WhatsApp contact is refused with `consent_required` and the screen
// opens the WhatsApp opt-in. Screens: AppYou (T51), AppOnboarding (T48).

abstract interface class AlertsRepository {
  /// `api.alert_prefs_get()`.
  Future<AlertPrefs> get();

  /// `api.alert_prefs_set(p_prefs, p_client_id)`.
  Future<AlertPrefs> set(AlertPrefsMap prefs, {required String clientId});

  /// `api.saved_search_save(p_name, p_query, p_client_id)`. `p_query` is the
  /// search without its page ([SearchQuery.toSaved]), as the web sends it.
  /// Shape pending (T45a), returned as JSON.
  Future<JsonMap> saveSearch(String name, SearchQuery query, {required String clientId});

  /// `api.saved_search_delete(p_id)`.
  Future<Ok> deleteSearch(String id);
}

/// `p_prefs` as sent: unset channels and kinds are left out.
JsonMap prefsArgs(AlertPrefsMap prefs) => compactJson(prefs.toJson());

JsonMap _savedSearchArgs(String name, SearchQuery query, String clientId) => {
  'p_name': name,
  'p_query': query.toSaved(),
  'p_client_id': clientId,
};

class SupabaseAlertsRepository implements AlertsRepository {
  SupabaseAlertsRepository(this._api);

  final ApiClient _api;

  @override
  Future<AlertPrefs> get() async => AlertPrefs.fromJson(await _api.rpcMap('alert_prefs_get'));

  @override
  Future<AlertPrefs> set(AlertPrefsMap prefs, {required String clientId}) async =>
      AlertPrefs.fromJson(await _api.rpcMap('alert_prefs_set', {'p_prefs': prefsArgs(prefs), 'p_client_id': clientId}));

  @override
  Future<JsonMap> saveSearch(String name, SearchQuery query, {required String clientId}) =>
      _api.rpcMap('saved_search_save', _savedSearchArgs(name, query, clientId));

  @override
  Future<Ok> deleteSearch(String id) async => Ok.fromJson(await _api.rpcMap('saved_search_delete', {'p_id': id}));
}

/// The fixture buyer's preferences (`expected/alert_prefs`, T03b), with the
/// last change of this session applied.
class FixtureAlertsRepository implements AlertsRepository {
  FixtureAlertsRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<AlertPrefs> get() async => AlertPrefs.fromJson(await _world.rpcMap('alert_prefs_get'));

  @override
  Future<AlertPrefs> set(AlertPrefsMap prefs, {required String clientId}) async => AlertPrefs.fromJson(
    await _world.rpcMap('alert_prefs_set', {'p_prefs': prefsArgs(prefs), 'p_client_id': clientId}),
  );

  @override
  Future<JsonMap> saveSearch(String name, SearchQuery query, {required String clientId}) =>
      _world.rpcMap('saved_search_save', _savedSearchArgs(name, query, clientId));

  @override
  Future<Ok> deleteSearch(String id) async {
    await _world.write('saved_search_delete', {'p_id': id});
    return Ok(ok: true);
  }
}

final alertsRepositoryProvider = Provider<AlertsRepository>(
  (ref) => SupabaseAlertsRepository(ref.watch(apiClientProvider)),
);

/// The signed-in buyer's alert preferences (null when signed out). [save]
/// goes through the SyncQueue, so a change made offline sticks.
class AlertPrefsController extends AsyncNotifier<AlertPrefs?> {
  @override
  Future<AlertPrefs?> build() async {
    if (!ref.watch(signedInProvider)) return null;
    return ref.watch(alertsRepositoryProvider).get();
  }

  /// Saves [prefs]. Shows at once; returns the server's answer when it was
  /// sent, or the shown value while it waits in the queue. When the server
  /// refuses (`consent_required` for WhatsApp without an opt-in), the old
  /// preferences come back and the [ApiException] is rethrown.
  Future<AlertPrefs?> save(AlertPrefsMap prefs) async {
    final before = state.value;
    if (before != null) {
      state = AsyncData(
        AlertPrefs(
          lines: before.lines,
          numberLine: before.numberLine,
          prefs: prefs,
          schema: before.schema,
          whatsappOptin: before.whatsappOptin,
        ),
      );
    }
    final outcome = await ref.read(syncQueueProvider.notifier).send('alert_prefs_set', {'p_prefs': prefsArgs(prefs)});
    if (!ref.mounted) return null;
    switch (outcome.status) {
      case SyncStatus.sent:
        final json = outcome.payload('plinth.alert_prefs/1');
        if (json != null) state = AsyncData(AlertPrefs.fromJson(json));
        return state.value;
      case SyncStatus.queued:
        return state.value;
      case SyncStatus.refused:
        state = AsyncData(before);
        throw outcome.error!;
    }
  }
}

final alertPrefsProvider = AsyncNotifierProvider<AlertPrefsController, AlertPrefs?>(
  AlertPrefsController.new,
  retry: noRetry,
);
