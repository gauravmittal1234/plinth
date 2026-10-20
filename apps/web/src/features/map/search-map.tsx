"use client";

// The shared map (T22, DESIGN §4b "Live strip" sibling; WebSearch.dc.html,
// AppMap.dc.html reuse the same rule): MapLibre GL with open tiles, never
// Google Maps. The fixture world ships `map_tiles` off (INTEGRATION_NOTES), so
// by default this renders the artboard's own "Map placeholder · not to scale"
// state — a real, labelled, keyboard-reachable pin layout, not a screenshot —
// with each pin placed from its project's own `centroid`. When `map_tiles` is
// on, it mounts a real MapLibre GL map (PMTiles when `NEXT_PUBLIC_TILES_URL`
// is set, an empty background style otherwise) and keeps the same pins as
// MapLibre markers, so the one interaction (tap a pin, select a result) never
// changes shape.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CORRIDOR_BOUNDS, projectPct, type LngLat } from "./geo";

/** A canvas-level feature check (maplibre-gl v6 dropped its own `supported()`). */
function canUseWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export type MapPin = {
  slug: string;
  name: string;
  /** The all-in price alone ("₹2.74 Cr"), or null when there is no cost sheet yet. */
  pinLabel: string | null;
  centroid: LngLat | null;
};

export type SearchMapProps = {
  pins: readonly MapPin[];
  selected: string | null;
  onSelect: (slug: string) => void;
  /** "Pins show all-in prices" (SearchResults.legend_line), the server's words. */
  legendLine: string;
  /** `flags().map_tiles`: off in every fixture (INTEGRATION_NOTES). */
  tilesEnabled: boolean;
  className?: string;
};

export function SearchMap({
  pins,
  selected,
  onSelect,
  legendLine,
  tilesEnabled,
  className,
}: SearchMapProps) {
  const located = pins.filter((p): p is MapPin & { centroid: LngLat } => p.centroid !== null);
  return (
    <div className={className}>
      <div
        role="group"
        aria-label="Map of search results"
        className="relative aspect-[4/5] w-full overflow-hidden rounded-panel bg-track sm:aspect-square"
        data-testid="search-map"
      >
        {tilesEnabled ? (
          <LiveMap pins={located} selected={selected} onSelect={onSelect} />
        ) : (
          <PlaceholderMap pins={located} selected={selected} onSelect={onSelect} />
        )}
      </div>
      <p className="mt-3 mb-0 text-caption text-ink2">
        {`${legendLine}. “Quoted” means no cost sheet yet.`}
      </p>
    </div>
  );
}

function Pin({
  pin,
  selected,
  onSelect,
  style,
}: {
  pin: MapPin;
  selected: boolean;
  onSelect: (slug: string) => void;
  style?: CSSProperties;
}) {
  const quoted = pin.pinLabel === null;
  return (
    <button
      type="button"
      onClick={() => onSelect(pin.slug)}
      aria-pressed={selected}
      aria-label={quoted ? `${pin.name}, quoted price not shown as all-in` : `${pin.name}, ${pin.pinLabel}`}
      data-testid="map-pin"
      data-slug={pin.slug}
      style={style}
      className={
        "absolute -translate-x-1/2 -translate-y-full cursor-pointer rounded-pill border-0 px-2.5 py-1.5 text-caption font-semibold whitespace-nowrap transition-[transform,filter] duration-150 ease-out hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus " +
        (selected
          ? "z-10 scale-110 bg-inverse text-on-inverse"
          : quoted
            ? "bg-chip-fill-on-track text-ink2"
            : "bg-chip-fill-on-track text-ink")
      }
    >
      {quoted ? `Quoted ${pin.name}` : pin.pinLabel}
    </button>
  );
}

function PlaceholderMap({
  pins,
  selected,
  onSelect,
}: {
  pins: readonly (MapPin & { centroid: LngLat })[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <>
      <p className="absolute top-3 left-3 m-0 text-caption text-ink2">{"Map placeholder · not to scale"}</p>
      {pins.map((pin) => {
        const { x, y } = projectPct(pin.centroid, CORRIDOR_BOUNDS);
        return (
          <Pin
            key={pin.slug}
            pin={pin}
            selected={pin.slug === selected}
            onSelect={onSelect}
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        );
      })}
    </>
  );
}

/** maplibre-gl loads client-side only (it reaches for `window` at module scope). */
function LiveMap({
  pins,
  selected,
  onSelect,
}: {
  pins: readonly (MapPin & { centroid: LngLat })[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    const markers: import("maplibre-gl").Marker[] = [];
    let cancelled = false;

    void (async () => {
      try {
        if (!canUseWebGL()) {
          setFailed(true);
          return;
        }
        const [{ Map, Marker, addProtocol }] = await Promise.all([
          import("maplibre-gl"),
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]);
        if (cancelled || !container.current) return;
        const tilesUrl = process.env.NEXT_PUBLIC_TILES_URL;
        if (tilesUrl) {
          const { Protocol } = await import("pmtiles");
          addProtocol("pmtiles", new Protocol().tile);
        }
        map = new Map({
          container: container.current,
          style: tilesUrl
            ? {
                version: 8,
                sources: {
                  base: { type: "raster", url: `pmtiles://${tilesUrl}`, tileSize: 256 },
                },
                layers: [{ id: "base", type: "raster", source: "base" }],
              }
            : { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: {} }] },
          center: [
            (CORRIDOR_BOUNDS.west + CORRIDOR_BOUNDS.east) / 2,
            (CORRIDOR_BOUNDS.south + CORRIDOR_BOUNDS.north) / 2,
          ],
          zoom: 10.5,
          attributionControl: tilesUrl ? undefined : false,
        });
        for (const pin of pins) {
          const el = document.createElement("button");
          el.type = "button";
          el.dataset.testid = "map-pin";
          el.dataset.slug = pin.slug;
          el.setAttribute(
            "aria-label",
            pin.pinLabel ? `${pin.name}, ${pin.pinLabel}` : `${pin.name}, quoted price not shown as all-in`,
          );
          el.className =
            "cursor-pointer rounded-pill border-0 bg-chip-fill-on-track px-2.5 py-1.5 text-caption font-semibold text-ink";
          el.textContent = pin.pinLabel ?? `Quoted ${pin.name}`;
          el.addEventListener("click", () => onSelect(pin.slug));
          const marker = new Marker({ element: el, anchor: "bottom" })
            .setLngLat([pin.centroid[0], pin.centroid[1]])
            .addTo(map);
          markers.push(marker);
        }
      } catch {
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      for (const m of markers) m.remove();
      map?.remove();
    };
    // `selected` only restyles existing markers below; it never remounts the map.
  }, [pins, onSelect]);

  if (failed) {
    return <PlaceholderMap pins={pins} selected={selected} onSelect={onSelect} />;
  }
  return <div ref={container} className="absolute inset-0" />;
}
