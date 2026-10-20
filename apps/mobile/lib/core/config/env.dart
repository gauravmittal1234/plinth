/// Public client configuration, passed at build time:
///
///     flutter run --dart-define-from-file=.env.json      # apps/mobile/.env.json, gitignored
///     flutter run --dart-define=FIXTURES=true            # no accounts, no network
///
/// These values may ship inside the app: the publishable key only grants what
/// row-level security allows. Secret keys never reach the app (AGENTS.md §6).
///
/// Unlike pet_app's `Env`, nothing here has a default value. An empty
/// `SUPABASE_URL` means FIXTURES mode (see `lib/fixtures/fixture_mode.dart`).
abstract final class Env {
  /// The Supabase project URL. Empty = FIXTURES mode.
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');

  /// The Supabase publishable key (public by design).
  static const supabasePublishableKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

  /// Protomaps PMTiles base URL for MapLibre (T30). Empty = no basemap.
  static const tilesUrl = String.fromEnvironment('TILES_URL');

  /// True when both Supabase values are present.
  static bool get hasSupabase => supabaseUrl.isNotEmpty && supabasePublishableKey.isNotEmpty;
}
