import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth_fixtures/plinth_fixtures.dart';

/// Serves `packages/plinth_fixtures/assets/...` keys from this package's own files.
class _FileBundle extends CachingAssetBundle {
  @override
  Future<ByteData> load(String key) async {
    const String prefix = 'packages/plinth_fixtures/';
    final String path = key.startsWith(prefix) ? key.substring(prefix.length) : key;
    final List<int> bytes = await File(path).readAsBytes();
    return ByteData.sublistView(Uint8List.fromList(bytes));
  }
}

void main() {
  test('every indexed fixture key has a JSON asset that parses', () {
    expect(plinthExpectedKeys['risk_summary'], hasLength(greaterThanOrEqualTo(8)));
    plinthExpectedKeys.forEach((String function, List<String> keys) {
      for (final String key in keys) {
        final File file = File('assets/expected/$function/$key.json');
        expect(file.existsSync(), isTrue, reason: file.path);
        expect(jsonDecode(file.readAsStringSync()), isA<Map<String, dynamic>>());
      }
    });
    for (final String name in plinthVectorNames) {
      expect(File('assets/vectors/$name.json').existsSync(), isTrue, reason: name);
    }
  });

  test('loads the Aurelia risk summary through the asset bundle', () async {
    final Map<String, dynamic> risk = await loadPlinthExpected(
      'risk_summary',
      'aurelia-heights-phase-2',
      bundle: _FileBundle(),
    );
    expect(risk['schema'], 'plinth.risk_summary/1');
    expect((risk['chip'] as Map<String, dynamic>)['label'], 'Elevated');
    expect((risk['late12'] as Map<String, dynamic>)['late_after'], '2029-04');
  });

  test('the formatting vector pins ₹2.74 Cr', () async {
    final Map<String, dynamic> v = await loadPlinthVector('formatting', bundle: _FileBundle());
    final List<dynamic> inr = v['inr'] as List<dynamic>;
    final Map<String, dynamic> allIn = inr.cast<Map<String, dynamic>>().firstWhere(
          (Map<String, dynamic> x) => x['inr'] == 27400400,
        );
    expect(allIn['short'], '₹2.74 Cr');
    expect(plinthFixedNow.toUtc(), DateTime.utc(2026, 10, 18, 6, 30));
  });
}
