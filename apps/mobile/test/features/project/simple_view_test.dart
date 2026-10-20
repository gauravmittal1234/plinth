import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/app/routes.dart';
import 'package:plinth/features/project/simple/project_tts.dart';

import '../../helpers/app_harness.dart';
import 'project_test_helpers.dart';

/// Simple view's "Read this aloud" (G-27): it steps through its 6 blocks
/// with a fake voice, highlighting the one being read, and stops mid-sentence
/// on tap.
void main() {
  testWidgets('reads through its 6 blocks in order, one per tap-free step', (tester) async {
    final tts = FakeProjectTts();
    await pumpPlinth(
      tester,
      location: Routes.projectOf('aurelia-heights-phase-2'),
      overrides: [projectTtsProvider.overrideWithValue(tts)],
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Simple view'));
    await tester.pumpAndSettle();

    await tester.tap(find.textContaining('Read this aloud'));
    await tester.pump();
    expect(tts.spoken, hasLength(1));
    expect(tts.spoken.first, contains('Delivery risk: Elevated'));

    for (var expected = 2; expected <= 6; expected++) {
      tts.resolveNext();
      await tester.pump();
      expect(tts.spoken, hasLength(expected));
    }

    // The 6th (last) block speaks, then the reader settles back to idle.
    tts.resolveNext();
    await tester.pumpAndSettle();
    expect(find.textContaining('Read this aloud'), findsOneWidget);
    expect(find.textContaining('Stop reading'), findsNothing);
  });

  testWidgets('a tap mid-sentence stops the voice and clears the highlight', (tester) async {
    final tts = FakeProjectTts();
    await pumpPlinth(
      tester,
      location: Routes.projectOf('aurelia-heights-phase-2'),
      overrides: [projectTtsProvider.overrideWithValue(tts)],
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Simple view'));
    await tester.pumpAndSettle();

    await tester.tap(find.textContaining('Read this aloud'));
    await tester.pump();
    expect(tts.spoken, hasLength(1));

    await tester.tap(find.textContaining('Stop reading'));
    await tester.pumpAndSettle();
    expect(tts.stopped, isTrue, reason: 'stop() reached the fake voice');
    expect(find.textContaining('Read this aloud'), findsOneWidget, reason: 'back to idle, not "Stop reading"');
    // stop() resolves the block that was mid-sentence; the reader must not
    // treat that as "finished, carry on" and speak a 2nd block.
    expect(tts.spoken, hasLength(1));
  });
}
