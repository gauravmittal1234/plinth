import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app/app.dart';
import 'app/startup.dart';
import 'core/config/env.dart';
import 'core/push/push.dart';
import 'fixtures/fixture_mode.dart';

/// Entry point, after pet_app's `main.dart`.
///
///     flutter run --dart-define=FIXTURES=true                 # fixture world, no network
///     flutter run --dart-define-from-file=.env.json           # plinth-dev (values stay local)
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Draw behind the status and navigation bars (DESIGN §4.16: edge to edge,
  // never a fake status bar).
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  // Supabase only when its URL is set; otherwise FIXTURES mode.
  if (!kFixtures) {
    await Supabase.initialize(url: Env.supabaseUrl, publishableKey: Env.supabasePublishableKey);
  }
  final container = ProviderContainer(overrides: kFixtures ? fixtureModeOverrides() : const []);

  // Crash reports and push are optional: the app opens without Firebase.
  if (!kFixtures) {
    await guarded('crash reports', startCrashReports);
    await guarded('push', Push.init);
  }

  runApp(UncontrolledProviderScope(container: container, child: const PlinthApp()));
}
