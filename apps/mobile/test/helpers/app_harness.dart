import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:plinth/app/app.dart';
import 'package:plinth/app/router.dart';
import 'package:plinth/fixtures/fixture_mode.dart';

/// A phone-sized test window: 360 x 800 dp.
void usePhoneWindow(WidgetTester tester, {double pixelRatio = 3}) {
  tester.view.devicePixelRatio = pixelRatio;
  tester.view.physicalSize = Size(360 * pixelRatio, 800 * pixelRatio);
  addTearDown(tester.view.reset);
}

/// Pumps the whole app in FIXTURES mode, as `main.dart` does, then opens
/// [location] when given. Returns the container to read providers from.
Future<ProviderContainer> pumpPlinth(
  WidgetTester tester, {
  String? location,
  List<Override> overrides = const [],
}) async {
  usePhoneWindow(tester);
  final container = ProviderContainer(overrides: [...fixtureModeOverrides(), ...overrides]);
  addTearDown(container.dispose);
  await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const PlinthApp()));
  await tester.pumpAndSettle();
  if (location != null) {
    container.read(routerProvider).go(location);
    await tester.pumpAndSettle();
  }
  return container;
}

/// Scrolls the page's list until [finder] is built and on screen, then settles,
/// so a tap lands on it rather than on whatever was there before the scroll.
Future<void> scrollIntoView(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(finder, 120);
  await tester.pumpAndSettle();
}

/// The router's current location.
String locationOf(ProviderContainer container) => container.read(routerProvider).state.uri.toString();

/// The route's current GoRouter, for navigation in tests.
GoRouter routerOf(ProviderContainer container) => container.read(routerProvider);
