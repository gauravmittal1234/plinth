import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

/// Runs before every test file in this folder tree (flutter_test convention).
///
/// - Loads every font the app bundles (`FontManifest.json`: the Material icon
///   font today; Bricolage Grotesque, Mukta and Noto Sans once they are added
///   to pubspec.yaml), so goldens show real glyphs. Families that are not
///   bundled fall back to the test font, whose glyphs are boxes.
/// - Compares goldens with a small tolerance. Goldens are rendered on Linux in
///   CI (ci-mobile); a Mac renders anti-aliased edges a few pixels differently.
///   Golden tests carry the `golden` tag (dart_test.yaml):
///
///       flutter test --tags golden                    # only goldens
///       flutter test --tags golden --update-goldens   # re-render them
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  await loadBundledFonts();
  final comparator = goldenFileComparator;
  if (comparator is LocalFileComparator) {
    goldenFileComparator = TolerantGoldenComparator(
      Uri.parse('${comparator.basedir}flutter_test_config.dart'),
      tolerance: goldenTolerance,
    );
  }
  await testMain();
}

/// Share of pixels a golden may differ by (0.5%) before it fails.
const goldenTolerance = 0.005;

/// Registers every font family in the bundle's `FontManifest.json`.
Future<void> loadBundledFonts() async {
  final List<dynamic> manifest;
  try {
    manifest = jsonDecode(await rootBundle.loadString('FontManifest.json')) as List<dynamic>;
  } on FlutterError {
    return; // no fonts bundled
  }
  for (final family in manifest.cast<Map<String, dynamic>>()) {
    final loader = FontLoader(family['family'] as String);
    for (final font in (family['fonts'] as List<dynamic>).cast<Map<String, dynamic>>()) {
      loader.addFont(rootBundle.load(font['asset'] as String));
    }
    await loader.load();
  }
}

/// A [LocalFileComparator] that passes when at most [tolerance] of the pixels
/// differ.
class TolerantGoldenComparator extends LocalFileComparator {
  TolerantGoldenComparator(super.testFile, {required this.tolerance});

  final double tolerance;

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    final result = await GoldenFileComparator.compareLists(imageBytes, await getGoldenBytes(golden));
    if (result.passed || result.diffPercent <= tolerance) {
      result.dispose();
      return true;
    }
    final error = await generateFailureOutput(result, golden, basedir);
    result.dispose();
    throw FlutterError(error);
  }
}
