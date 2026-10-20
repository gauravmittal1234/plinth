import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// Auth: phone sign-in with a one-time code (R1 has no Google sign-in,
// BUILD_PLAN §5.3), plus the account and device calls of API_CONTRACTS §3.2.
// T48 builds the sign-in sheet and push registration on top of this.

/// Signing in and the account's own calls.
abstract interface class AuthRepository {
  /// Whether someone is signed in now.
  bool get signedIn;

  /// Emits [signedIn] whenever it changes.
  Stream<bool> get changes;

  /// Sends a one-time code to [phone] (E.164). The auth hook delivers it on
  /// WhatsApp or by SMS (API_CONTRACTS §5.4).
  Future<void> sendCode(String phone);

  /// Signs in with the code sent to [phone].
  Future<void> verifyCode({required String phone, required String code});

  Future<void> signOut();

  /// `api.me()`. Its shape is pending (T41); returned as JSON.
  Future<JsonMap> me();

  /// `api.device_register(p_token, p_platform, p_app_version)`: the FCM token.
  Future<Ok> registerDevice({required String token, required String platform, required String appVersion});
}

/// Live: Supabase Auth (GoTrue) and the `api` RPCs.
class SupabaseAuthRepository implements AuthRepository {
  SupabaseAuthRepository(this._auth, this._api);

  final GoTrueClient _auth;
  final ApiClient _api;

  @override
  bool get signedIn => _auth.currentUser != null;

  @override
  Stream<bool> get changes => _auth.onAuthStateChange.map((s) => s.session != null);

  @override
  Future<void> sendCode(String phone) => _guard(() => _auth.signInWithOtp(phone: phone));

  @override
  Future<void> verifyCode({required String phone, required String code}) =>
      _guard(() => _auth.verifyOTP(phone: phone, token: code, type: OtpType.sms));

  @override
  Future<void> signOut() => _guard(() => _auth.signOut());

  @override
  Future<JsonMap> me() => _api.rpcMap('me');

  @override
  Future<Ok> registerDevice({required String token, required String platform, required String appVersion}) async =>
      Ok.fromJson(
        await _api.rpcMap('device_register', {'p_token': token, 'p_platform': platform, 'p_app_version': appVersion}),
      );

  /// Auth errors in the contract's terms: no connection is [OfflineException];
  /// a wrong or expired code is `invalid_input`; too many tries `rate_limited`.
  static Future<void> _guard(Future<Object?> Function() step) async {
    try {
      await step();
    } on AuthRetryableFetchException catch (e) {
      throw OfflineException(e);
    } on AuthException catch (e) {
      final status = int.tryParse(e.statusCode ?? '');
      final code = switch (status) {
        400 || 403 || 422 => ApiErrorCode.invalidInput,
        401 => ApiErrorCode.authRequired,
        429 => ApiErrorCode.rateLimited,
        _ => ApiException.unexpected,
      };
      throw ApiException(code, status: status, details: e.message, fn: 'auth');
    }
  }
}

/// FIXTURES mode: no accounts. Any 6-digit code signs the fixture buyer in
/// (DESIGN §5b's Rohan once T03b's people fixtures land), so the buyer
/// functions of the fixture world open up.
class FixtureAuthRepository implements AuthRepository {
  FixtureAuthRepository(this._world);

  final FixtureWorld _world;

  static final _code = RegExp(r'^\d{6}$');

  @override
  bool get signedIn => _world.session.signedIn;

  @override
  Stream<bool> get changes => _world.session.changes;

  @override
  Future<void> sendCode(String phone) async {
    if (phone.trim().isEmpty) throw const ApiException(ApiErrorCode.invalidInput, status: 422, fn: 'auth');
  }

  @override
  Future<void> verifyCode({required String phone, required String code}) async {
    if (!_code.hasMatch(code)) throw const ApiException(ApiErrorCode.invalidInput, status: 422, fn: 'auth');
    _world.session.signedIn = true;
  }

  @override
  Future<void> signOut() async => _world.session.signedIn = false;

  @override
  Future<JsonMap> me() => _world.rpcMap('me');

  @override
  Future<Ok> registerDevice({required String token, required String platform, required String appVersion}) async =>
      Ok.fromJson(
        await _world.rpcMap('device_register', {'p_token': token, 'p_platform': platform, 'p_app_version': appVersion}),
      );
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final sb = ref.watch(supabaseProvider);
  if (sb == null) throw missingSupabase('authRepositoryProvider');
  return SupabaseAuthRepository(sb.auth, ref.watch(apiClientProvider));
});
