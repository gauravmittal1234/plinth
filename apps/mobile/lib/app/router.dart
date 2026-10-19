import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/session.dart';
import '../features/ask/ask_screen.dart';
import '../features/checks/before_pay/before_pay_screen.dart';
import '../features/checks/claims/claim_screen.dart';
import '../features/checks/claims/claims_screen.dart';
import '../features/checks/cost_sheet/cost_sheet_screen.dart';
import '../features/checks/pay_as_built/pay_as_built_screen.dart';
import '../features/explore/explore_screen.dart';
import '../features/explore/map_screen.dart';
import '../features/family/family_join_screen.dart';
import '../features/family/family_screen.dart';
import '../features/following/following_screen.dart';
import '../features/onboarding/welcome_screen.dart';
import '../features/project/project_screen.dart';
import '../features/risk/risk_screen.dart';
import '../features/scan/scan_screen.dart';
import '../features/visits/visit_pass_screen.dart';
import '../features/visualise/visualise_capture_screen.dart';
import '../features/visualise/visualise_result_screen.dart';
import '../features/you/privacy_screen.dart';
import '../features/you/you_screen.dart';
import '../fixtures/fixture_mode.dart';
import 'account_gate.dart';
import 'not_found_screen.dart';
import 'routes.dart';
import 'shell.dart';

/// Where the app opens. An Android App Link opens its own path instead.
///
/// FIXTURES builds may start elsewhere for review and screenshots:
/// `--dart-define=START_PATH=/gurugram/projects/aurelia-heights-phase-2`.
const _startPath = String.fromEnvironment('START_PATH');
const initialLocation = kFixtures && _startPath != '' ? _startPath : Routes.explore;

/// The app's router, after pet_app's `routerProvider`: one GoRouter for the
/// app's life, re-checked whenever sign-in changes ([refreshListenable]).
///
/// Browsing never redirects to sign-in (DESIGN §2.6). The only redirect sends
/// a signed-out person from an account page to the You tab's sign-in sheet.
final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  ref.listen(signedInProvider, (_, _) => refresh.value++);
  final router = GoRouter(
    initialLocation: initialLocation,
    refreshListenable: refresh,
    redirect: (context, state) => accountRedirect(state.uri, signedIn: ref.read(signedInProvider)),
    errorBuilder: (context, state) => NotFoundScreen(location: state.uri.path),
    routes: appRoutes(),
  );
  ref.onDispose(() {
    router.dispose();
    refresh.dispose();
  });
  return router;
});

/// Signed out on an account page (`/you/*`): open the You tab and its sign-in
/// sheet, then come back to [uri]. Everything else stays where it is.
@visibleForTesting
String? accountRedirect(Uri uri, {required bool signedIn}) {
  if (signedIn || !Routes.needsAccount(uri.path)) return null;
  return Uri(path: Routes.you, queryParameters: {'signin': '1', 'next': uri.toString()}).toString();
}

/// Every path in WORK_BREAKDOWN §2.2, each on its feature's screen.
List<RouteBase> appRoutes() => [
  GoRoute(path: '/', redirect: (_, _) => Routes.explore),

  // The 4 tabs. Each keeps its own stack.
  StatefulShellRoute.indexedStack(
    builder: (_, _, shell) => AppShell(shell: shell),
    branches: [
      StatefulShellBranch(
        routes: [
          GoRoute(
            path: Routes.explore,
            builder: (_, _) => const ExploreScreen(),
            routes: [GoRoute(path: 'map', builder: (_, _) => const MapScreen())],
          ),
        ],
      ),
      StatefulShellBranch(
        routes: [
          GoRoute(
            path: Routes.following,
            builder: (_, _) => const FollowingScreen(),
            routes: [GoRoute(path: 'family', builder: (_, _) => const FamilyScreen())],
          ),
        ],
      ),
      StatefulShellBranch(
        routes: [GoRoute(path: Routes.ask, builder: (_, _) => const AskScreen())],
      ),
      StatefulShellBranch(
        routes: [
          GoRoute(
            path: Routes.you,
            builder: (_, state) {
              final q = state.uri.queryParameters;
              const you = YouScreen();
              return q['signin'] == '1' ? SignInOnOpen(next: q['next'], child: you) : you;
            },
            routes: [GoRoute(path: 'privacy', builder: (_, _) => const PrivacyScreen())],
          ),
        ],
      ),
    ],
  ),

  // Full screen, above the tabs.
  GoRoute(path: Routes.welcome, builder: (_, _) => const WelcomeScreen()),
  GoRoute(
    path: Routes.project,
    builder: (_, state) => ProjectScreen(
      slug: state.pathParameters['slug']!,
      // FIXTURES-only preview of the AppProjectStates variants.
      previewState: kFixtures ? state.uri.queryParameters['state'] : null,
    ),
    routes: [
      GoRoute(
        path: 'risk',
        builder: (_, state) => RiskScreen(slug: state.pathParameters['slug']!),
      ),
    ],
  ),
  GoRoute(
    path: Routes.familyJoin,
    builder: (_, state) => FamilyJoinScreen(code: state.pathParameters['code']!),
  ),
  GoRoute(path: Routes.scan, builder: (_, _) => const ScanScreen()),
  GoRoute(
    path: Routes.claims,
    builder: (_, _) => const ClaimsScreen(),
    routes: [
      GoRoute(
        path: ':id',
        builder: (_, state) => ClaimScreen(id: state.pathParameters['id']!),
      ),
    ],
  ),
  GoRoute(path: Routes.costSheet, builder: (_, _) => const CostSheetScreen()),
  GoRoute(path: Routes.beforePay, builder: (_, _) => const BeforePayScreen()),
  GoRoute(path: Routes.payAsBuilt, builder: (_, _) => const PayAsBuiltScreen()),
  GoRoute(
    path: Routes.visit,
    builder: (_, state) => VisitPassScreen(id: state.pathParameters['id']!),
  ),
  GoRoute(
    path: Routes.visualise,
    builder: (_, _) => const VisualiseCaptureScreen(),
    routes: [
      GoRoute(
        path: ':id',
        builder: (_, state) => VisualiseResultScreen(id: state.pathParameters['id']!),
      ),
    ],
  ),
];
