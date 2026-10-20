import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../fixtures/fixture_mode.dart';
import 'api_client.dart';
import 'auth.dart';
import 'supabase_api.dart';

// The app's connection and session, after pet_app's lib/data/session.dart.
// The router (lib/app/router.dart) listens to [signedInProvider]; keep that
// name and meaning. FIXTURES mode swaps the Supabase pieces for the fixture
// world through `fixtureOverrides()` (fixture_providers.dart).

/// Thrown when a live-mode provider is read without Supabase: a FIXTURES
/// build must install `fixtureModeOverrides()`.
StateError missingSupabase(String what) => StateError(
  '$what needs Supabase, which is not initialised (FIXTURES mode). '
  'Install fixtureModeOverrides() on the ProviderContainer.',
);

/// The Supabase client, or null in FIXTURES mode (Supabase is not initialised).
final supabaseProvider = Provider<SupabaseClient?>((ref) => kFixtures ? null : Supabase.instance.client);

/// Calls `api.<fn>` RPCs: Supabase live, the fixture world in FIXTURES mode.
/// Repositories and the SyncQueue send everything through it.
final apiClientProvider = Provider<ApiClient>((ref) {
  final sb = ref.watch(supabaseProvider);
  if (sb == null) throw missingSupabase('apiClientProvider');
  return SupabaseApiClient(sb);
});

/// New `p_client_id` values (UUID v4) for idempotent writes (API_CONTRACTS §1).
final clientIdProvider = Provider<String Function()>((ref) => const Uuid().v4);

/// Sign-in changes, as "signed in now?".
final authChangesProvider = StreamProvider<bool>((ref) => ref.watch(authRepositoryProvider).changes);

/// Whether someone is signed in. Rebuilds when auth changes.
///
/// FIXTURES mode starts signed out; the fixture auth repository signs the
/// fixture buyer in with any 6-digit code.
final signedInProvider = Provider<bool>((ref) {
  ref.watch(authChangesProvider);
  return ref.watch(authRepositoryProvider).signedIn;
});
