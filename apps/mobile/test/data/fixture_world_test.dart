import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/clock.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/auth.dart';
import 'package:plinth/data/fixture_world.dart';
import 'package:plinth/data/local_store.dart';
import 'package:plinth/data/offline_cache.dart';
import 'package:plinth/data/session.dart';
import 'package:plinth/fixtures/fixture_mode.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;
import 'package:plinth_fixtures/plinth_fixtures.dart';

import 'data_test_helpers.dart';

Matcher _apiError(String code) => throwsA(isA<ApiException>().having((e) => e.code, 'code', code));

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('FixtureWorld: finding a fixture by its RPC arguments', () {
    late FixtureWorld world;
    setUp(() => world = FixtureWorld());

    test('a slug finds its key; p_client_id and nulls are ignored', () async {
      expect(await world.keyFor('risk_summary', {'p_slug': 'kestrel-park'}), 'kestrel-park');
      expect(
        await world.keyFor('risk_summary', {'p_slug': 'kestrel-park', 'p_client_id': 'x', 'p_other': null}),
        'kestrel-park',
      );
      expect(await world.keyFor('risk_summary', {'p_slug': 'indigo-terraces'}), isNull);
    });

    test('a design state is chosen only when asked for', () async {
      const aurelia = {'p_slug': 'aurelia-heights-phase-2'};
      expect(await world.keyFor('risk_summary', aurelia), 'aurelia-heights-phase-2');
      expect(await world.keyFor('risk_summary', aurelia, state: 'facts_only'), 'aurelia-heights-phase-2--facts-only');
    });

    test('a search matches all its arguments, then its query text alone', () async {
      const all = {
        'p_q': '',
        'p_filters': null,
        'p_sort': 'lowest_risk',
        'p_bbox': null,
        'p_cursor': null,
        'p_limit': 20,
      };
      expect(await world.keyFor('search_projects', all), 'all-gurugram');
      expect(await world.keyFor('search_projects', {...all, 'p_q': '3 BHK Noida'}), 'outside-coverage');
      expect(await world.keyFor('search_projects', {...all, 'p_q': 'kestrel'}), isNull);
    });

    test('a function with no fixtures is not_found, naming the folder', () async {
      expect(await world.requests('not_a_function'), isEmpty);
      await expectLater(world.read('not_a_function', {'p_q': 'aur'}), _apiError(ApiErrorCode.notFound));
      try {
        await world.read('not_a_function', {'p_q': 'aur'});
      } on ApiException catch (e) {
        expect(e.details, contains('packages/fixtures/expected/not_a_function'));
      }
    });

    test('payloads are the bundled expected JSON', () async {
      final json = await world.payload('risk_summary', 'coral-towers');
      final again = await world.payload('risk_summary', 'coral-towers');
      expect(identical(json, again), isTrue, reason: 'loaded once per world');
      expect(json['schema'], 'plinth.risk_summary/1');
    });
  });

  group('FixtureWorld: the buyer session', () {
    test('buyer functions need the fixture buyer signed in', () async {
      final world = FixtureWorld();
      await expectLater(world.rpc('who_has_my_number'), _apiError(ApiErrorCode.authRequired));
      await expectLater(
        world.rpc('follow', {'p_slug': 'kestrel-park', 'p_follow_type': 'watching', 'p_client_id': 'a'}),
        _apiError(ApiErrorCode.authRequired),
      );
      // Public reads never do.
      expect((await world.rpcMap('risk_summary', {'p_slug': 'kestrel-park'}))['schema'], 'plinth.risk_summary/1');
    });

    test('writes are held in order and a replayed p_client_id counts once', () async {
      final world = FixtureWorld(signedIn: true);
      final follow = {'p_slug': 'kestrel-park', 'p_follow_type': 'watching', 'p_source': 'app', 'p_client_id': 'a'};
      expect(await world.rpc('follow', follow), {'ok': true}, reason: 'no answer fixture yet: acknowledged');
      await world.rpc('follow', follow); // the SyncQueue replaying after a lost answer
      await world.rpc('set_follow_type', {'p_slug': 'kestrel-park', 'p_follow_type': 'booked', 'p_client_id': 'b'});
      await world.rpc('unfollow', {'p_slug': 'aurelia-heights-phase-2', 'p_client_id': 'c'});
      expect(world.session.writes.map((w) => w.fn), ['follow', 'set_follow_type', 'unfollow']);
      expect(world.session.writes.first.at, plinthFixedNow);
      expect(world.session.follows, {'kestrel-park': 'booked'});
      expect(world.session.unfollowed, {'aurelia-heights-phase-2'});
    });

    test('a typed write with no answer fixture is not_found, but still counts', () async {
      final world = FixtureWorld(signedIn: true);
      await expectLater(
        // C-1018-11 is the visit relay: T03b answers only the number shares (C-1012-04 …).
        world.writeAnswered('consent_withdraw', {'p_ref': 'C-1018-11'}),
        _apiError(ApiErrorCode.notFound),
      );
      expect(world.session.withdrawn, {'C-1018-11'});
    });

    test('alert preferences set in the session are what a later read returns', () async {
      final world = FixtureWorld(signedIn: true);
      final prefs = {
        'whatsapp': {'digest': 'off'},
      };
      await world.rpc('alert_prefs_set', {'p_prefs': prefs, 'p_client_id': 'p'});
      expect(world.session.alertPrefs, prefs);
      if (FixtureWorld.keysOf('alert_prefs').isNotEmpty) {
        expect((await world.rpcMap('alert_prefs_get'))['prefs'], prefs);
      }
    });
  });

  group('FixtureAuthRepository', () {
    test('any 6-digit code signs the fixture buyer in; signedInProvider follows', () async {
      final container = fixturesContainer();
      addTearDown(container.dispose);
      final auth = container.read(authRepositoryProvider);
      expect(auth, isA<FixtureAuthRepository>());
      final seen = <bool>[];
      container.listen(signedInProvider, (_, now) => seen.add(now));
      expect(container.read(signedInProvider), isFalse);

      await auth.sendCode('fixture-buyer-phone');
      await expectLater(
        auth.verifyCode(phone: 'fixture-buyer-phone', code: '12345'),
        _apiError(ApiErrorCode.invalidInput),
      );
      await auth.verifyCode(phone: 'fixture-buyer-phone', code: '482913');
      await pumpEventQueue();
      expect(container.read(signedInProvider), isTrue);
      expect(container.read(fixtureWorldProvider).session.signedIn, isTrue);

      await auth.signOut();
      await pumpEventQueue();
      expect(container.read(signedInProvider), isFalse);
      expect(seen, [true, false]);
    });

    test('device registration goes to the fixture world', () async {
      final container = fixturesContainer(signedIn: true);
      addTearDown(container.dispose);
      final ok = await container
          .read(authRepositoryProvider)
          .registerDevice(token: 'fcm-token-for-tests', platform: 'android', appVersion: '0.1.0');
      expect(ok.ok, isTrue);
      expect(container.read(fixtureWorldProvider).session.writes.single.fn, 'device_register');
    });
  });

  test('FIXTURES mode overrides every repository and keeps everything in memory', () {
    // The container main.dart builds in FIXTURES mode.
    final container = ProviderContainer(overrides: fixtureModeOverrides());
    addTearDown(container.dispose);
    expect(container.read(supabaseProvider), isNull);
    expect(container.read(apiClientProvider), same(container.read(fixtureWorldProvider)));
    expect(container.read(localStoreProvider), isA<MemoryLocalStore>());
    expect(container.read(offlineCacheProvider), isA<MemoryOfflineCache>());
    expect(container.read(clockProvider)(), plinthFixedNow);
  });
}
