/// Plinth fixtures for the app's FIXTURES mode.
///
/// The JSON under `assets/` is a copy of `packages/fixtures/expected` and
/// `packages/fixtures/vectors`, made by `packages/fixtures/scripts/sync-dart.mjs`.
/// Repositories in FIXTURES mode (T17) read these files and nothing else.
library;

import 'dart:convert';

import 'package:flutter/services.dart';

export 'src/fixture_index.dart';

/// The frozen fixture clock: 18 Oct 2026, 12:00 IST.
final DateTime plinthFixedNow = DateTime.parse('2026-10-18T12:00:00+05:30');

/// Asset key of an expected API payload, as seen from an app that depends on this package.
String plinthExpectedAsset(String function, String key) =>
    'packages/plinth_fixtures/assets/expected/$function/$key.json';

/// Asset key of a golden vector file.
String plinthVectorAsset(String name) => 'packages/plinth_fixtures/assets/vectors/$name.json';

/// Loads one expected payload, for example `loadPlinthExpected('risk_summary', 'kestrel-park')`.
Future<Map<String, dynamic>> loadPlinthExpected(
  String function,
  String key, {
  AssetBundle? bundle,
}) async {
  final String raw = await (bundle ?? rootBundle).loadString(plinthExpectedAsset(function, key));
  return jsonDecode(raw) as Map<String, dynamic>;
}

/// Loads one golden vector file, for example `loadPlinthVector('formatting')`.
Future<Map<String, dynamic>> loadPlinthVector(String name, {AssetBundle? bundle}) async {
  final String raw = await (bundle ?? rootBundle).loadString(plinthVectorAsset(name));
  return jsonDecode(raw) as Map<String, dynamic>;
}
