import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Small values kept on the phone: the SyncQueue and the follow list.
///
/// shared_preferences in the app (pet_app's SyncQueue store); memory in
/// FIXTURES mode and tests, so nothing outlives the fixture session.
abstract interface class LocalStore {
  Future<String?> read(String key);

  /// Writes [value], or removes the key when it is null.
  Future<void> write(String key, String? value);
}

/// shared_preferences. Failures are swallowed: losing a cached value must
/// never stop the app (pet_app's rule).
class PrefsLocalStore implements LocalStore {
  const PrefsLocalStore();

  @override
  Future<String?> read(String key) async {
    try {
      return (await SharedPreferences.getInstance()).getString(key);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> write(String key, String? value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      value == null ? await prefs.remove(key) : await prefs.setString(key, value);
    } catch (_) {}
  }
}

/// In memory, for FIXTURES mode and tests.
class MemoryLocalStore implements LocalStore {
  MemoryLocalStore([Map<String, String>? values]) : values = {...?values};

  final Map<String, String> values;

  @override
  Future<String?> read(String key) async => values[key];

  @override
  Future<void> write(String key, String? value) async {
    value == null ? values.remove(key) : values[key] = value;
  }
}

final localStoreProvider = Provider<LocalStore>((ref) => const PrefsLocalStore());
