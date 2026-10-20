import 'dart:io';

import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:plinth_contracts/plinth_contracts.dart' show ProjectCard;

// AppMap's background canvas (T30 Build line: "maplibre_gl with a no-basemap
// style in fixtures").
//
// PMTiles handoff: `maplibre_gl` 0.27.1's Dart API documents a custom
// `addProtocol` hook (`MapLibreMap.waitForMap`) for the **web** target only;
// `maplibre_gl_platform_interface`'s source properties say native (Android,
// iOS) tile/raster/vector sources accept only `http:`/`https:` URLs. So a
// `pmtiles://` style source cannot be read directly by the Flutter app on
// Android today (this app ships Android only; AGENTS.md §3). Flagged as a
// Handoff in the PR: BUILD_PLAN §5 already names the fallback ("if it falls
// short, we pre-extract z/x/y tiles to Storage"). Fixtures never load live
// tiles, so [noBasemapStyle] covers this screen either way until that lands.

/// True under `flutter test` (the harness sets this; see
/// `package:flutter_test/src/_binding_io.dart`). No platform view host
/// exists there, so the real native map would throw when a test disposes it
/// (`MapLibreMethodChannel._channel` is never set without one). Any test
/// that opens this screen gets the plain [MapSurfacePlaceholder] instead.
bool get isUnderFlutterTest {
  try {
    final value = Platform.environment['FLUTTER_TEST'];
    return value != null && value != 'false';
  } on Object {
    return false;
  }
}

/// A style with no basemap tiles: background only (DESIGN: fixtures never
/// fetch map tiles).
const noBasemapStyle = '{"version":8,"sources":{},"layers":[]}';

/// The map's background canvas: the real MapLibre surface, or (under
/// `flutter test`) a plain stand-in, so no test needs a platform view host.
Widget buildMapSurface(BuildContext context, {required CameraPosition initialCamera}) {
  if (isUnderFlutterTest) return const MapSurfacePlaceholder();
  return MapLibreMap(
    initialCameraPosition: initialCamera,
    styleString: noBasemapStyle,
    compassEnabled: false,
    logoEnabled: false,
    myLocationEnabled: false,
  );
}

/// What [buildMapSurface] shows under `flutter test`. A named type (rather
/// than a bare `SizedBox`) so a widget test can find it without reaching for
/// the real map.
class MapSurfacePlaceholder extends StatelessWidget {
  const MapSurfacePlaceholder({super.key});

  @override
  Widget build(BuildContext context) => const ColoredBox(color: Colors.transparent);
}

/// A lon/lat box over a set of cards' centroids, for placing pins on
/// [buildMapSurface] without a basemap to project against (illustrative, not
/// a real map projection).
@immutable
class MapBounds {
  const MapBounds({required this.west, required this.east, required this.south, required this.north});

  /// Gurugram, when no card has a centroid.
  factory MapBounds.of(Iterable<ProjectCard> cards, {double pad = 0.01}) {
    final points = <List<double>>[];
    for (final card in cards) {
      final c = card.centroid;
      if (c != null && c.length == 2) points.add(c);
    }
    if (points.isEmpty) return const MapBounds(west: 76.9, east: 77.1, south: 28.4, north: 28.55);
    var west = points.first[0];
    var east = points.first[0];
    var south = points.first[1];
    var north = points.first[1];
    for (final p in points.skip(1)) {
      if (p[0] < west) west = p[0];
      if (p[0] > east) east = p[0];
      if (p[1] < south) south = p[1];
      if (p[1] > north) north = p[1];
    }
    return MapBounds(west: west - pad, east: east + pad, south: south - pad, north: north + pad);
  }

  final double west;
  final double east;
  final double south;
  final double north;

  double get centerLon => (west + east) / 2;
  double get centerLat => (south + north) / 2;

  /// [centroid] (`[lon, lat]`) as a point in [size], north up and inset so a
  /// pin never sits flush against the edge.
  Offset project(List<double> centroid, Size size) {
    final spanLon = (east - west).abs() < 0.0001 ? 0.0001 : east - west;
    final spanLat = (north - south).abs() < 0.0001 ? 0.0001 : north - south;
    final fx = _clamp01((centroid[0] - west) / spanLon);
    final fy = _clamp01(1 - (centroid[1] - south) / spanLat);
    const inset = 0.1;
    return Offset((inset + fx * (1 - 2 * inset)) * size.width, (inset + fy * (1 - 2 * inset)) * size.height);
  }

  static double _clamp01(double v) => v < 0 ? 0 : (v > 1 ? 1 : v);
}
