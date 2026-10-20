import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart' show WidgetsFlutterBinding;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../app/router.dart';
import '../../data/auth.dart';
import '../../data/session.dart';

// Owned by T48 (push). After pet_app's lib/features/reminders/push.dart.
//
// Messages are data-only: no `notification` block, just `data.deep_link`
// (API_CONTRACTS; WORK_BREAKDOWN T48). There is nothing else to interpret —
// unlike pet_app's walker_alert, Plinth's push never shows its own banner
// while the app is foregrounded; it only moves the router when a message is
// opened (a tap from the tray, or a cold start into one) or arrives while
// the app is already open.
//
// main.dart (T06) calls this with no arguments (`guarded('push', Push.init)`)
// and never in FIXTURES mode, so it stays a zero-arg-compatible tear-off:
// [container] is optional. Without it push still starts (so a later main.dart
// change is additive, not breaking), it just can't register this device or
// act on a message yet. See this PR's Handoff note.
abstract final class Push {
  static bool _ready = false;

  /// Prepares push. Throws when Firebase is not configured (no
  /// `google-services.json`, as in every FIXTURES and CI build); main.dart
  /// guards it so the app always opens.
  static Future<void> init({ProviderContainer? container}) async {
    if (Firebase.apps.isEmpty) await Firebase.initializeApp();
    if (_ready) return;
    _ready = true;
    FirebaseMessaging.onBackgroundMessage(pushInBackground);
    if (container == null) return;

    FirebaseMessaging.onMessage.listen((m) => _open(container, m));
    FirebaseMessaging.onMessageOpenedApp.listen((m) => _open(container, m));
    final opened = await FirebaseMessaging.instance.getInitialMessage();
    if (opened != null) _open(container, opened);

    // Registers (and keeps registering) this phone once someone is signed
    // in; a sign-out leaves the old token for the server to drop in its own
    // time (R1 has no explicit unregister call, API_CONTRACTS §3.2).
    container.listen(signedInProvider, (_, signedIn) {
      if (signedIn) unawaited(_register(container));
    }, fireImmediately: true);
  }

  /// `m.data.deep_link`, or null when the message carries none.
  @visibleForTesting
  static String? deepLinkOf(RemoteMessage m) {
    final link = m.data['deep_link'];
    return link is String && link.isNotEmpty ? link : null;
  }

  /// Moves [router] to [m]'s deep link. Exposed so a test can drive the real
  /// production routing logic with a plain `RemoteMessage(data: {...})`,
  /// with no Firebase plugin involved.
  @visibleForTesting
  static bool openDeepLink(GoRouter router, RemoteMessage m) {
    final link = deepLinkOf(m);
    if (link == null) return false;
    router.go(link);
    return true;
  }

  static void _open(ProviderContainer container, RemoteMessage m) => openDeepLink(container.read(routerProvider), m);

  static Future<void> _register(ProviderContainer container) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      var version = 'unknown';
      try {
        final info = await PackageInfo.fromPlatform();
        version = '${info.version}+${info.buildNumber}';
      } catch (_) {
        // Keeps the fallback; registering the device still matters more
        // than knowing exactly which build it's on.
      }
      await container
          .read(authRepositoryProvider)
          .registerDevice(token: token, platform: 'android', appVersion: version);
    } catch (e) {
      debugPrint('device_register failed: $e');
    }
  }
}

/// The background isolate Android starts for a message while the app isn't
/// running. There is nothing to act on here: a data-only message has no tray
/// entry to tap yet, so routing happens when it is opened
/// ([FirebaseMessaging.onMessageOpenedApp]) or the app cold-starts into it
/// ([FirebaseMessaging.getInitialMessage]), both in [Push.init].
@pragma('vm:entry-point')
Future<void> pushInBackground(RemoteMessage m) async {
  WidgetsFlutterBinding.ensureInitialized();
  if (Firebase.apps.isEmpty) await Firebase.initializeApp();
}
