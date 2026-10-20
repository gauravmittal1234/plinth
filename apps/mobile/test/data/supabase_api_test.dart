import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/api_client.dart';
import 'package:plinth/data/auth.dart';
import 'package:plinth/data/supabase_api.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ApiErrorCode;
import 'package:supabase_flutter/supabase_flutter.dart';

// Live mode on the wire, with no Supabase project and no secrets: a loopback
// HTTP server stands in for PostgREST and GoTrue, and the real supabase
// client talks to it.

/// flutter_test answers every HttpClient request with a 400; the loopback
/// server needs real sockets.
class _RealHttp extends HttpOverrides {}

typedef _Request = ({String method, String path, Map<String, String> headers, Object? body});
typedef _Reply = ({int status, Object? body, String contentType});

_Reply _json(int status, Object? body) => (status: status, body: body, contentType: 'application/json');

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late HttpServer server;
  late List<_Request> requests;
  late _Reply Function(_Request) reply;

  setUp(() async {
    requests = [];
    reply = (_) => _json(200, const {});
    server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    server.listen((req) async {
      final raw = await utf8.decoder.bind(req).join();
      final headers = <String, String>{};
      req.headers.forEach((name, values) => headers[name] = values.join(','));
      final r = (method: req.method, path: req.uri.path, headers: headers, body: raw.isEmpty ? null : jsonDecode(raw));
      requests.add(r);
      final out = reply(r);
      req.response
        ..statusCode = out.status
        ..headers.contentType = ContentType.parse(out.contentType)
        ..write(out.body is String ? out.body : jsonEncode(out.body));
      await req.response.close();
    });
  });

  tearDown(() => server.close(force: true));

  /// Runs [body] with real sockets and a supabase client pointed at the
  /// loopback server (a fake publishable key; nothing leaves this machine).
  Future<void> live(Future<void> Function(SupabaseClient sb) body) => HttpOverrides.runWithHttpOverrides(() async {
    final sb = SupabaseClient(
      'http://127.0.0.1:${server.port}',
      'publishable-key-for-tests',
      authOptions: const AuthClientOptions(autoRefreshToken: false),
    );
    try {
      await body(sb);
    } finally {
      await sb.dispose();
    }
  }, _RealHttp());

  group('SupabaseApiClient', () {
    test('POSTs /rest/v1/rpc/<fn> with Content-Profile: api and the p_ arguments', () async {
      reply = (_) => _json(200, {'schema': 'plinth.risk_summary/1'});
      await live((sb) async {
        final result = await SupabaseApiClient(sb).rpc('risk_summary', {'p_slug': 'aurelia-heights-phase-2'});
        expect(result, {'schema': 'plinth.risk_summary/1'});
      });
      final r = requests.single;
      expect(r.method, 'POST');
      expect(r.path, '/rest/v1/rpc/risk_summary');
      expect(r.headers['content-profile'], 'api');
      expect(r.headers['apikey'], 'publishable-key-for-tests');
      expect(r.body, {'p_slug': 'aurelia-heights-phase-2'});
    });

    test('PT404 not_found keeps its status and house-copy sentence', () async {
      reply = (_) => _json(404, {'code': 'PT404', 'message': 'not_found', 'details': 'No such project.', 'hint': null});
      await live((sb) async {
        await expectLater(
          SupabaseApiClient(sb).rpc('risk_summary', {'p_slug': 'indigo-terraces'}),
          throwsA(
            isA<ApiException>()
                .having((e) => e.code, 'code', ApiErrorCode.notFound)
                .having((e) => e.status, 'status', 404)
                .having((e) => e.details, 'details', 'No such project.')
                .having((e) => e.fn, 'fn', 'risk_summary')
                .having((e) => e.isNotFound, 'isNotFound', isTrue)
                .having((e) => e.retryable, 'retryable', isFalse),
          ),
        );
      });
    });

    test('PT422 invalid_input', () async {
      reply = (_) => _json(422, {'code': 'PT422', 'message': 'invalid_input', 'details': 'Bad fact id.', 'hint': null});
      await live((sb) async {
        await expectLater(
          SupabaseApiClient(sb).rpc('evidence', {'p_fact_id': 'nope'}),
          throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.invalidInput)),
        );
      });
    });

    test('an expired JWT (PGRST301) means sign in again', () async {
      reply = (_) => _json(401, {'code': 'PGRST301', 'message': 'JWT expired', 'details': null, 'hint': null});
      await live((sb) async {
        await expectLater(
          SupabaseApiClient(sb).rpc('who_has_my_number'),
          throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.authRequired)),
        );
      });
    });

    test('a gateway page (502, HTML) is unexpected and worth retrying', () async {
      reply = (_) => (status: 502, body: '<html>Bad gateway</html>', contentType: 'text/html');
      await live((sb) async {
        await expectLater(
          SupabaseApiClient(sb).rpc('follow', {'p_slug': 'kestrel-park'}),
          throwsA(
            isA<ApiException>()
                .having((e) => e.code, 'code', ApiException.unexpected)
                .having((e) => e.status, 'status', 502)
                .having((e) => e.retryable, 'retryable', isTrue),
          ),
        );
      });
    });

    test('no server at all is OfflineException', () async {
      final port = server.port;
      await server.close(force: true);
      await HttpOverrides.runWithHttpOverrides(() async {
        final sb = SupabaseClient(
          'http://127.0.0.1:$port',
          'publishable-key-for-tests',
          authOptions: const AuthClientOptions(autoRefreshToken: false),
        );
        try {
          await expectLater(SupabaseApiClient(sb).rpc('flags'), throwsA(isA<OfflineException>()));
        } finally {
          await sb.dispose();
        }
      }, _RealHttp());
    });
  });

  group('SupabaseAuthRepository', () {
    test('a phone code signs in and out through GoTrue', () async {
      reply = (r) => switch (r.path) {
        '/auth/v1/verify' => _json(200, {
          'access_token': 'access-token-for-tests',
          'token_type': 'bearer',
          'expires_in': 3600,
          'refresh_token': 'refresh-token-for-tests',
          'user': {
            'id': '00000000-0000-4000-8000-0000000000aa',
            'aud': 'authenticated',
            'created_at': '2026-10-18T06:30:00Z',
            'app_metadata': <String, dynamic>{},
            'user_metadata': <String, dynamic>{},
          },
        }),
        _ => _json(200, <String, dynamic>{}),
      };
      await live((sb) async {
        final auth = SupabaseAuthRepository(sb.auth, SupabaseApiClient(sb));
        final seen = <bool>[];
        final sub = auth.changes.listen(seen.add);
        expect(auth.signedIn, isFalse);

        await auth.sendCode('fixture-buyer-phone');
        await auth.verifyCode(phone: 'fixture-buyer-phone', code: '482913');
        expect(auth.signedIn, isTrue);

        await auth.signOut();
        expect(auth.signedIn, isFalse);
        await pumpEventQueue();
        await sub.cancel();
        expect(seen, containsAllInOrder([true, false]));
      });
      final otp = requests.firstWhere((r) => r.path == '/auth/v1/otp');
      expect((otp.body as Map)['phone'], 'fixture-buyer-phone');
      expect((otp.body as Map)['channel'], 'sms');
      final verify = requests.firstWhere((r) => r.path == '/auth/v1/verify');
      expect(verify.body, containsPair('token', '482913'));
      expect(verify.body, containsPair('type', 'sms'));
    });

    test('a wrong code is invalid_input; no server is OfflineException', () async {
      reply = (r) => _json(400, {'code': 'otp_expired', 'msg': 'Token has expired or is invalid'});
      await live((sb) async {
        final auth = SupabaseAuthRepository(sb.auth, SupabaseApiClient(sb));
        await expectLater(
          auth.verifyCode(phone: 'fixture-buyer-phone', code: '000001'),
          throwsA(isA<ApiException>().having((e) => e.code, 'code', ApiErrorCode.invalidInput)),
        );
        await server.close(force: true);
        await expectLater(auth.sendCode('fixture-buyer-phone'), throwsA(isA<OfflineException>()));
      });
    });
  });
}
