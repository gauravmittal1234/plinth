import 'dart:async';
import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/fixture_world.dart';
import 'package:plinth/data/local_store.dart';
import 'package:plinth/data/sync_queue.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;
import 'package:plinth_fixtures/plinth_fixtures.dart';

import 'data_test_helpers.dart';

QueuedWrite _follow(String slug, String clientId) => QueuedWrite(
  fn: 'follow',
  args: {'p_slug': slug, 'p_follow_type': 'watching', 'p_source': 'app', 'p_client_id': clientId},
  queuedAt: plinthFixedNow,
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late FakeApiClient api;
  late FakeAuthRepository auth;
  late MemoryLocalStore store;
  late ProviderContainer container;
  late SyncQueue queue;

  ProviderContainer start() {
    final c = liveContainer(api, auth: auth, store: store);
    addTearDown(c.dispose);
    return c;
  }

  setUp(() {
    api = FakeApiClient();
    auth = FakeAuthRepository();
    store = MemoryLocalStore();
    container = start();
    queue = container.read(syncQueueProvider.notifier);
  });

  test('online, a write is sent at once and its answer returned', () async {
    api.answers['follow'] = contractExample('follow', 'aurelia-watching');
    final outcome = await queue.submit(_follow('aurelia-heights-phase-2', 'a'));
    expect(outcome.status, SyncStatus.sent);
    expect(outcome.payload('plinth.follow/1')?['alerts_line'], isNotNull);
    expect(container.read(syncQueueProvider), isEmpty);
    expect(api.calls.single.args['p_client_id'], 'a');
  });

  test('offline writes wait, then replay in order', () async {
    api.online = false;
    for (final (slug, id) in [('kestrel-park', 'a'), ('coral-towers', 'b'), ('juniper-enclave', 'c')]) {
      expect((await queue.submit(_follow(slug, id))).status, SyncStatus.queued);
    }
    final unfollow = QueuedWrite(
      fn: 'unfollow',
      args: {'p_slug': 'kestrel-park', 'p_client_id': 'd'},
      queuedAt: plinthFixedNow,
    );
    await queue.submit(unfollow);
    expect(container.read(syncQueueProvider).map((w) => w.clientId), ['a', 'b', 'c', 'd']);
    expect(api.calls, isEmpty);

    api.online = true;
    await queue.flush();
    expect(api.fns, ['follow', 'follow', 'follow', 'unfollow']);
    expect([for (final c in api.calls) c.args['p_client_id']], ['a', 'b', 'c', 'd']);
    expect(container.read(syncQueueProvider), isEmpty);
  });

  test('de-duplicated by p_client_id: a write queued twice is sent once', () async {
    api.online = false;
    await queue.submit(_follow('kestrel-park', 'a'));
    await queue.submit(_follow('kestrel-park', 'a'));
    await queue.submit(_follow('coral-towers', 'b'));
    await queue.submit(_follow('kestrel-park', 'a'));
    expect(container.read(syncQueueProvider).map((w) => w.clientId), ['a', 'b']);

    api.online = true;
    await Future.wait([queue.flush(), queue.flush()]); // resume and the timer at once
    expect([for (final c in api.calls) c.args['p_client_id']], ['a', 'b']);
  });

  test('a replay keeps its p_client_id, so the server can return the first result', () async {
    // The fixture world answers a replayed id with its first result, as the
    // server does; the queue resends the same id after a lost answer.
    final world = FixtureWorld(signedIn: true);
    final write = _follow('kestrel-park', 'same-id');
    await world.rpc(write.fn, write.args);
    await world.rpc(write.fn, write.args);
    expect(world.session.writes, hasLength(1));
  });

  test('a refusal drops that write, reports it and the rest still go', () async {
    api.online = false;
    await queue.submit(_follow('kestrel-park', 'a'));
    await queue.submit(_follow('indigo-terraces', 'b'));
    await queue.submit(_follow('coral-towers', 'c'));
    api.onCall = (fn, args) => args['p_slug'] == 'indigo-terraces'
        ? const ApiException(ApiErrorCode.notFound, status: 404, details: 'No such project.')
        : null;
    final reported = <SyncOutcome>[];
    final sub = queue.outcomes.listen(reported.add);
    addTearDown(sub.cancel);

    api.online = true;
    await queue.flush();
    await pumpEventQueue();
    expect(api.fns, ['follow', 'follow', 'follow']);
    expect(container.read(syncQueueProvider), isEmpty);
    expect(reported.map((o) => o.status), [SyncStatus.sent, SyncStatus.refused, SyncStatus.sent]);
    expect(reported[1].error?.code, ApiErrorCode.notFound);
  });

  test('a refused write is reported to its caller', () async {
    api.answers['alert_prefs_set'] = const ApiException(ApiErrorCode.consentRequired, status: 409);
    final outcome = await queue.send('alert_prefs_set', {
      'p_prefs': {
        'whatsapp': {'band_change': 'instant'},
      },
    });
    expect(outcome.status, SyncStatus.refused);
    expect(outcome.error?.code, ApiErrorCode.consentRequired);
    expect(outcome.write.clientId, 'client-1', reason: 'send() adds a p_client_id');
  });

  test('rate limited, a gateway error or an expired session keep the write for later', () async {
    for (final e in [
      const ApiException(ApiErrorCode.rateLimited, status: 429),
      const ApiException(ApiException.unexpected, status: 503),
      const ApiException(ApiErrorCode.authRequired, status: 401),
    ]) {
      api.onCall = (fn, args) => e;
      final outcome = await queue.submit(_follow('kestrel-park', 'a'));
      expect(outcome.status, SyncStatus.queued, reason: e.code);
      expect(container.read(syncQueueProvider), hasLength(1));
    }
    api.onCall = null;
    await queue.flush();
    expect(container.read(syncQueueProvider), isEmpty);
  });

  test('kept on the phone: a restart replays what was queued', () async {
    api.online = false;
    await queue.submit(_follow('kestrel-park', 'a'));
    await queue.submit(_follow('coral-towers', 'b'));
    final saved = jsonDecode((await store.read(SyncQueue.storeKey))!) as List;
    expect(saved.map((w) => (w as Map)['args']['p_client_id']), ['a', 'b']);

    container.dispose();
    api.online = true;
    final restarted = start();
    final again = restarted.read(syncQueueProvider.notifier);
    await again.flush();
    expect([for (final c in api.calls) c.args['p_client_id']], ['a', 'b']);
    expect(await store.read(SyncQueue.storeKey), isNull);
  });

  test('signed out, nothing is sent; signing in sends it; signing out forgets it', () async {
    auth.signedIn = false;
    await pumpEventQueue();
    expect((await queue.submit(_follow('kestrel-park', 'a'))).status, SyncStatus.queued);
    expect(api.calls, isEmpty);

    auth.signedIn = true;
    await pumpEventQueue();
    await queue.flush();
    expect(api.fns, ['follow']);

    api.online = false;
    await queue.submit(_follow('coral-towers', 'b'));
    auth.signedIn = false;
    await pumpEventQueue();
    expect(container.read(syncQueueProvider), isEmpty);
    expect(await store.read(SyncQueue.storeKey), isNull);
  });

  testWidgets('replays every 20 seconds while writes wait, and on resume', (tester) async {
    // Fake time: the queue's timer and the fake server's zero delays run on
    // tester.pump().
    Future<void> settle() async {
      // pump() alone only runs microtasks; a zero duration also fires the
      // fake server's zero-delay timers.
      for (var i = 0; i < 10; i++) {
        await tester.pump(Duration.zero);
      }
    }

    // The app is in the foreground before the queue starts, as on a phone
    // (a test binding starts with no lifecycle state; reaching `resumed`
    // would count as a resume).
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await settle();
    final c = liveContainer(api, auth: auth, store: store);
    final q = c.read(syncQueueProvider.notifier);
    api.online = false;
    unawaited(q.submit(_follow('kestrel-park', 'a')));
    await settle();
    expect(c.read(syncQueueProvider), hasLength(1));

    api.online = true;
    await tester.pump(const Duration(seconds: 19));
    await settle();
    expect(api.calls, isEmpty, reason: 'not before 20 s');
    await tester.pump(const Duration(seconds: 1));
    await settle();
    expect(api.fns, ['follow'], reason: 'the 20 s timer replayed it');
    expect(c.read(syncQueueProvider), isEmpty);

    // Back from the background: replayed at once, without waiting for the timer.
    api.online = false;
    unawaited(q.submit(_follow('coral-towers', 'b')));
    await settle();
    api.online = true;
    for (final state in [
      AppLifecycleState.inactive,
      AppLifecycleState.hidden,
      AppLifecycleState.paused,
      AppLifecycleState.hidden,
      AppLifecycleState.inactive,
      AppLifecycleState.resumed,
    ]) {
      tester.binding.handleAppLifecycleStateChanged(state);
    }
    await settle();
    expect(api.fns, ['follow', 'follow']);
    expect(c.read(syncQueueProvider), isEmpty);
    c.dispose(); // before the test ends: no timer may outlive it
  });
}
