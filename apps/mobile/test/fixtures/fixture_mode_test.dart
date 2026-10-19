import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/clock.dart';
import 'package:plinth/data/session.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

void main() {
  test('FIXTURES mode freezes the clock at 18 Oct 2026, 12:00 IST', () {
    final container = ProviderContainer(overrides: fixtureModeOverrides());
    addTearDown(container.dispose);
    final now = container.read(clockProvider)();
    expect(now.toUtc(), DateTime.utc(2026, 10, 18, 6, 30));
  });

  test('FIXTURES mode has no Supabase client and starts signed out', () {
    final container = ProviderContainer(overrides: fixtureModeOverrides());
    addTearDown(container.dispose);
    expect(container.read(supabaseProvider), isNull);
    expect(container.read(signedInProvider), isFalse);
  });
}
