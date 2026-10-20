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

/// The router's current location.
String locationOf(ProviderContainer container) => container.read(routerProvider).state.uri.toString();

/// The route's current GoRouter, for navigation in tests.
GoRouter routerOf(ProviderContainer container) => container.read(routerProvider);
