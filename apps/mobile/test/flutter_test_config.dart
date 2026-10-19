import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

/// Runs before every test file in this folder tree (flutter_test convention).
///
/// - Loads every font the app bundles (`FontManifest.json`: the Material icon
///   font today; Bricolage Grotesque, Mukta and Noto Sans once they are added
///   to pubspec.yaml), so goldens show real glyphs. Families that are not
///   bundled fall back to the test font, whose glyphs are boxes.
/// - Goldens (tag `golden`, dart_test.yaml) are rendered and compared on Linux
///   only, as in CI (ci-mobile): a Mac anti-aliases glyph edges differently
///   (about 3% of the pixels of a text-heavy screen). On other systems the
///   golden tests still build and pump their screens, but skip the pixel
///   comparison and refuse `--update-goldens`.
///
///       flutter test --tags golden                     # compare (Linux)
///       flutter test --tags golden --update-goldens    # re-render (Linux)
///
///   Without Linux, run ci-mobile by hand with "update goldens" ticked and
///   commit the PNGs from its `goldens-linux` artifact.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  await loadBundledFonts();
  final comparator = goldenFileComparator;
  if (comparator is LocalFileComparator) {
    goldenFileComparator = LinuxGoldenComparator(
      Uri.parse('${comparator.basedir}flutter_test_config.dart'),
      tolerance: goldenTolerance,
      onLinux: Platform.isLinux,
    );
  }
  await testMain();
}

/// Share of pixels a golden may differ by (0.1%) before it fails on Linux.
const goldenTolerance = 0.001;

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

/// A [LocalFileComparator] for Linux-rendered goldens: it passes when at most
/// [tolerance] of the pixels differ, and does nothing off Linux.
class LinuxGoldenComparator extends LocalFileComparator {
  LinuxGoldenComparator(super.testFile, {required this.tolerance, required this.onLinux});

  final double tolerance;
  final bool onLinux;

  static bool _noted = false;

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    if (!onLinux) {
      if (!_noted) {
        _noted = true;
        debugPrint('Golden pixels are compared on Linux only (ci-mobile); skipped here.');
      }
      return true;
    }
    final result = await GoldenFileComparator.compareLists(imageBytes, await getGoldenBytes(golden));
    if (result.passed || result.diffPercent <= tolerance) {
      result.dispose();
      return true;
    }
    final error = await generateFailureOutput(result, golden, basedir);
    result.dispose();
    throw FlutterError(error);
  }

  @override
  Future<void> update(Uri golden, Uint8List imageBytes) async {
    if (!onLinux) {
      throw FlutterError(
        'Goldens are rendered on Linux only. Run ci-mobile with "update goldens" and commit its goldens-linux artifact.',
      );
    }
    await super.update(golden, imageBytes);
  }
}
