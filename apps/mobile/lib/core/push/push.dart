import 'package:firebase_core/firebase_core.dart';

// Owned by T48 (push). Stub from T06, after pet_app's
// lib/features/reminders/push.dart.
//
// T48 adds: FirebaseMessaging handlers for data-only messages carrying a
// `deep_link` (opened with the router), token registration via
// `api.device_register` once signed in, and its tests. main.dart already calls
// [Push.init] through `guarded`, after crash reports have started Firebase.

/// Push notifications from the server.
abstract final class Push {
  /// Prepares push. Throws when Firebase is not configured; main.dart guards it.
  static Future<void> init() async {
    if (Firebase.apps.isEmpty) await Firebase.initializeApp();
  }
}
