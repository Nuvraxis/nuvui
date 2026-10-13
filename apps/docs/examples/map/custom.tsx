"use client";

import { MapControls, type MapLngLat, MapMarker, MapView } from "@nuvui/map";
import { Badge } from "@nuvui/react";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up: vans and how many parcels each still has on board.
const vans: { name: string; at: MapLngLat; parcels: number }[] = [
  { name: "Van 12", at: [-0.1276, 51.5072], parcels: 14 },
  { name: "Van 7", at: [-0.0877, 51.5133], parcels: 3 },
  { name: "Van 31", at: [-0.1586, 51.5229], parcels: 22 },
];

export default function Example() {
  return (
    <MapView
      aria-label="Vans on the road"
      mapStyle={style}
      defaultCenter={[-0.12, 51.513]}
      defaultZoom={12}
      cooperativeGestures
    >
      {vans.map((van) => (
        <MapMarker
          key={van.name}
          position={van.at}
          // The name says what the drawing shows, since the drawing isn't read.
          label={`${van.name}, ${van.parcels} parcels on board`}
          anchor="center"
        >
          <Badge>{van.parcels}</Badge>
        </MapMarker>
      ))}
      <MapControls compass locate fullscreen />
    </MapView>
  );
}
