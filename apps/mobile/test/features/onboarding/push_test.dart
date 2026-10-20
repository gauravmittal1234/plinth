import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/core/push/push.dart';

import '../../helpers/app_harness.dart';

/// Push messages are data-only FCM messages carrying a `deep_link`
/// (WORK_BREAKDOWN T48). [Push.openDeepLink] is the real production routing
/// logic `Push.init` calls once a message is opened or arrives in the
/// foreground; a plain `RemoteMessage(data: {...})` drives it directly, with
/// no Firebase plugin involved (the app opens with Firebase absent either
/// way: `Push.init` itself is only ever called through `guarded()`, T06).
void main() {
  testWidgets('a push payload with a deep link navigates there', (tester) async {
    final container = await pumpPlinth(tester);
    final moved = Push.openDeepLink(
      routerOf(container),
      const RemoteMessage(data: {'deep_link': '/gurugram/projects/aurelia-heights-phase-2'}),
    );
    await tester.pumpAndSettle();
    expect(moved, isTrue);
    expect(locationOf(container), Routes.projectOf('aurelia-heights-phase-2'));
  });

  testWidgets('a message with no deep link does nothing', (tester) async {
    final container = await pumpPlinth(tester);
    final before = locationOf(container);
    final moved = Push.openDeepLink(routerOf(container), const RemoteMessage());
    expect(moved, isFalse);
    expect(locationOf(container), before);
  });

  test('deepLinkOf reads data.deep_link, and only that', () {
    expect(Push.deepLinkOf(const RemoteMessage(data: {'deep_link': '/following'})), '/following');
    expect(Push.deepLinkOf(const RemoteMessage(data: {'other': 'x'})), isNull);
    expect(Push.deepLinkOf(const RemoteMessage()), isNull);
  });
}
