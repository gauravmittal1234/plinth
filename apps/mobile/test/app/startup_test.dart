import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/startup.dart';
import 'package:plinth/core/push/push.dart';

void main() {
  test('guarded swallows a failing step and reports it', () async {
    expect(await guarded('broken', () async => throw StateError('no')), isFalse);
    expect(await guarded('fine', () async {}), isTrue);
  });

  test('the app opens without Firebase: crash reports and push fail quietly', () async {
    // No google-services.json and no platform plugins here, as in every
    // FIXTURES and CI build.
    expect(await guarded('crash reports', startCrashReports), isFalse);
    expect(await guarded('push', Push.init), isFalse);
  });
}
