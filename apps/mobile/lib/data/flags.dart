import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// Feature flags (BUILD_PLAN §10): `api.flags()` returns the caller's
// audience's flags. An absent key reads as false. Band fields are already
// nulled server-side when `bands_public` is off, so a screen never needs that
// flag to hide a band: the chip arrives as `kind: "withheld"`.

abstract interface class FlagsRepository {
  /// `api.flags()`.
  Future<Flags> flags();
}

class SupabaseFlagsRepository implements FlagsRepository {
  SupabaseFlagsRepository(this._api);

  final ApiClient _api;

  @override
  Future<Flags> flags() async => Flags.fromJson(await _api.rpcMap('flags'));
}

/// The fixture world's flags (`expected/flags/anon`: bands public, AI off).
class FixtureFlagsRepository implements FlagsRepository {
  FixtureFlagsRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<Flags> flags() async => Flags.fromJson(await _world.read('flags'));
}

final flagsRepositoryProvider = Provider<FlagsRepository>(
  (ref) => SupabaseFlagsRepository(ref.watch(apiClientProvider)),
);

/// The flags for this session's audience.
final flagsProvider = FutureProvider<Flags>((ref) => ref.watch(flagsRepositoryProvider).flags(), retry: noRetry);

/// One flag by key ([FlagKeys]). False while loading, on error and when absent.
final flagProvider = Provider.family<bool, String>((ref, key) => ref.watch(flagsProvider).value?.flags[key] ?? false);
