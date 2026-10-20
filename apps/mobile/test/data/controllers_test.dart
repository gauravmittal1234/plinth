import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/alerts.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/family.dart';
import 'package:plinth/data/fixture_world.dart';
import 'package:plinth/data/follow.dart';
import 'package:plinth/data/sync_queue.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'data_test_helpers.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('FollowsController', () {
    test('FIXTURES mode: a follow shows at once and reaches the fixture world', () async {
      final container = fixturesContainer(signedIn: true);
      addTearDown(container.dispose);
      final follows = container.read(followsProvider.notifier);

      await follows.follow('kestrel-park');
      expect(container.read(followTypeProvider('kestrel-park')), FollowType.watching);
      await follows.setType('kestrel-park', FollowType.booked);
      expect(container.read(followTypeProvider('kestrel-park')), FollowType.booked);
      await follows.unfollow('kestrel-park');
      expect(container.read(followTypeProvider('kestrel-park')), isNull);

      final world = container.read(fixtureWorldProvider);
      expect(world.session.writes.map((w) => w.fn), ['follow', 'set_follow_type', 'unfollow']);
      expect(world.session.writes.first.args['p_source'], FollowSource.app);
      expect(world.session.writes.map((w) => w.args['p_client_id']).toSet(), hasLength(3));
      expect(container.read(syncQueueProvider), isEmpty);
    });

    test('offline: shown at once, queued, and sent when back online', () async {
      final api = FakeApiClient({'follow': contractExample('follow', 'aurelia-watching')})..online = false;
      final container = liveContainer(api);
      addTearDown(container.dispose);

      final answer = await container.read(followsProvider.notifier).follow('aurelia-heights-phase-2');
      expect(answer, isNull, reason: 'queued, no answer yet');
      expect(container.read(followTypeProvider('aurelia-heights-phase-2')), FollowType.watching);
      expect(container.read(syncQueueProvider).single.fn, 'follow');

      api.online = true;
      await container.read(syncQueueProvider.notifier).flush();
      expect(api.fns, contains('follow'));
      expect(container.read(syncQueueProvider), isEmpty);
    });

    test('refused: the follow is undone and the error reaches the screen', () async {
      final api = FakeApiClient({
        'follow': const ApiException(ApiErrorCode.notFound, status: 404, details: 'No such project.'),
      });
      final container = liveContainer(api);
      addTearDown(container.dispose);

      await expectLater(
        container.read(followsProvider.notifier).follow('indigo-terraces'),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.notFound)),
      );
      expect(container.read(followTypeProvider('indigo-terraces')), isNull);
    });

    test('the feed is the server list, with queued changes on top', () async {
      final feed = FollowingFeed.fromJson(contractExample('following_feed', 'rohan-since-14-oct'));
      final api = FakeApiClient()..online = false;
      final container = liveContainer(api);
      addTearDown(container.dispose);
      final follows = container.read(followsProvider.notifier);
      await follows.follow('kestrel-park');

      follows.syncFrom(feed);
      expect(container.read(followsProvider), {
        for (final p in feed.projects) p.slug: p.followType,
        'kestrel-park': FollowType.watching,
      });
    });
  });

  group('AlertPrefsController', () {
    final whatsappOn = AlertPrefsMap(whatsapp: ChannelPrefs(bandChange: Cadence.instant));

    test('a saved change is the server answer', () async {
      final prefs = contractExample('alert_prefs', 'rohan');
      final container = liveContainer(FakeApiClient({'alert_prefs_get': prefs, 'alert_prefs_set': prefs}));
      addTearDown(container.dispose);
      await container.read(alertPrefsProvider.future);
      final saved = await container.read(alertPrefsProvider.notifier).save(whatsappOn);
      expect(saved?.whatsappOptin, isTrue);
      expect(saved?.prefs.whatsapp?.digest, Cadence.weeklySun9am);
    });

    test('WhatsApp without an opt-in is refused: the old prefs come back', () async {
      final prefs = contractExample('alert_prefs', 'rohan');
      final api = FakeApiClient({
        'alert_prefs_get': prefs,
        'alert_prefs_set': const ApiException(ApiErrorCode.consentRequired, status: 409),
      });
      final container = liveContainer(api);
      addTearDown(container.dispose);
      final before = await container.read(alertPrefsProvider.future);

      await expectLater(
        container.read(alertPrefsProvider.notifier).save(whatsappOn),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.consentRequired)),
      );
      expect(container.read(alertPrefsProvider).value, same(before));
    });

    test('offline: the change shows at once and waits in the queue', () async {
      final api = FakeApiClient({'alert_prefs_get': contractExample('alert_prefs', 'rohan')});
      final container = liveContainer(api);
      addTearDown(container.dispose);
      await container.read(alertPrefsProvider.future);
      api.online = false;

      final shown = await container.read(alertPrefsProvider.notifier).save(whatsappOn);
      expect(shown?.prefs.whatsapp?.digest, isNull);
      expect(container.read(syncQueueProvider).single.args['p_prefs'], {
        'whatsapp': {'band_change': 'instant'},
      });
    });

    test('signed out there are no preferences', () async {
      final container = fixturesContainer();
      addTearDown(container.dispose);
      expect(await container.read(alertPrefsProvider.future), isNull);
    });
  });

  test('a shortlist note goes through the queue', () async {
    final api = FakeApiClient()..online = false;
    final container = liveContainer(api);
    addTearDown(container.dispose);
    final outcome = await container.read(shortlistNotesProvider).add('kestrel-park', 'Ask about parking');
    expect(outcome.status, SyncStatus.queued);
    expect(container.read(syncQueueProvider).single.args, {
      'p_slug': 'kestrel-park',
      'p_text': 'Ask about parking',
      'p_client_id': 'client-1',
    });
  });
}
