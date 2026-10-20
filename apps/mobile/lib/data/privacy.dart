import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plinth_contracts/plinth_contracts.dart';

import 'api_client.dart';
import 'fixture_world.dart';
import 'session.dart';

// Privacy and rights (API_CONTRACTS §4.10, BUILD_PLAN §13): who has my
// number, consent history with C-MMDD-NN refs, one-tap withdraw, relay renew,
// download my data and delete my account. Screens: AppYou (T51).

abstract interface class PrivacyRepository {
  /// `api.who_has_my_number()`.
  Future<WhoHasMyNumber> whoHasMyNumber();

  /// `api.consent_history()`. Shape pending (T45b), returned as JSON.
  Future<JsonMap> consentHistory();

  /// `api.consent_withdraw(p_ref)` for a C- ref: ends the share and asks the
  /// party to delete the number.
  Future<ConsentWithdrawal> withdrawConsent(String consentRef);

  /// `api.relay_renew(p_relay_id)`. Shape pending (T45b).
  Future<JsonMap> renewRelay(String relayId);

  /// `api.data_export_request()`. Shape pending (T45b).
  Future<JsonMap> requestDataExport();

  /// `api.account_delete_request()`. Shape pending (T45b).
  Future<JsonMap> requestAccountDeletion();
}

class SupabasePrivacyRepository implements PrivacyRepository {
  SupabasePrivacyRepository(this._api);

  final ApiClient _api;

  @override
  Future<WhoHasMyNumber> whoHasMyNumber() async => WhoHasMyNumber.fromJson(await _api.rpcMap('who_has_my_number'));

  @override
  Future<JsonMap> consentHistory() => _api.rpcMap('consent_history');

  @override
  Future<ConsentWithdrawal> withdrawConsent(String consentRef) async =>
      ConsentWithdrawal.fromJson(await _api.rpcMap('consent_withdraw', {'p_ref': consentRef}));

  @override
  Future<JsonMap> renewRelay(String relayId) => _api.rpcMap('relay_renew', {'p_relay_id': relayId});

  @override
  Future<JsonMap> requestDataExport() => _api.rpcMap('data_export_request');

  @override
  Future<JsonMap> requestAccountDeletion() => _api.rpcMap('account_delete_request');
}

/// The fixture buyer's privacy pages (`expected/who_has_my_number`, T03b).
/// Writes are held in the fixture session; a write with no fixture answer is
/// `not_found`.
class FixturePrivacyRepository implements PrivacyRepository {
  FixturePrivacyRepository(this._world);

  final FixtureWorld _world;

  @override
  Future<WhoHasMyNumber> whoHasMyNumber() async => WhoHasMyNumber.fromJson(await _world.rpcMap('who_has_my_number'));

  @override
  Future<JsonMap> consentHistory() => _world.rpcMap('consent_history');

  @override
  Future<ConsentWithdrawal> withdrawConsent(String consentRef) async =>
      ConsentWithdrawal.fromJson(await _world.writeAnswered('consent_withdraw', {'p_ref': consentRef}));

  @override
  Future<JsonMap> renewRelay(String relayId) => _world.writeAnswered('relay_renew', {'p_relay_id': relayId});

  @override
  Future<JsonMap> requestDataExport() => _world.writeAnswered('data_export_request', const {});

  @override
  Future<JsonMap> requestAccountDeletion() => _world.writeAnswered('account_delete_request', const {});
}

final privacyRepositoryProvider = Provider<PrivacyRepository>(
  (ref) => SupabasePrivacyRepository(ref.watch(apiClientProvider)),
);

/// Who can reach the signed-in buyer (null when signed out).
final whoHasMyNumberProvider = FutureProvider<WhoHasMyNumber?>((ref) async {
  if (!ref.watch(signedInProvider)) return null;
  return ref.watch(privacyRepositoryProvider).whoHasMyNumber();
}, retry: noRetry);

/// The signed-in buyer's consent history (null when signed out).
final consentHistoryProvider = FutureProvider<JsonMap?>((ref) async {
  if (!ref.watch(signedInProvider)) return null;
  return ref.watch(privacyRepositoryProvider).consentHistory();
}, retry: noRetry);
