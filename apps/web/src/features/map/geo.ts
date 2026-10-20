// A plain linear projection for the Gurugram corridor (DESIGN §5b "C-20 · Map
// pins": fictional projects at real, approximate sector positions, lat 28.40–
// 28.54 N, long 76.90–77.06 E). Every project's own [lng, lat] comes from its
// ProjectCard.centroid (the server's words); this just places that point in a
// box, for the no-tiles placeholder (fixture default, `map_tiles` off) and as
// the fallback when a reader's browser can't run MapLibre GL.
export type LngLat = readonly [number, number];

export type Bounds = { west: number; south: number; east: number; north: number };

/** Gurugram + New Gurugram, with margin around every seeded sector (DESIGN §5b). */
export const CORRIDOR_BOUNDS: Bounds = { west: 76.9, south: 28.4, east: 77.06, north: 28.54 };

/** Percent position (0–100) inside `bounds`, y measured from the top (north = 0%). */
export function projectPct(point: LngLat, bounds: Bounds = CORRIDOR_BOUNDS): { x: number; y: number } {
  const [lng, lat] = point;
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return { x: clamp(x), y: clamp(y) };
}

function clamp(pct: number): number {
  return Math.min(96, Math.max(4, pct));
}
