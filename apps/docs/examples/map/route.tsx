"use client";

import {
  MapControls,
  type MapLngLat,
  MapMarker,
  MapRoute,
  MapView,
  mapBoundsOf,
} from "@nuvui/map";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up. The line your routing service gives goes here: this library
// draws a way, and doesn't find one.
const driven: MapLngLat[] = [
  [4.8952, 52.3702],
  [4.8936, 52.3667],
  [4.8905, 52.3631],
  [4.8882, 52.3598],
];
const planned: MapLngLat[] = [
  [4.8882, 52.3598],
  [4.8911, 52.3564],
  [4.8972, 52.3541],
];

const stops: { name: string; at: MapLngLat }[] = [
  { name: "Depot, where the van set out", at: [4.8952, 52.3702] },
  { name: "The van, at Leidseplein", at: [4.8882, 52.3598] },
  { name: "Last stop, Sarphatipark", at: [4.8972, 52.3541] },
];

export default function Example() {
  return (
    <MapView
      aria-label="Van 12 on its round"
      mapStyle={style}
      // Every place on the way, in view.
      bounds={mapBoundsOf([...driven, ...planned])}
      boundsPadding={64}
      cooperativeGestures
    >
      <MapRoute coordinates={driven} />
      <MapRoute coordinates={planned} dashed />
      {stops.map((stop) => (
        <MapMarker key={stop.name} position={stop.at} label={stop.name} />
      ))}
      <MapControls />
    </MapView>
  );
}
