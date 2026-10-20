/// Every go_router path of the app (WORK_BREAKDOWN §2.2).
///
/// Paths mirror the web where a web page exists, so an Android App Link to
/// `https://plinth.in/gurugram/projects/<slug>` opens the same screen.
abstract final class Routes {
  // Tabs (the 4-tab shell, DESIGN §4.16).
  static const explore = '/explore';
  static const following = '/following';
  static const ask = '/ask';
  static const you = '/you';

  // Inside the tabs.
  static const map = '/explore/map';
  static const family = '/following/family';
  static const privacy = '/you/privacy';

  // Full-screen, above the tabs.
  static const welcome = '/welcome';
  static const project = '/gurugram/projects/:slug';
  static const risk = '/gurugram/projects/:slug/risk';
  static const familyJoin = '/j/:code';
  static const scan = '/scan';
  static const claims = '/check/claims';
  static const claim = '/check/claims/:id';
  static const costSheet = '/check/cost-sheet';
  static const beforePay = '/check/before-you-pay';
  static const payAsBuilt = '/check/pay-as-built';
  static const visit = '/visits/:id';
  static const visualise = '/visualise';
  static const visualiseResult = '/visualise/:id';

  static String projectOf(String slug) => '/gurugram/projects/$slug';
  static String riskOf(String slug) => '/gurugram/projects/$slug/risk';
  static String familyJoinOf(String code) => '/j/$code';
  static String claimOf(String id) => '/check/claims/$id';
  static String visitOf(String id) => '/visits/$id';
  static String visualiseResultOf(String id) => '/visualise/$id';

  /// Pages that need a session. Signed out, they open the You tab with the
  /// sign-in sheet instead; browsing never asks anyone to sign in.
  static bool needsAccount(String path) => path.startsWith('$you/');
}
