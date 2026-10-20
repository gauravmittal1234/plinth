import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/data/auth.dart';
import 'package:plinth/data/fixture_world.dart';
import 'package:plinth/features/onboarding/sign_in_flow_controller.dart';

/// Fixture mode never calls Supabase Auth (AGENTS.md §6): the controller
/// goes through [FixtureAuthRepository] the same way every screen's
/// `authRepositoryProvider` does in FIXTURES mode. Widget-level (not
/// `test()`): a plain `test()` has no fake clock, so [SignInFlowController]'s
/// resend countdown has nothing to tick against; `testWidgets` plus
/// `tester.pump` gives it one without pumping any actual widget.
void main() {
  late FixtureAuthRepository auth;
  late SignInFlowController sut;

  setUp(() {
    auth = FixtureAuthRepository(FixtureWorld(now: () => DateTime(2026, 10, 18, 12)));
    sut = SignInFlowController(auth);
  });

  tearDown(() => sut.dispose());

  /// `sendCode` (and `resend`/`switchChannel`) start a real 30 s
  /// `Timer.periodic`. `testWidgets` fake-asyncs the whole test body, so it
  /// must finish inside this test — otherwise the binding's own "no pending
  /// timers" check fails the test after it has otherwise passed.
  Future<void> flushCountdown(WidgetTester tester) => tester.pump(const Duration(seconds: 30));

  testWidgets('a 10-digit +91 number starting 6-9 is the only one accepted', (tester) async {
    sut.setPhone('123456789'); // 9 digits
    expect(await sut.sendCode(), isFalse);
    expect(sut.phoneErr, 'Enter a 10-digit mobile number, starting with 6, 7, 8 or 9.');

    sut.setPhone('9900000318');
    expect(await sut.sendCode(), isTrue);
    expect(sut.phoneErr, isNull);
    expect(sut.sent, isTrue);
    await flushCountdown(tester);
  });

  testWidgets('a non-+91 number only needs 7 digits', (tester) async {
    sut.setCc('+1');
    sut.setPhone('5551234');
    expect(await sut.sendCode(), isTrue);
    await flushCountdown(tester);
  });

  testWidgets('masks the number as +91 99••• ••318, never the whole thing', (tester) async {
    sut.setPhone('9900000318');
    expect(sut.masked, '+91 99••• ••318');
  });

  testWidgets('the sent line names the channel and the 10-minute window', (tester) async {
    sut.setPhone('9900000318');
    await sut.sendCode();
    expect(sut.sentLine, 'We sent it to WhatsApp, +91 99••• ••318. It works for 10 minutes.');

    sut.pickChannel(false);
    expect(sut.sentLine, 'We sent it by SMS to +91 99••• ••318. It works for 10 minutes.');
    await flushCountdown(tester);
  });

  testWidgets('verify needs all 6 digits before it calls anything', (tester) async {
    sut.setPhone('9900000318');
    await sut.sendCode();
    sut.setOtp('123');
    expect(await sut.verify(), isFalse);
    expect(sut.otpErr, 'Enter all 6 digits.');
    await flushCountdown(tester);
  });

  testWidgets('any 6-digit code signs the fixture buyer in', (tester) async {
    sut.setPhone('9900000318');
    await sut.sendCode();
    sut.setOtp('482193');
    expect(await sut.verify(), isTrue);
    expect(auth.signedIn, isTrue);
    await flushCountdown(tester);
  });

  testWidgets('resend is blocked for 30 seconds, then works', (tester) async {
    sut.setPhone('9900000318');
    await sut.sendCode();
    expect(sut.secondsLeft, 30);
    expect(await sut.resend(), isFalse, reason: 'still inside the 30 s wait');

    await flushCountdown(tester);
    expect(sut.secondsLeft, 0);
    expect(await sut.resend(), isTrue);
    expect(sut.secondsLeft, 30, reason: 'resending starts a fresh 30 s wait');
    await flushCountdown(tester);
  });

  testWidgets('switching channel sends a fresh code on the other one', (tester) async {
    sut.setPhone('9900000318');
    await sut.sendCode();
    expect(sut.viaWhatsApp, isTrue);
    expect(await sut.switchChannel(), isTrue);
    expect(sut.viaWhatsApp, isFalse);
    expect(sut.secondsLeft, 30);
    await flushCountdown(tester);
  });

  testWidgets('autofill reads a 6-digit run from the clipboard, never invents one', (tester) async {
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.getData') {
        return <String, dynamic>{'text': 'Your Plinth code is 482193. Do not share it.'};
      }
      return null;
    });
    expect(await sut.autofillFromClipboard(), isTrue);
    expect(sut.otp, '482193');
  });

  testWidgets('autofill does nothing when the clipboard has no code', (tester) async {
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.getData') return <String, dynamic>{'text': ''};
      return null;
    });
    expect(await sut.autofillFromClipboard(), isFalse);
    expect(sut.otp, '');
  });

  testWidgets('autofill only offers itself while on WhatsApp and the code is incomplete', (tester) async {
    sut.setPhone('9900000318');
    await sut.sendCode();
    expect(sut.canAutofill, isTrue);
    sut.setOtp('482193');
    expect(sut.canAutofill, isFalse, reason: 'already full');
    sut.setOtp('');
    sut.pickChannel(false);
    expect(sut.canAutofill, isFalse, reason: 'SMS has nothing to read from WhatsApp');
    await flushCountdown(tester);
  });
}
