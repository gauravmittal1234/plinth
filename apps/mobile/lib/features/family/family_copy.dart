/// Layout copy for AppFamily (WORK_BREAKDOWN §1 rule 6): the artboard's
/// headings, field labels, dialog text and button names, copied verbatim
/// from `product/design/artboards/AppFamily.dc.html`. The invite's own
/// lines (the share text, the link, "stays private to you…") come from
/// `FamilyInvite`/`FamilyInvitePreview` (`api.family_invite_create`/
/// `_preview`), never from here.
abstract final class FamilyCopy {
  static const title = 'Family';
  static const whoFollowsWithYou = 'Who follows with you?';
  static const subtitle = 'Your family circle · same alerts, separate numbers';

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

  static const remove = 'Remove';
  static const cancelInvite = 'Cancel invite';
  static const undo = 'Undo';

  // Revoke / cancel-invite dialog (verbatim from the artboard's DLG map).
  static const removeMeeraTitle = 'Remove Meera?';
  static const removeMeeraPoints = [
    'Her alerts through your circle stop now.',
    'She loses your shared shortlist and notes.',
    'Anything she follows on her own stays hers.',
  ];
  static const removeMeeraYes = 'Remove Meera';
  static const removeMeeraNo = 'Keep her';
  static const removeMeeraToast = 'Meera removed. Her alerts through your circle stopped.';

  static const cancelFatherTitle = 'Cancel the invite?';
  static const cancelFatherPoints = [
    'The link stops working at once.',
    'Nothing was ever sent to him, and we never had his number.',
  ];
  static const cancelFatherYes = 'Cancel invite';
  static const cancelFatherNo = 'Keep it';
  static const cancelFatherToast = 'Invite cancelled. The link no longer works.';

  // Member sub-labels (DESIGN §5b; also packages/fixtures/canonical/family.json).
  static const youSub = 'Started this circle · follows your projects';
  static const meeraJoinedSub = 'Joined 6 Oct 2026 · same alerts, 4 projects · can add notes';
  static const meeraRemovedSub = 'Removed today · her alerts through your circle stopped';
  static const fatherInvitedSub = 'Invited today · Aurelia Heights Ph 2 · hasn’t tapped the link yet';
  static const fatherCancelledSub = 'Invite cancelled · the link no longer works';

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
  static const followInApp = 'Follow with Rohan in the app';
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
