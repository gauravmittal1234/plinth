import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;

// The one seam between the app's repositories and a backend (BUILD_PLAN §1
// rule 2, "one contract"): every read and write is a call to an `api.<fn>`
// Postgres function with `p_` arguments (API_CONTRACTS §1).
//
// Two implementations:
// - `SupabaseApiClient` (supabase_api.dart): `supabase.schema('api').rpc(...)`.
// - `FixtureWorld` (fixture_world.dart): packages/fixtures/expected, offline,
//   with writes held in memory (FIXTURES mode).

/// A decoded JSON object.
typedef JsonMap = Map<String, dynamic>;

/// Calls `api.<fn>` functions.
abstract interface class ApiClient {
  /// Calls `api.<fn>(args)` and returns its decoded JSON result.
  ///
  /// [args] are the function's `p_` arguments (snake case, API_CONTRACTS §1).
  /// Throws [ApiException] when the server answers with an error, and
  /// [OfflineException] when it cannot be reached.
  Future<Object?> rpc(String fn, [JsonMap args = const {}]);
}

/// Typed results over [ApiClient.rpc].
extension ApiClientResults on ApiClient {
  /// Calls `api.<fn>(args)` and returns its JSON object.
  Future<JsonMap> rpcMap(String fn, [JsonMap args = const {}]) async {
    final result = await rpc(fn, args);
    if (result is Map) return Map<String, dynamic>.from(result);
    throw ApiException(
      ApiException.unexpected,
      fn: fn,
      details: 'api.$fn returned ${result.runtimeType}, not a JSON object.',
    );
  }
}

/// The server answered with an error (API_CONTRACTS §1 "Errors").
///
/// RPCs raise SQLSTATE `PT<http>` with `message` = a domain code and
/// `details` = a sentence in house copy, which a screen may show as it is.
class ApiException implements Exception {
  const ApiException(this.code, {this.status, this.details, this.fn});

  /// A domain code ([ApiErrorCode], e.g. `not_found`), or [unexpected] for an
  /// answer outside the contract (a gateway page, an unknown function).
  final String code;

  /// The HTTP status, when known (404 for `not_found`, 422 for `invalid_input`).
  final int? status;

  /// The server's sentence (house copy) or, for [unexpected], a diagnostic.
  final String? details;

  /// The `api` function that failed.
  final String? fn;

  /// An answer outside the contract's error codes.
  static const unexpected = 'unexpected';

  /// `not_found` or `not_in_coverage`.
  bool get isNotFound => code == ApiErrorCode.notFound || code == ApiErrorCode.notInCoverage;

  /// Worth sending again later: rate limited, or a gateway error (5xx) with no
  /// domain code. Everything else is the server's final answer.
  bool get retryable => code == ApiErrorCode.rateLimited || (code == unexpected && (status ?? 0) >= 500);

  @override
  String toString() =>
      'ApiException($code${status == null ? '' : ' $status'}${fn == null ? '' : ' api.$fn'}: $details)';
}

/// The server could not be reached (no connection, a timeout, a captive portal).
class OfflineException implements Exception {
  const OfflineException([this.cause]);

  /// What the transport threw.
  final Object? cause;

  @override
  String toString() => 'OfflineException($cause)';
}

/// True when [error] means "no connection" rather than "the server said no".
bool isOffline(Object error) => error is OfflineException;

/// Riverpod retry policy for data providers: never retry automatically. A
/// screen offers its own retry; the SyncQueue replays writes on its schedule.
Duration? noRetry(int retryCount, Object error) => null;

/// [json] without null values, recursively in nested objects. Optional
/// arguments are left out rather than sent as nulls.
JsonMap compactJson(JsonMap json) => {
  for (final e in json.entries)
    if (e.value != null) e.key: e.value is Map ? compactJson(Map<String, dynamic>.from(e.value as Map)) : e.value,
};
