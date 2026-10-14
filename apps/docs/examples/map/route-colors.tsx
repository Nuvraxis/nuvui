"use client";

import {
  MapControls,
  type MapLngLat,
  MapRoute,
  MapView,
  mapBoundsOf,
} from "@nuvui/map";
import type { CSSProperties } from "react";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up: two lines of a tram, each in its own color.
const lines: { name: string; color: string; way: MapLngLat[] }[] = [
  {
    name: "Line 2",
    color: "var(--color-success)",
    way: [
      [4.8759, 52.3584],
      [4.8829, 52.3622],
      [4.8898, 52.3667],
      [4.8952, 52.3738],
    ],
  },
  {
    name: "Line 12",
    color: "var(--color-danger)",
    way: [
      [4.8721, 52.3721],
      [4.8829, 52.3622],
      [4.8911, 52.3564],
      [4.9021, 52.3524],
    ],
  },
];

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <MapView
        aria-label="Tram lines 2 and 12"
        mapStyle={style}
        bounds={mapBoundsOf(lines.flatMap((line) => line.way))}
        boundsPadding={48}
        cooperativeGestures
      >
        {lines.map((line) => (
          <MapRoute
            key={line.name}
            coordinates={line.way}
            width={5}
            // A color of the theme's, by its variable.
            style={{ "--nuv-map-route-color": line.color } as CSSProperties}
          />
        ))}
        <MapControls />
      </MapView>
      {/* A color on a map says nothing to someone who can't see it, so the
          lines are in words as well. */}
      <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Line 2 runs from Vondelpark to Centraal. Line 12 runs from Westerpark to
        Amstel, and crosses line 2 at Leidseplein.
      </p>
    </div>
  );
}
