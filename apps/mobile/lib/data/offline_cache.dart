import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../core/clock.dart';
import 'api_client.dart';

// The offline copy of followed projects (BUILD_PLAN §5.3: "R1 caches API
// payloads as JSON files", not drift). Following a project saves its
// risk_summary and project_page here; every later read refreshes the saved
// copy; with no connection the screen gets the saved copy and its "as of"
// date (DESIGN §5b: "Saved on this phone: … as of 14 Oct 2026").

/// One saved payload.
@immutable
class CacheEntry {
  const CacheEntry({required this.payload, required this.savedAt, this.asOf});

  factory CacheEntry.fromJson(JsonMap json) => CacheEntry(
    payload: Map<String, dynamic>.from(json['payload'] as Map),
    savedAt: DateTime.parse(json['saved_at'] as String),
    asOf: json['as_of'] as String?,
  );

  /// The API payload as the server sent it.
  final JsonMap payload;

  /// When this phone saved it.
  final DateTime savedAt;

  /// The payload's data date (`meta.data_as_of`, `YYYY-MM-DD`), when it has one.
  final String? asOf;

  JsonMap toJson() => {'saved_at': savedAt.toIso8601String(), 'as_of': asOf, 'payload': payload};
}

/// A value and where it came from.
@immutable
class Cached<T> {
  const Cached(this.value, {this.offline = false, this.savedAt, this.asOf});

  final T value;

  /// True when the server could not be reached and [value] is the copy saved
  /// on this phone. Screens then show an "as of" line.
  final bool offline;

  /// When the saved copy was made (offline only).
  final DateTime? savedAt;

  /// The saved copy's data date, `YYYY-MM-DD` (offline only). Format it for
  /// the "as of" line; fall back to [savedAt] when it is null.
  final String? asOf;
}

/// Payloads saved on the phone, by kind (the `api` function) and key.
abstract interface class OfflineCache {
  Future<CacheEntry?> get(String kind, String key);

  Future<bool> contains(String kind, String key);

  Future<void> put(String kind, String key, JsonMap payload, {String? asOf});

  Future<void> remove(String kind, String key);

  /// Removes everything (sign-out: the follow list is personal).
  Future<void> clear();
}

/// JSON files under the app's support directory: `<root>/<kind>/<key>.json`.
class FileOfflineCache implements OfflineCache {
  FileOfflineCache(this._root, {required this._now});

  final Future<Directory> Function() _root;
  final DateTime Function() _now;

  /// The default location: `<application support>/offline_cache`.
  static Future<Directory> defaultRoot() async =>
      Directory('${(await getApplicationSupportDirectory()).path}${Platform.pathSeparator}offline_cache');

  Future<File> _file(String kind, String key) async {
    final root = await _root();
    return File([root.path, _safe(kind), '${_safe(key)}.json'].join(Platform.pathSeparator));
  }

  /// Keys are slugs and fixed names; anything else becomes `_`.
  static String _safe(String s) => s.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');

  @override
  Future<CacheEntry?> get(String kind, String key) async {
    try {
      final file = await _file(kind, key);
      if (!await file.exists()) return null;
      return CacheEntry.fromJson(jsonDecode(await file.readAsString()) as JsonMap);
    } catch (_) {
      return null; // unreadable: as good as absent
    }
  }

  @override
  Future<bool> contains(String kind, String key) async {
    try {
      return await (await _file(kind, key)).exists();
    } catch (_) {
      return false;
    }
  }

  @override
  Future<void> put(String kind, String key, JsonMap payload, {String? asOf}) async {
    try {
      final file = await _file(kind, key);
      await file.parent.create(recursive: true);
      // Write then rename, so a crash never leaves half a file.
      final tmp = File('${file.path}.tmp');
      await tmp.writeAsString(jsonEncode(CacheEntry(payload: payload, savedAt: _now(), asOf: asOf).toJson()));
      await tmp.rename(file.path);
    } catch (_) {}
  }

  @override
  Future<void> remove(String kind, String key) async {
    try {
      final file = await _file(kind, key);
      if (await file.exists()) await file.delete();
    } catch (_) {}
  }

  @override
  Future<void> clear() async {
    try {
      final root = await _root();
      if (await root.exists()) await root.delete(recursive: true);
    } catch (_) {}
  }
}

/// In memory, for FIXTURES mode and tests.
class MemoryOfflineCache implements OfflineCache {
  MemoryOfflineCache({required this._now});

  final DateTime Function() _now;
  final Map<String, CacheEntry> entries = {};

  static String _id(String kind, String key) => '$kind/$key';

  @override
  Future<CacheEntry?> get(String kind, String key) async => entries[_id(kind, key)];

  @override
  Future<bool> contains(String kind, String key) async => entries.containsKey(_id(kind, key));

  @override
  Future<void> put(String kind, String key, JsonMap payload, {String? asOf}) async {
    // A deep copy, as a file would hold.
    final copy = jsonDecode(jsonEncode(payload)) as JsonMap;
    entries[_id(kind, key)] = CacheEntry(payload: copy, savedAt: _now(), asOf: asOf);
  }

  @override
  Future<void> remove(String kind, String key) async => entries.remove(_id(kind, key));

  @override
  Future<void> clear() async => entries.clear();
}

final offlineCacheProvider = Provider<OfflineCache>(
  (ref) => FileOfflineCache(FileOfflineCache.defaultRoot, now: ref.watch(clockProvider)),
);

/// Reads through the offline cache.
///
/// Online: returns [fetch]'s value and, when this payload is already saved
/// ([keep], or a followed project's copy), refreshes the saved copy. Offline:
/// returns the saved copy with [Cached.offline] set, or rethrows when there is
/// none.
Future<Cached<T>> readThrough<T>(
  OfflineCache cache, {
  required String kind,
  required String id,
  required Future<T> Function() fetch,
  required JsonMap Function(T value) toJson,
  required T Function(JsonMap json) fromJson,
  String? Function(T value)? asOf,
  bool keep = false,
}) async {
  try {
    final value = await fetch();
    if (keep || await cache.contains(kind, id)) {
      await cache.put(kind, id, toJson(value), asOf: asOf?.call(value));
    }
    return Cached(value);
  } on OfflineException {
    final saved = await cache.get(kind, id);
    if (saved == null) rethrow;
    return Cached(fromJson(saved.payload), offline: true, savedAt: saved.savedAt, asOf: saved.asOf);
  }
}
