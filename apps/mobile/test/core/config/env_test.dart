import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/core/config/env.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

void main() {
  test('tests build without values, so they run in FIXTURES mode', () {
    expect(Env.supabaseUrl, isEmpty);
    expect(Env.supabasePublishableKey, isEmpty);
    expect(Env.hasSupabase, isFalse);
    expect(kFixtures, isTrue);
  });

  test('no hard-coded defaults: an empty URL means FIXTURES mode', () {
    final source = File('lib/core/config/env.dart').readAsStringSync();
    expect(source, isNot(contains('defaultValue')));
    expect(source, isNot(contains('supabase.co')));
  });
}
