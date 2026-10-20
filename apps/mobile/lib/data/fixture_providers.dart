import 'package:flutter_riverpod/misc.dart' show Override;

import '../core/clock.dart';
import 'alerts.dart';
import 'auth.dart';
import 'compare.dart';
import 'developer.dart';
import 'evidence.dart';
import 'family.dart';
import 'fixture_world.dart';
import 'flags.dart';
import 'follow.dart';
import 'local_store.dart';
import 'offline_cache.dart';
import 'privacy.dart';
import 'project.dart';
import 'search.dart';
import 'session.dart';
import 'trust.dart';

/// Repository overrides for FIXTURES mode (`lib/fixtures/fixture_mode.dart`
/// installs them after the frozen clock), after pet_app's `demoOverrides()`.
///
/// Every repository reads the fixture world ([FixtureWorld]:
/// packages/fixtures/expected, writes held in memory). The SyncQueue replays
/// through the same world, and the phone's stores are in memory, so nothing
/// outlives the session and nothing touches the network.
///
/// [signedIn] starts with the fixture buyer signed in, for tests of signed-in
/// screens (Following, You); the app starts signed out.
List<Override> fixtureOverrides({bool signedIn = false}) => [
  fixtureWorldProvider.overrideWith((ref) {
    final world = FixtureWorld(now: ref.watch(clockProvider), signedIn: signedIn);
    ref.onDispose(world.dispose);
    return world;
  }),
  apiClientProvider.overrideWith((ref) => ref.watch(fixtureWorldProvider)),
  authRepositoryProvider.overrideWith((ref) => FixtureAuthRepository(ref.watch(fixtureWorldProvider))),
  projectRepositoryProvider.overrideWith((ref) => FixtureProjectRepository(ref.watch(fixtureWorldProvider))),
  searchRepositoryProvider.overrideWith((ref) => FixtureSearchRepository(ref.watch(fixtureWorldProvider))),
  developerRepositoryProvider.overrideWith((ref) => FixtureDeveloperRepository(ref.watch(fixtureWorldProvider))),
  compareRepositoryProvider.overrideWith((ref) => FixtureCompareRepository(ref.watch(fixtureWorldProvider))),
  evidenceRepositoryProvider.overrideWith((ref) => FixtureEvidenceRepository(ref.watch(fixtureWorldProvider))),
  flagsRepositoryProvider.overrideWith((ref) => FixtureFlagsRepository(ref.watch(fixtureWorldProvider))),
  trustRepositoryProvider.overrideWith((ref) => FixtureTrustRepository(ref.watch(fixtureWorldProvider))),
  followRepositoryProvider.overrideWith((ref) => FixtureFollowRepository(ref.watch(fixtureWorldProvider))),
  alertsRepositoryProvider.overrideWith((ref) => FixtureAlertsRepository(ref.watch(fixtureWorldProvider))),
  familyRepositoryProvider.overrideWith((ref) => FixtureFamilyRepository(ref.watch(fixtureWorldProvider))),
  privacyRepositoryProvider.overrideWith((ref) => FixturePrivacyRepository(ref.watch(fixtureWorldProvider))),
  localStoreProvider.overrideWith((ref) => MemoryLocalStore()),
  offlineCacheProvider.overrideWith((ref) => MemoryOfflineCache(now: ref.watch(clockProvider))),
];
