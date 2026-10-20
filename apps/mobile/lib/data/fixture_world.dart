import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;
import 'package:plinth_fixtures/plinth_fixtures.dart';

import '../core/clock.dart';
import 'api_client.dart';

// FIXTURES mode's backend (BUILD_PLAN §1 rule 1): the canonical fixture world
// of DESIGN §5b, with no accounts and no network.
//
// Reads come from packages/fixtures/expected, bundled by plinth_fixtures, the
// same files the web's fixture mode and CI's contract tests use. Each
// function's `_requests.json` maps a fixture key to the RPC arguments that
// produce it, so `api.risk_summary(p_slug: 'kestrel-park')` finds
// `expected/risk_summary/kestrel-park.json`. Writes are held in memory for the
// life of the app ([FixtureSession]), idempotent on `p_client_id` like the
// server. Nothing here invents a fact: a call with no fixture is `not_found`.

/// The `api` functions that need a signed-in buyer (API_CONTRACTS §3.2).
const buyerFunctions = <String>{
  'me',
  'device_register',
  'follow',
  'unfollow',
  'set_follow_type',
  'following_feed',
  'mark_following_seen',
  'link_whatsapp_follows',
  'alert_prefs_get',
  'alert_prefs_set',
  'saved_search_save',
  'saved_search_delete',
  'family_circle',
  'family_invite_create',
  'family_invite_cancel',
  'family_member_remove',
  'family_member_undo',
  'family_join',
  'shortlist_note_add',
  'who_has_my_number',
  'consent_history',
  'consent_withdraw',
  'relay_renew',
  'data_export_request',
  'account_delete_request',
  'request_project',
};

/// The buyer functions that change something (the rest only read).
const writeFunctions = <String>{
  'device_register',
  'follow',
  'unfollow',
  'set_follow_type',
  'mark_following_seen',
  'link_whatsapp_follows',
  'alert_prefs_set',
  'saved_search_save',
  'saved_search_delete',
  'family_invite_create',
  'family_invite_cancel',
  'family_member_remove',
  'family_member_undo',
  'family_join',
  'shortlist_note_add',
  'consent_withdraw',
  'relay_renew',
  'data_export_request',
  'account_delete_request',
  'request_project',
};

/// One write the fixture world accepted.
class FixtureWrite {
  const FixtureWrite(this.fn, this.args, this.at);

  final String fn;
  final JsonMap args;
  final DateTime at;

  @override
  String toString() => 'api.$fn($args)';
}

/// The in-memory side of the fixture world: who is signed in and what they
/// changed since the app started.
class FixtureSession {
  FixtureSession({this._signedIn = false});

  final _changes = StreamController<bool>.broadcast();
  bool _signedIn;

  /// Whether the fixture buyer is signed in. Buyer functions need it.
  bool get signedIn => _signedIn;
  set signedIn(bool value) {
    if (value == _signedIn) return;
    _signedIn = value;
    if (!_changes.isClosed) _changes.add(value);
  }

  /// Emits [signedIn] whenever it changes.
  Stream<bool> get changes => _changes.stream;

  /// Every accepted write, in order.
  final List<FixtureWrite> writes = [];

  /// The first result for each `p_client_id`: a replay gets it again.
  final Map<String, Object?> results = {};

  /// Follows changed in this session: slug → follow type.
  final Map<String, String> follows = {};

  /// Slugs unfollowed in this session.
  final Set<String> unfollowed = {};

  /// The last alert preferences set in this session (`p_prefs`).
  JsonMap? alertPrefs;

  /// Consent refs withdrawn in this session.
  final Set<String> withdrawn = {};

  void dispose() => _changes.close();
}

/// Serves `api.<fn>` from packages/fixtures/expected (see the file comment).
class FixtureWorld implements ApiClient {
  FixtureWorld({AssetBundle? bundle, DateTime Function()? now, bool signedIn = false})
    : _bundle = bundle ?? rootBundle,
      _now = now ?? (() => plinthFixedNow),
      session = FixtureSession(signedIn: signedIn);

  final AssetBundle _bundle;
  final DateTime Function() _now;
  final FixtureSession session;

  final _requests = <String, Future<Map<String, JsonMap>>>{};
  final _payloads = <String, Future<JsonMap>>{};

  /// The folder under `expected/` that holds [fn]'s payloads. Usually [fn];
  /// the alert-preference pair shares `alert_prefs`.
  static String folderOf(String fn) => _folders[fn] ?? fn;
  static const _folders = {'alert_prefs_get': 'alert_prefs', 'alert_prefs_set': 'alert_prefs'};

  /// The fixture keys of [folder], as bundled.
  static List<String> keysOf(String folder) => plinthExpectedKeys[folder] ?? const [];

  /// Loads one payload by its fixture key. The bundle is read uncached: the
  /// world keeps its own copy, and a cached future would belong to whichever
  /// test zone loaded it first.
  Future<JsonMap> payload(String folder, String key) {
    return _payloads['$folder/$key'] ??= _bundle
        .loadString(plinthExpectedAsset(folder, key), cache: false)
        .then((raw) => jsonDecode(raw) as JsonMap);
  }

  /// [folder]'s `_requests.json`: fixture key → RPC arguments (plus metadata
  /// such as a design `state`). Empty when the folder has no fixtures yet.
  Future<Map<String, JsonMap>> requests(String folder) {
    return _requests[folder] ??= () async {
      if (keysOf(folder).isEmpty) return <String, JsonMap>{};
      final raw = await _bundle.loadString(plinthExpectedAsset(folder, '_requests'), cache: false);
      final all = (jsonDecode(raw) as JsonMap)['requests'] as Map<String, dynamic>;
      return {for (final e in all.entries) e.key: Map<String, dynamic>.from(e.value as Map)};
    }();
  }

  /// The fixture key for `api.<fn>(args)`, or null.
  ///
  /// A request matches when each of its `p_` arguments equals the call's
  /// (`p_client_id` aside; absent equals null). Among several, the one naming
  /// the most arguments wins. Design-state variants (a request with a `state`,
  /// e.g. `facts_only`) match only when [state] names them. A search also
  /// matches on its query text alone, ignoring case and spacing.
  Future<String?> keyFor(String fn, JsonMap args, {String? state}) async {
    final requests = await this.requests(folderOf(fn));
    final call = _pArgs(args);
    String? best;
    var bestSize = -1;
    for (final MapEntry(key: key, value: request) in requests.entries) {
      if (request['state'] != state) continue;
      final want = _pArgs(request);
      if (want.length > bestSize && want.entries.every((w) => _jsonEquals(w.value, call[w.key]))) {
        best = key;
        bestSize = want.length;
      }
    }
    if (best != null || fn != 'search_projects') return best;
    final q = _normalise(call['p_q']);
    for (final MapEntry(key: key, value: request) in requests.entries) {
      if (request['state'] == state && _normalise(request['p_q']) == q) return key;
    }
    return null;
  }

  /// The payload for `api.<fn>(args)`, or [ApiException] `not_found`.
  Future<JsonMap> read(String fn, [JsonMap args = const {}, String? state]) async {
    final key = await keyFor(fn, args, state: state);
    if (key == null) throw _missing(fn, args, state);
    final json = await payload(folderOf(fn), key);
    if (fn == 'alert_prefs_get' && session.alertPrefs != null) {
      return {...json, 'prefs': session.alertPrefs};
    }
    return json;
  }

  /// Accepts a write: checks sign-in, applies it to [session] and returns the
  /// fixture payload for it, or null when the fixture world has none (the
  /// write still counts). A replayed `p_client_id` returns the first result.
  Future<JsonMap?> write(String fn, JsonMap args) async {
    _requireSignIn(fn);
    final clientId = args['p_client_id'] as String?;
    if (clientId != null && session.results.containsKey(clientId)) {
      return session.results[clientId] as JsonMap?;
    }
    _apply(fn, args);
    session.writes.add(FixtureWrite(fn, Map.unmodifiable(args), _now()));
    final result = await _writeResult(fn, args);
    if (clientId != null) session.results[clientId] = result;
    return result;
  }

  /// [write] for a typed answer: `not_found` when the fixture world has no
  /// answer payload for [fn] yet (the write still counts).
  Future<JsonMap> writeAnswered(String fn, JsonMap args) async =>
      await write(fn, args) ??
      (throw ApiException(
        ApiErrorCode.notFound,
        status: 404,
        fn: fn,
        details: 'No answer payload for api.$fn in packages/fixtures/expected/${folderOf(fn)}.',
      ));

  @override
  Future<Object?> rpc(String fn, [JsonMap args = const {}]) async {
    if (writeFunctions.contains(fn)) return await write(fn, args) ?? const {'ok': true};
    _requireSignIn(fn);
    return read(fn, args);
  }

  void _requireSignIn(String fn) {
    if (buyerFunctions.contains(fn) && !session.signedIn) {
      throw ApiException(ApiErrorCode.authRequired, status: 401, fn: fn, details: 'Sign in to use api.$fn.');
    }
  }

  void _apply(String fn, JsonMap args) {
    final slug = args['p_slug'] as String?;
    switch (fn) {
      case 'follow' || 'set_follow_type':
        session.follows[slug!] = args['p_follow_type'] as String;
        session.unfollowed.remove(slug);
      case 'unfollow':
        session.follows.remove(slug);
        session.unfollowed.add(slug!);
      case 'alert_prefs_set':
        session.alertPrefs = Map<String, dynamic>.from(args['p_prefs'] as Map);
      case 'consent_withdraw':
        session.withdrawn.add(args['p_ref'] as String);
    }
  }

  Future<JsonMap?> _writeResult(String fn, JsonMap args) async {
    // alert_prefs_set answers with the preferences as now set.
    if (fn == 'alert_prefs_set') {
      return await keyFor('alert_prefs_get', const {}) == null ? null : read('alert_prefs_get');
    }
    final key = await keyFor(fn, args);
    return key == null ? null : payload(folderOf(fn), key);
  }

  static ApiException _missing(String fn, JsonMap args, String? state) => ApiException(
    ApiErrorCode.notFound,
    status: 404,
    fn: fn,
    details:
        'No fixture for api.$fn(${_pArgs(args)})${state == null ? '' : ' in state $state'} '
        'in packages/fixtures/expected/${folderOf(fn)}.',
  );

  static JsonMap _pArgs(JsonMap args) => {
    for (final e in args.entries)
      if (e.key.startsWith('p_') && e.key != 'p_client_id' && e.value != null) e.key: e.value,
  };

  static String? _normalise(Object? q) => q is String ? q.toLowerCase().replaceAll(RegExp(r'\s+'), ' ').trim() : null;

  static bool _jsonEquals(Object? a, Object? b) {
    if (a is Map && b is Map) {
      final ka = a.keys.where((k) => a[k] != null).toSet();
      final kb = b.keys.where((k) => b[k] != null).toSet();
      return ka.length == kb.length && ka.every((k) => kb.contains(k) && _jsonEquals(a[k], b[k]));
    }
    if (a is List && b is List) {
      if (a.length != b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (!_jsonEquals(a[i], b[i])) return false;
      }
      return true;
    }
    return a == b;
  }

  void dispose() => session.dispose();
}

/// The fixture world for this app run (FIXTURES mode only; see
/// `fixture_providers.dart`).
final fixtureWorldProvider = Provider<FixtureWorld>((ref) {
  final world = FixtureWorld(now: ref.watch(clockProvider));
  ref.onDispose(world.dispose);
  return world;
});
