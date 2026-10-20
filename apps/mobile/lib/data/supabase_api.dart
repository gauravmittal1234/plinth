import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;
import 'package:supabase_flutter/supabase_flutter.dart';

import 'api_client.dart';

/// Live mode: `api.<fn>` through PostgREST, as
/// `supabase.schema('api').rpc(fn, params: args)` (API_CONTRACTS §1).
///
/// The request is `POST {SUPABASE_URL}/rest/v1/rpc/<fn>` with
/// `Content-Profile: api` and the publishable key or the user's JWT. Errors
/// come back as [ApiException] (the server answered) or [OfflineException]
/// (it could not be reached), so callers never see a transport type.
class SupabaseApiClient implements ApiClient {
  SupabaseApiClient(this._sb);

  final SupabaseClient _sb;

  @override
  Future<Object?> rpc(String fn, [JsonMap args = const {}]) async {
    try {
      return await _sb.schema('api').rpc<Object?>(fn, params: args);
    } on PostgrestException catch (e) {
      throw apiExceptionFromPostgrest(e, fn: fn);
    } on AuthException catch (e) {
      // The session could not be refreshed: the person must sign in again.
      throw ApiException(ApiErrorCode.authRequired, status: 401, details: e.message, fn: fn);
    } on Exception catch (e) {
      // Socket, TLS, timeout and client errors: no answer from the server.
      throw OfflineException(e);
    }
  }
}

/// Maps a PostgREST error to the contract's [ApiException].
///
/// `ops.raise_api_error` (T04) raises SQLSTATE `PT<http>` with the domain
/// code as `message` and a house-copy sentence as `details`. Anything else is
/// [ApiException.unexpected]: an expired JWT (`PGRST3xx`) becomes
/// `auth_required`; a bare status (`'502'`, from a gateway page) keeps it.
ApiException apiExceptionFromPostgrest(PostgrestException e, {String? fn}) {
  final pgCode = e.code ?? '';
  final details = e.details is String ? e.details as String : null;
  if (pgCode.startsWith('PT') && ApiErrorCode.values.contains(e.message)) {
    return ApiException(e.message, status: int.tryParse(pgCode.substring(2)), details: details, fn: fn);
  }
  if (pgCode.startsWith('PGRST3')) {
    return ApiException(ApiErrorCode.authRequired, status: 401, details: e.message, fn: fn);
  }
  final status = int.tryParse(pgCode.startsWith('PT') ? pgCode.substring(2) : pgCode);
  return ApiException(ApiException.unexpected, status: status, details: '${e.message} ($pgCode)', fn: fn);
}
