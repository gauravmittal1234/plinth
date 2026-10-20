/// Layout copy for AppFollowing (WORK_BREAKDOWN §1 rule 6): the artboard's
/// section headings, field labels and button names. Change lines, band words
/// and summaries are never composed here — they always come from
/// `FollowingFeed` (`api.following_feed`, T17).
///
/// `product/design/artboards/AppFollowing.dc.html` is the source this mirrors.
abstract final class FollowingCopy {
  static const title = 'Following';
  static const alertSettings = 'Alert settings';
  static const familyCirclePrefix = 'Family circle: ';

  // Projects / Updates toggle.
  static const projectsTab = 'Projects';
  static const updatesTab = 'Updates';

  // Projects tab.
  static const howAreProjectsDoing = 'How are your projects doing?';
  static const projectsIntro = 'Newest change first. Tell us where you’ve booked, and see who follows with you.';
  static const imagesIllustrative = 'Bands as of the latest fixture data. Your follow type is private to you.';
  static const change = 'Change';

  // Updates tab.
  static const markTheseAsSeen = 'Mark these as seen';
  static const allSeen = 'All seen';
  static const replayFromAnyDate = 'Replay from any date';
  static const earlier = 'Earlier';
  static const noEarlierUpdates = 'Nothing earlier. Every change on record for your followed projects is listed above.';
  static const footerNote =
      'Alerts are facts from public records. The developer is told at the same time and can respond '
      'publicly. Your family circle gets the same project alerts on their own phones.';
  static const notAvailableInPreview = 'That date is not available in this preview.';

  // Follow-type sheet (G-19).
  static const haveYouBookedHere = 'Have you booked here?';
  static const watchingTitle = 'Just watching';
  static const watchingSub = 'Still deciding on this one.';
  static const watchingItems = [
    'Band changes, at once',
    'QPRs filed, late or missing',
    'Extensions, orders and price lists',
  ];
  static const bookedTitle = 'I’ve booked here';
  static const bookedSub = 'All of that, plus alerts that guard the money you pay.';
  static const bookedItems = [
    'Payment-stage alerts, slab by slab',
    'Demand letters checked against filed slabs',
    'Possession: OC, offers and delay interest',
  ];
  static const typeNotePrivate = 'Your follow type is private. Your family circle doesn’t see it.';
  static const typeNoteSaved = 'Saved. Payment and demand-letter alerts go only to you, never to your family circle.';
  static const done = 'Done';

  // Sign-in.
  static const signInToSeeFollows = 'Sign in to see what you follow and your family circle.';
  static const signIn = 'Sign in';
}
