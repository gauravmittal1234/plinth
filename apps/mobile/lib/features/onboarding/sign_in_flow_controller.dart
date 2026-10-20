import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../data/auth.dart';
import 'onboarding_copy.dart';

/// Phone + one-time-code sign-in (API_CONTRACTS §5.4; AGENTS.md §4), the
/// logic behind both AppOnboarding's embedded Phone/Code steps and the quick
/// sign-in sheet opened from an account page. A plain [ChangeNotifier] (not a
/// Riverpod provider) so each place that signs someone in owns its own
/// instance and its own lifetime, built on the one [AuthRepository] every
/// screen already shares.
///
/// Validation matches the artboard exactly: a 10-digit `+91` number starting
/// 6–9, or at least 7 digits for anything else, checked on this phone before
/// ever calling the server.
class SignInFlowController extends ChangeNotifier {
  SignInFlowController(this._auth);

  final AuthRepository _auth;
  static final _digitsOnly = RegExp(r'\D');
  static final _phoneIn = RegExp(r'^[6-9]\d{9}$');

  String cc = '+91';
  String phoneDigits = '';
  String? phoneErr;
  bool viaWhatsApp = true;
  bool sent = false;
  bool busy = false;
  String otp = '';
  String? otpErr;

  /// Counts down from 30 after a code is sent (brief: "resend after 30 s").
  int secondsLeft = 0;
  Timer? _timer;

  bool get phoneOk => cc == '+91' ? _phoneIn.hasMatch(phoneDigits) : phoneDigits.length >= 7;

  /// The number as `api.*` wants it (E.164, no spaces).
  String get phoneE164 => '$cc$phoneDigits';

  /// "+91 99••• ••318": the first two and last three digits only, never the
  /// whole number on screen.
  String get masked {
    if (phoneDigits.length < 5) return cc;
    final start = phoneDigits.substring(0, 2);
    final end = phoneDigits.substring(phoneDigits.length - 3);
    return '$cc $start••• ••$end';
  }

  String get sentLine => viaWhatsApp ? OnboardingCopy.sentByWhatsApp(masked) : OnboardingCopy.sentBySms(masked);

  /// Shown only while a code just sent on WhatsApp hasn't been typed in yet
  /// (the artboard's own condition: `wa && otp.length < 6`).
  bool get canAutofill => viaWhatsApp && otp.length < 6;

  void setCc(String value) {
    cc = value;
    phoneErr = null;
    notifyListeners();
  }

  void setPhone(String value) {
    final digits = value.replaceAll(_digitsOnly, '');
    phoneDigits = digits.length > 14 ? digits.substring(0, 14) : digits;
    phoneErr = null;
    notifyListeners();
  }

  void setOtp(String value) {
    final digits = value.replaceAll(_digitsOnly, '');
    otp = digits.length > 6 ? digits.substring(0, 6) : digits;
    otpErr = null;
    notifyListeners();
  }

  void pickChannel(bool whatsApp) {
    if (whatsApp == viaWhatsApp) return;
    viaWhatsApp = whatsApp;
    notifyListeners();
  }

  /// Validates locally, then `api.send_code` (the auth hook, T41). On
  /// success starts the resend countdown; the caller moves to the Code step.
  Future<bool> sendCode() async {
    if (!phoneOk) {
      phoneErr = cc == '+91' ? OnboardingCopy.phoneErrIn : OnboardingCopy.phoneErrOther;
      notifyListeners();
      return false;
    }
    busy = true;
    phoneErr = null;
    notifyListeners();
    try {
      await _auth.sendCode(phoneE164);
      sent = true;
      otp = '';
      otpErr = null;
      _startCountdown();
      return true;
    } catch (_) {
      phoneErr = 'Could not send the code. Check your connection and try again.';
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  /// A new code on the same channel, once the 30 s wait is over.
  Future<bool> resend() async {
    if (secondsLeft > 0) return false;
    final ok = await sendCode();
    return ok;
  }

  /// A new code on the other channel (the Code step's "Send by SMS/WhatsApp
  /// instead").
  Future<bool> switchChannel() async {
    viaWhatsApp = !viaWhatsApp;
    return sendCode();
  }

  /// Validates locally (all 6 digits present), then `api.verify_code`.
  Future<bool> verify() async {
    if (otp.length < 6) {
      otpErr = OnboardingCopy.otpErrIncomplete;
      notifyListeners();
      return false;
    }
    busy = true;
    notifyListeners();
    try {
      await _auth.verifyCode(phone: phoneE164, code: otp);
      return true;
    } catch (_) {
      otpErr = OnboardingCopy.otpErrNoMatch;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  /// Reads a 6-digit run from the clipboard (what copying a WhatsApp message
  /// leaves there) and fills it in. There is no WhatsApp autofill API for a
  /// third-party app to hook into, so "one-tap autofill" means this: real
  /// digits the person actually copied, never an invented code.
  Future<bool> autofillFromClipboard() async {
    final data = await Clipboard.getData('text/plain');
    final text = (data?.text ?? '').replaceAll(RegExp(r'\s'), '');
    final match = RegExp(r'\d{6}').firstMatch(text);
    if (match == null) return false;
    setOtp(match.group(0)!);
    return true;
  }

  void _startCountdown() {
    secondsLeft = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      secondsLeft = secondsLeft > 0 ? secondsLeft - 1 : 0;
      notifyListeners();
      if (secondsLeft == 0) timer.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
