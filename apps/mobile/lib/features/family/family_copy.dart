/// Layout copy for AppFamily (WORK_BREAKDOWN §1 rule 6): the artboard's
/// headings, field labels and button names, copied verbatim from
/// `product/design/artboards/AppFamily.dc.html`. Every fact about *who* is
/// in the circle (names, join dates, statuses) comes from `api.family_*`
/// payloads only, never from here — `api.family_circle` has no read
/// contract or fixture yet (T45a), so this screen has no member list to
/// draw copy for. The invite's own lines (the share text, the link,
/// "stays private to you…") come from `FamilyInvite`/`FamilyInvitePreview`
/// (`api.family_invite_create`/`_preview`), never from here either.
abstract final class FamilyCopy {
  static const title = 'Family';
  static const whoFollowsWithYou = 'Who follows with you?';
  static const subtitle = 'Your family circle · same alerts, separate numbers';

  /// The signed-in buyer's own row. Generic on purpose: the data layer has
  /// no typed profile yet (`api.me`'s shape is pending, T41), so this names
  /// no one.
  static const you = 'You';
  static const membersAppearLine = 'Members appear here once they join your circle.';

  static const inviteSomeone = 'Invite someone';
  static const whatTheyFollow = 'What they follow with you';
  static const scopeAurelia = 'Aurelia Heights Ph 2';
  static const scopeAll = 'All 4 projects';
  static const inviteOnWhatsApp = 'Invite on WhatsApp';
  static const copyLink = 'Copy link';
  static const linkCopied = 'Copied';

  static const theyCanSee = 'They can see';
  static const theyCanSeeItems = [
    'The projects you invite them to',
    'The same alerts, on their own phone',
    'Your shortlist and notes',
  ];
  static const theyCantChange = 'They can’t change';
  static const theyCantChangeItems = ['Your follows or follow type', 'Your alert settings', 'Who is in this circle'];

  static const signInToSeeCircle = 'Sign in to see your family circle.';
  static const signIn = 'Sign in';

  // The relative's opt-in screen.
  static const plinth = 'Plinth';
  static const illustrativeImage = 'Illustrative image';
  static const whatYouGet = 'What you’ll get';
  static const whereShouldAlertsGo = 'Where should the alerts go?';
  static const channelWhatsApp = 'WhatsApp, this number';
  static const channelApp = 'Plinth app';
  static const utilityOnly =
      'Utility updates about this project only, never marketing. Plinth works for buyers. No developer pays us. Ever.';
  static const getAlertsOnWhatsApp = 'Get these alerts on WhatsApp';

  /// "Follow with {name} in the app": the inviter's name is
  /// `FamilyInvitePreview.inviterFirstName`, never hard-coded here.
  static String followInApp(String inviterFirstName) => 'Follow with $inviterFirstName in the app';
  static const notNow = 'Not now';
  static const nothingWasSentTitle = 'Nothing was sent';
  static const nothingWasSentText = 'We don’t have your number, and the inviter won’t be told. The link still works.';
  static const nothingWasSentNote = 'Changed your mind? Open the link again.';

  /// "WhatsApp opened with "JOIN {code}" ready to send. Send it, and your
  /// alerts start." — the status after opening WhatsApp. The code itself
  /// comes from the invite preview, never invented.
  static String waOpenedStatus(String code) =>
      'WhatsApp opened with "JOIN $code" ready to send. Send it from there to start your alerts.';
}
