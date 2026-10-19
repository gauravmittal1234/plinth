import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

import 'flutter_test_config.dart';

void main() {
  final testFile = Uri.parse('file:///tmp/plinth/test/x_test.dart');
  final golden = Uri.parse('goldens/x.png');
  final bytes = Uint8List(4);

  test('off Linux, goldens are not compared and cannot be re-rendered', () async {
    final comparator = LinuxGoldenComparator(testFile, tolerance: goldenTolerance, onLinux: false);
    expect(await comparator.compare(bytes, golden), isTrue);
    expect(() => comparator.update(golden, bytes), throwsA(isA<FlutterError>()));
  });

  test('the Linux tolerance stays small', () {
    expect(goldenTolerance, lessThanOrEqualTo(0.001));
  });
}
