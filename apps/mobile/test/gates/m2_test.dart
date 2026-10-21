import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/artboard_placeholder.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/data/auth.dart';
import 'package:plinth/data/family.dart';
import 'package:plinth/data/follow.dart';
import 'package:plinth/data/privacy.dart';
import 'package:plinth/data/supabase_api.dart';
import 'package:plinth/features/family/family_join_screen.dart';
import 'package:plinth/features/family/family_screen.dart';
import 'package:plinth/features/following/following_screen.dart';
import 'package:plinth/features/onboarding/sign_in_flow_controller.dart';
import 'package:plinth/features/onboarding/welcome_screen.dart';
import 'package:plinth/features/you/privacy_screen.dart';
import 'package:plinth/features/you/you_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show AuthClientOptions, AuthFlowType, SupabaseClient;

import '../helpers/app_harness.dart';

/// T59 · M2 exit gate, app side (BUILD_PLAN §3 "M2: Accounts, follow,
/// alerts"; WORK_BREAKDOWN T59). It checks the M2 items the app owns and
/// points at the tests that already prove the details, so nothing is asserted
/// twice: Following with its 5 unread (test/features/following), the family
/// circle and the relative's opt-in (test/features/family), You and Who has my
/// number (test/features/you), onboarding, the sign-in controller and push
/// deep links (test/features/onboarding); the database side of every item is
/// supabase/tests/gates/m2.sql.
///
/// 1. Every M2 route opens its built screen, never the artboard placeholder.
/// 2. The goldens of the M2 screens that have them are committed.
/// 3. Live (ci-gate-m2 only): the app's own sign-in controller and
///    repositories sign Rohan in with Supabase Auth's test OTP on CI's seeded
///    stack and read his §5b world. The stack's URL and publishable key come
///    in `PLINTH_GATE_SUPABASE_URL` and `PLINTH_GATE_SUPABASE_KEY`
///    (`--dart-define` or the environment); the number and the fixed test code
///    are read from packages/fixtures/canonical/people.json and
///    supabase/config.toml. Elsewhere it is skipped.
void main() {
  group('M2 gate: the app screens are built', () {
    // BUILD_PLAN §3 M2 (app): sign-in and onboarding, Following, the family
    // circle and the relative's opt-in, You and Who has my number.
    final routes = <String, (Type, bool)>{
      Routes.welcome: (WelcomeScreen, false),
      Routes.following: (FollowingScreen, true),
      Routes.family: (FamilyScreen, true),
      Routes.familyJoinOf('AH2-7KQ'): (FamilyJoinScreen, false),
      Routes.you: (YouScreen, true),
      Routes.privacy: (PrivacyScreen, true),
    };
    for (final MapEntry(key: location, value: (screen, signedIn)) in routes.entries) {
      testWidgets('$location opens $screen', (tester) async {
        final container = await pumpPlinth(tester, location: location, signedIn: signedIn);
        expect(locationOf(container), location);
        expect(find.byType(screen), findsOneWidget);
        expect(find.byType(ArtboardPlaceholder), findsNothing, reason: 'no stub left on an M2 route');
        expect(tester.takeException(), isNull);
      });
    }

    test('the M2 goldens are committed', () {
      const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      for (final theme in ['day', 'night']) {
        for (final path in [
          'test/features/following/goldens/following_updates_$theme.png',
          'test/features/family/goldens/family_circle_$theme.png',
        ]) {
          final file = File(path);
          expect(file.existsSync(), isTrue, reason: '$path is committed');
          expect(file.readAsBytesSync().take(8).toList(), pngSignature, reason: '$path is a PNG');
        }
      }
    });
  });

  group('M2 gate: live sign-in with the test OTP (ci-gate-m2)', () {
    String? setting(String name, String fromDefine) => fromDefine.isNotEmpty ? fromDefine : Platform.environment[name];
    final url = setting('PLINTH_GATE_SUPABASE_URL', const String.fromEnvironment('PLINTH_GATE_SUPABASE_URL'));
    final key = setting('PLINTH_GATE_SUPABASE_KEY', const String.fromEnvironment('PLINTH_GATE_SUPABASE_KEY'));
    final skip = url == null || url.isEmpty || key == null || key.isEmpty;

    /// Rohan's fixture test number (people.json), never a real one.
    String rohanPhone() {
      final people = jsonDecode(File('../../packages/fixtures/canonical/people.json').readAsStringSync()) as Map;
      final rohan = (people['people'] as List).cast<Map>().firstWhere((p) => p['key'] == 'rohan');
      return rohan['test_phone_e164'] as String;
    }

    /// Supabase Auth's fixed test code for [phoneE164] ([auth.sms.test_otp]).
    String testOtp(String phoneE164) {
      final toml = File('../../supabase/config.toml').readAsStringSync();
      final section = toml
          .split(RegExp(r'^\[auth\.sms\.test_otp\]\s*$', multiLine: true))[1]
          .split(RegExp(r'^\[', multiLine: true))[0];
      final digits = phoneE164.replaceAll(RegExp(r'\D'), '');
      final match = RegExp('^$digits\\s*=\\s*"(\\d{6})"', multiLine: true).firstMatch(section);
      if (match == null) throw StateError('supabase/config.toml has no test OTP for this number');
      return match.group(1)!;
    }

    late SupabaseClient client;
    late SupabaseApiClient api;
    late SupabaseAuthRepository auth;

    setUpAll(() {
      if (skip) return;
      // flutter_test answers every HTTP request with a 400; this group talks to
      // CI's local stack for real.
      HttpOverrides.global = null;
      client = SupabaseClient(
        url,
        key,
        authOptions: const AuthClientOptions(autoRefreshToken: false, authFlowType: AuthFlowType.implicit),
      );
      api = SupabaseApiClient(client);
      auth = SupabaseAuthRepository(client.auth, api);
    });

    tearDownAll(() async {
      if (skip) return;
      await auth.signOut();
      await client.dispose();
    });

    test('the sign-in controller signs Rohan in with the test OTP', skip: skip, () async {
      final phone = rohanPhone();
      final flow = SignInFlowController(auth);
      addTearDown(flow.dispose);
      flow.setPhone(phone.replaceFirst('+91', ''));
      if (!await flow.sendCode()) {
        await auth.sendCode(phone); // the controller shows house copy; this surfaces the server's answer
        fail('POST /auth/v1/otp: ${flow.phoneErr}');
      }
      flow.setOtp(testOtp(phone));
      if (!await flow.verify()) {
        await auth.verifyCode(phone: phone, code: testOtp(phone));
        fail('POST /auth/v1/verify: ${flow.otpErr}');
      }
      expect(auth.signedIn, isTrue);
      expect(client.auth.currentUser?.phone, phone.replaceFirst('+', ''));
    });

    test('Following: his 5 changes since 14 Oct, his 4 projects, the Sunday digest', skip: skip, () async {
      expect(auth.signedIn, isTrue, reason: 'the sign-in test ran first');
      final feed = await SupabaseFollowRepository(api).feed();
      expect(feed.since, '2026-10-14T08:40:00+05:30');
      expect(feed.changes, hasLength(5));
      expect(feed.lastLookedLine, endsWith('· ${feed.changes.length} unread'));
      expect(feed.projects, hasLength(4));
      expect(feed.digest?.nextLine, 'Next digest Sun 25 Oct, 9 am');
    });

    test('Who has my number and the family circle, as he reads them', skip: skip, () async {
      final who = await SupabasePrivacyRepository(api).whoHasMyNumber();
      expect(who.countLine, '3 parties can reach you');
      final circle = await SupabaseFamilyRepository(api).circle();
      final members = (circle['members'] as List).cast<Map>();
      expect([for (final m in members) m['first_name']], contains('Meera'));
      final invites = (circle['invites'] as List).cast<Map>();
      expect([for (final i in invites) i['code']], contains('AH2-7KQ'));
    });
  });
}
