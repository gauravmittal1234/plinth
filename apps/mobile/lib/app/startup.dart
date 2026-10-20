import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';

/// Runs one optional start-up step. A failure is logged and swallowed: push
/// and crash reports must never stop the app from opening (pet_app's rule).
/// Returns whether the step finished.
Future<bool> guarded(String what, Future<void> Function() step) async {
  try {
    await step();
    return true;
  } catch (e) {
    debugPrint('$what unavailable: $e');
    return false;
  }
}

/// Firebase and crash reports, as in pet_app's `Push.init`. Collection is on
/// in release builds only, so testing noise stays out.
///
/// Throws when Firebase is not configured (no `google-services.json`, as in
/// every FIXTURES and CI build); call it through [guarded].
Future<void> startCrashReports() async {
  await Firebase.initializeApp();
  await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(kReleaseMode);
  if (!kReleaseMode) return;
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
  PlatformDispatcher.instance.onError = (error, stack) {
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };
}
