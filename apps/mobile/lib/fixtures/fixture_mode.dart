import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:plinth_fixtures/plinth_fixtures.dart' show plinthFixedNow;

import '../core/clock.dart';
import '../core/config/env.dart';
import '../data/fixture_providers.dart';

/// FIXTURES mode (BUILD_PLAN §1 rule 1): every screen runs on the canonical
/// fixture world with no accounts and no network.
///
/// On with `--dart-define=FIXTURES=true`, and whenever `SUPABASE_URL` is empty,
/// so a build without values can never reach a backend by accident. Tests run
/// in FIXTURES mode too. As pet_app's `kDemoMode`, it swaps providers through
/// overrides on the root `ProviderContainer`; nothing else checks it.
const bool kFixtures = bool.fromEnvironment('FIXTURES') || Env.supabaseUrl == '';

/// The overrides FIXTURES mode installs: the frozen clock, then every
/// repository swapped for one that reads `packages/fixtures/expected` (T17's
/// [fixtureOverrides]).
List<Override> fixtureModeOverrides() => [clockProvider.overrideWithValue(() => plinthFixedNow), ...fixtureOverrides()];
