import 'package:flutter_test/flutter_test.dart';
import 'package:plinth/main.dart';

// Placeholder from T00. T06 adds a test that pumps every registered route.
void main() {
  testWidgets('the placeholder app opens', (tester) async {
    await tester.pumpWidget(const PlinthApp());
    expect(find.text('Plinth'), findsOneWidget);
  });
}
