import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:plinth/core/clock.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/auth.dart';
import 'package:plinth/data/local_store.dart';
import 'package:plinth/data/offline_cache.dart';
import 'package:plinth/data/session.dart';
import 'package:plinth/data/fixture_providers.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show Ok;
import 'package:plinth_fixtures/plinth_fixtures.dart';

/// A contract example (`packages/contracts/examples/<type>/valid/<name>.json`):
/// §5b facts in the contract's shape, used as a live server's answer.
JsonMap contractExample(String type, String name) {
  final file = File('../../packages/contracts/examples/$type/valid/$name.json');
  return jsonDecode(file.readAsStringSync()) as JsonMap;
}

/// One call a [FakeApiClient] received.
typedef RpcCall = ({String fn, JsonMap args});

/// A live backend stand-in: records every `api` call and answers from
/// [answers] (by function name), or throws [OfflineException] while
/// [online] is false. An [ApiException] in [answers] is thrown.
class FakeApiClient implements ApiClient {
  FakeApiClient([Map<String, Object?>? answers]) : answers = {...?answers};

  final Map<String, Object?> answers;
  final List<RpcCall> calls = [];
  bool online = true;

  /// Called before answering, e.g. to fail one write.
  Object? Function(String fn, JsonMap args)? onCall;

  @override
  Future<Object?> rpc(String fn, [JsonMap args = const {}]) async {
    await Future<void>.delayed(Duration.zero);
    if (!online) throw const OfflineException('test: offline');
    calls.add((fn: fn, args: args));
    final override = onCall?.call(fn, args);
    if (override is Exception) throw override;
    if (override != null) return override;
    final answer = answers.containsKey(fn) ? answers[fn] : const {'ok': true};
    if (answer is Exception) throw answer;
    return answer;
  }

  List<String> get fns => [for (final c in calls) c.fn];
}

/// A live-mode auth stand-in with a switchable session.
class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({this._signedIn = true});

  final _changes = StreamController<bool>.broadcast();
  bool _signedIn;

  set signedIn(bool value) {
    _signedIn = value;
    _changes.add(value);
  }

  @override
  bool get signedIn => _signedIn;

  @override
  Stream<bool> get changes => _changes.stream;

  @override
  Future<void> sendCode(String phone) async {}

  @override
  Future<void> verifyCode({required String phone, required String code}) async => signedIn = true;

  @override
  Future<void> signOut() async => signedIn = false;

  @override
  Future<JsonMap> me() async => const {};

  @override
  Future<Ok> registerDevice({required String token, required String platform, required String appVersion}) async =>
      Ok(ok: true);
}

/// A container in live mode against [api] (no Supabase, no network): the
/// default Supabase repositories, a fake session, stores in memory and the
/// frozen clock.
ProviderContainer liveContainer(
  FakeApiClient api, {
  FakeAuthRepository? auth,
  LocalStore? store,
  OfflineCache? cache,
  List<Override> overrides = const [],
}) {
  var ids = 0;
  final container = ProviderContainer(
    overrides: [
      clockProvider.overrideWithValue(() => plinthFixedNow),
      apiClientProvider.overrideWithValue(api),
      authRepositoryProvider.overrideWithValue(auth ?? FakeAuthRepository()),
      clientIdProvider.overrideWithValue(() => 'client-${++ids}'),
      localStoreProvider.overrideWithValue(store ?? MemoryLocalStore()),
      offlineCacheProvider.overrideWithValue(cache ?? MemoryOfflineCache(now: () => plinthFixedNow)),
      ...overrides,
    ],
  );
  return container;
}

/// A container in FIXTURES mode, as `fixtureModeOverrides()` builds it (the
/// frozen clock, then [fixtureOverrides]), optionally signed in.
ProviderContainer fixturesContainer({bool signedIn = false, List<Override> overrides = const []}) => ProviderContainer(
  overrides: [
    clockProvider.overrideWithValue(() => plinthFixedNow),
    ...fixtureOverrides(signedIn: signedIn),
    ...overrides,
  ],
);
