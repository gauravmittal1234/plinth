import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/data/follow.dart';
import 'package:plinth/data/session.dart';
import 'package:plinth/features/onboarding/onboarding_copy.dart';

import '../../helpers/app_harness.dart';

/// AppOnboarding (WORK_BREAKDOWN T48): walks the full 8-step first run in
/// FIXTURES mode — Welcome, Buying, Location, Phone, Code, Follow, Alerts,
/// Done — the same path a genuine first run takes, never a shortcut through
/// the controller.
void main() {
  /// Taps the shared bottom bar's primary action. It may show a toast
  /// (`showPlinthToast`, 3.2 s): flushed here so the toast's own floating
  /// SnackBar never sits over the *next* step's primary button and steals
  /// the following tap.
  Future<void> tapPrimary(WidgetTester tester) async {
    await tester.tap(find.byKey(const Key('onboarding-primary')));
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 4));
    await tester.pumpAndSettle();
  }

  Future<void> tapAndSettle(WidgetTester tester, Finder finder) async {
    await tester.tap(finder);
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 4));
    await tester.pumpAndSettle();
  }

  testWidgets('Welcome shows a real covered project, never a fixture-prototype name alone', (tester) async {
    await pumpPlinth(tester, location: Routes.welcome);
    expect(find.text(OnboardingCopy.welcomeHeadline), findsOneWidget);
    // Whichever of the real covered projects this fixture world lists
    // first — once as a "try a project" tab, once on the card itself.
    expect(find.text('Kestrel Park'), findsWidgets);
    expect(find.text(OnboardingCopy.welcomePrimary), findsOneWidget);
  });

  testWidgets('browsing never forces sign-in: Explore without an account reaches Done signed out', (tester) async {
    await pumpPlinth(tester, location: Routes.welcome);
    await tester.tap(find.text(OnboardingCopy.welcomeSecondary));
    await tester.pumpAndSettle();
    expect(find.text(OnboardingCopy.doneHeadline), findsOneWidget);
    expect(find.text(OnboardingCopy.doneLineSignedOut), findsOneWidget);
    expect(find.text(OnboardingCopy.accountNone), findsOneWidget);
  });

  testWidgets('walks Welcome through Done, signs in, follows a project and turns on alerts', (tester) async {
    final container = await pumpPlinth(tester, location: Routes.welcome);

    // Welcome -> Buying.
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.buyingHeadline), findsOneWidget);

    // Buying: nothing preselected, picking one is optional (the brief).
    await tester.tap(find.text(OnboardingCopy.kindUcTitle));
    await tester.pumpAndSettle();
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.locationHeadline), findsOneWidget);

    // Location: a corridor, no GPS permission asked (never tap "Use my
    // location" here — that's its own test).
    await tester.tap(find.text(OnboardingCopy.corridorDwarkaExpressway));
    await tester.pumpAndSettle();
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.phoneHeadline), findsOneWidget);

    // Phone: Rohan's own fixture number (packages/fixtures/canonical/people.json).
    await tester.enterText(find.byKey(const Key('onboarding-phone-field')), '9900000318');
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.codeHeadline), findsOneWidget);
    expect(container.read(signedInProvider), isFalse, reason: 'not yet — the code has to be verified first');

    // Code: any 6-digit code (FixtureAuthRepository: no real OTP to check).
    await tester.enterText(find.byKey(const Key('onboarding-otp-field')), '482193');
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.followHeadline), findsOneWidget);
    expect(container.read(signedInProvider), isTrue);

    // Follow: Rohan already follows aurelia/kestrel/sapphire/coral in the
    // canonical fixture, so the first "Follow" (not "Following") button
    // belongs to the next project down the list, Cedar Walk — a genuinely
    // new follow.
    await scrollIntoView(tester, find.text('Cedar Walk, Phase 2'));
    final followButton = find.text(OnboardingCopy.follow).first;
    await scrollIntoView(tester, followButton);
    await tapAndSettle(tester, followButton);
    expect(container.read(followTypeProvider('cedar-walk-phase-2')), isNotNull);

    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.alertsHeadline), findsOneWidget);

    // Alerts: also on WhatsApp, then turn alerts on.
    await tester.tap(find.text(OnboardingCopy.alsoOnWhatsApp));
    await tester.pumpAndSettle();
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.doneHeadline), findsOneWidget);

    // Done: a true summary of this run.
    expect(find.text(OnboardingCopy.doneLineSignedIn), findsOneWidget);
    expect(find.textContaining('Cedar Walk, Phase 2'), findsWidgets);
    expect(find.textContaining(OnboardingCopy.corridorDwarkaExpressway), findsWidgets);
    expect(find.textContaining('also on WhatsApp'), findsWidgets);

    await tapPrimary(tester);
    expect(locationOf(container), Routes.explore);
  });

  testWidgets('a code that never arrives is an honest error, not a silent pass', (tester) async {
    await pumpPlinth(tester, location: Routes.welcome);
    await tapPrimary(tester); // Buying
    await tapPrimary(tester); // Location
    await tapPrimary(tester); // Phone
    await tester.enterText(find.byKey(const Key('onboarding-phone-field')), '9900000318');
    await tapPrimary(tester); // -> Code
    await tester.enterText(find.byKey(const Key('onboarding-otp-field')), '123');
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.otpErrIncomplete), findsOneWidget);
    expect(
      find.text(OnboardingCopy.followHeadline),
      findsNothing,
      reason: 'an incomplete code must not advance the step',
    );
  });

  testWidgets('an invalid phone number is refused before any call is made', (tester) async {
    await pumpPlinth(tester, location: Routes.welcome);
    await tapPrimary(tester); // Buying
    await tapPrimary(tester); // Location
    await tapPrimary(tester); // Phone
    await tester.enterText(find.byKey(const Key('onboarding-phone-field')), '12345');
    await tapPrimary(tester);
    expect(find.text(OnboardingCopy.phoneErrIn), findsOneWidget);
    expect(find.text(OnboardingCopy.codeHeadline), findsNothing);
  });

  testWidgets('Skip on Buying goes straight to Location', (tester) async {
    await pumpPlinth(tester, location: Routes.welcome);
    await tapPrimary(tester); // Welcome -> Buying
    await tester.tap(find.text(OnboardingCopy.skip));
    await tester.pumpAndSettle();
    expect(find.text(OnboardingCopy.locationHeadline), findsOneWidget);
  });

  testWidgets('Back returns to the previous step', (tester) async {
    await pumpPlinth(tester, location: Routes.welcome);
    await tapPrimary(tester); // Buying
    await tapPrimary(tester); // Location
    await tester.tap(find.byTooltip('Back'));
    await tester.pumpAndSettle();
    expect(find.text(OnboardingCopy.buyingHeadline), findsOneWidget);
  });

  testWidgets('using location asks Android, and never invents a sector name when the plugin is unavailable', (
    tester,
  ) async {
    await pumpPlinth(tester, location: Routes.welcome);
    await tapPrimary(tester); // Buying
    await tapPrimary(tester); // -> Location
    await tester.tap(find.text(OnboardingCopy.useMyLocation));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    // No geolocator platform implementation in a widget test: permission
    // can't be granted, so this must fail honestly rather than pretend a
    // sector it has no fact for (AGENTS.md rule 10).
    expect(find.text(OnboardingCopy.locationOnHeadline), findsNothing);
  });
}
