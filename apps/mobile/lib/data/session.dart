import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../fixtures/fixture_mode.dart';

// Owned by T17 (Auth repository), then T48 (sign-in). Stub from T06, after
// pet_app's lib/data/session.dart. The router (lib/app/router.dart) listens to
// [signedInProvider]; keep that name and meaning.

/// The Supabase client, or null in FIXTURES mode (Supabase is not initialised).
final supabaseProvider = Provider<SupabaseClient?>((ref) => kFixtures ? null : Supabase.instance.client);

/// Auth changes. Never emits in FIXTURES mode.
final authChangesProvider = StreamProvider<AuthState>((ref) {
  final sb = ref.watch(supabaseProvider);
  return sb == null ? const Stream<AuthState>.empty() : sb.auth.onAuthStateChange;
});

/// Whether someone is signed in. Rebuilds when auth changes.
///
/// FIXTURES mode starts signed out; T17's fixture session may override it.
final signedInProvider = Provider<bool>((ref) {
  ref.watch(authChangesProvider);
  return ref.watch(supabaseProvider)?.auth.currentUser != null;
});
