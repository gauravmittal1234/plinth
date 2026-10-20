import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/follow.dart';
import 'package:plinth/data/offline_cache.dart';
import 'package:plinth/data/project.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart';

import 'data_test_helpers.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final aurelia = contractExample('risk_summary', 'aurelia-heights-phase-2');

  group('FileOfflineCache', () {
    late Directory dir;
    late FileOfflineCache cache;

    setUp(() {
      dir = Directory.systemTemp.createTempSync('t17-offline-cache-');
      addTearDown(() => dir.existsSync() ? dir.deleteSync(recursive: true) : null);
      cache = FileOfflineCache(() async => dir, now: () => plinthFixedNow);
    });

    test('returns the last payload saved, with when and as of', () async {
      expect(await cache.get('risk_summary', 'aurelia-heights-phase-2'), isNull);
      await cache.put('risk_summary', 'aurelia-heights-phase-2', {'schema': 'old'}, asOf: '2026-10-01');
      await cache.put('risk_summary', 'aurelia-heights-phase-2', aurelia, asOf: '2026-10-14');

      final entry = await cache.get('risk_summary', 'aurelia-heights-phase-2');
      expect(entry!.payload, aurelia);
      expect(entry.asOf, '2026-10-14');
      expect(entry.savedAt, plinthFixedNow);
      expect(File('${dir.path}/risk_summary/aurelia-heights-phase-2.json').existsSync(), isTrue);
    });

    test('remove, clear, and an unreadable file reads as absent', () async {
      await cache.put('risk_summary', 'kestrel-park', aurelia);
      await cache.put('project_page', 'kestrel-park', aurelia);
      await cache.remove('risk_summary', 'kestrel-park');
      expect(await cache.contains('risk_summary', 'kestrel-park'), isFalse);
      expect(await cache.contains('project_page', 'kestrel-park'), isTrue);

      File('${dir.path}/project_page/kestrel-park.json').writeAsStringSync('{not json');
      expect(await cache.get('project_page', 'kestrel-park'), isNull);

      await cache.clear();
      expect(dir.existsSync(), isFalse);
      expect(await cache.get('project_page', 'kestrel-park'), isNull);
    });
  });

  group('readThrough', () {
    late MemoryOfflineCache cache;
    setUp(() => cache = MemoryOfflineCache(now: () => plinthFixedNow));

    Future<Cached<RiskSummary>> read({required bool online, bool keep = false}) => readThrough(
      cache,
      kind: 'risk_summary',
      id: 'aurelia-heights-phase-2',
      fetch: () async => online ? RiskSummary.fromJson(aurelia) : throw const OfflineException('test'),
      toJson: (v) => v.toJson(),
      fromJson: RiskSummary.fromJson,
      asOf: (v) => v.meta.dataAsOf,
      keep: keep,
    );

    test('online, a payload is saved only when kept (a followed project)', () async {
      expect((await read(online: true)).offline, isFalse);
      expect(cache.entries, isEmpty);
      await read(online: true, keep: true);
      expect(cache.entries.keys, ['risk_summary/aurelia-heights-phase-2']);
    });

    test('offline, the saved copy comes back with its date; with none, the error', () async {
      await expectLater(read(online: false), throwsA(isA<OfflineException>()));
      await read(online: true, keep: true);

      final saved = await read(online: false);
      expect(saved.offline, isTrue);
      expect(saved.value.phase.slug, 'aurelia-heights-phase-2');
      expect(saved.value.chip.label, 'Elevated');
      expect(saved.asOf, '2026-10-14');
      expect(saved.savedAt, plinthFixedNow);
    });

    test('a server error is never covered up by the saved copy', () async {
      await read(online: true, keep: true);
      await expectLater(
        readThrough(
          cache,
          kind: 'risk_summary',
          id: 'aurelia-heights-phase-2',
          fetch: () async => throw const ApiException(ApiErrorCode.notFound, status: 404),
          toJson: (RiskSummary v) => v.toJson(),
          fromJson: RiskSummary.fromJson,
        ),
        throwsA(isA<ApiException>()),
      );
    });
  });

  test('a followed project reads offline from the phone, as of 14 Oct 2026', () async {
    final api = FakeApiClient({
      'risk_summary': aurelia,
      'project_page': contractExample('project_page', 'aurelia-heights-phase-2'),
      'follow': contractExample('follow', 'aurelia-watching'),
    });
    final container = liveContainer(api);
    addTearDown(container.dispose);
    const phase = PhaseRef('aurelia-heights-phase-2');

    final follow = await container.read(followsProvider.notifier).follow('aurelia-heights-phase-2');
    expect(follow?.alertsLine, isNotEmpty);
    await pumpEventQueue();
    expect(container.read(followTypeProvider('aurelia-heights-phase-2')), FollowType.watching);

    api.online = false;
    final risk = await container.read(riskSummaryProvider(phase).future);
    expect(risk.offline, isTrue);
    expect(risk.asOf, '2026-10-14');
    expect(risk.value.chip.label, 'Elevated');
    final page = await container.read(projectPageProvider(phase).future);
    expect(page.offline, isTrue);

    // Not followed: no saved copy, so the screen gets the offline error.
    await expectLater(
      container.read(riskSummaryProvider(const PhaseRef('kestrel-park')).future),
      throwsA(isA<OfflineException>()),
    );

    // Unfollowing (queued while offline) drops the saved copy at once.
    await container.read(followsProvider.notifier).unfollow('aurelia-heights-phase-2');
    await pumpEventQueue();
    container.invalidate(riskSummaryProvider(phase));
    await expectLater(container.read(riskSummaryProvider(phase).future), throwsA(isA<OfflineException>()));
  });
}
