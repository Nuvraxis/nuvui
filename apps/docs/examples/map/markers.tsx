"use client";

import {
  type MapBounds,
  MapControls,
  type MapLngLat,
  MapMarker,
  MapView,
} from "@nuvui/map";
import { useState } from "react";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up, and stands in for the places your server has.
const offices: { name: string; at: MapLngLat; people: number }[] = [
  { name: "Berlin", at: [13.3888, 52.5105], people: 42 },
  { name: "Paris", at: [2.3522, 48.8566], people: 18 },
  { name: "Madrid", at: [-3.7038, 40.4168], people: 9 },
];

// The area that holds them all: its south-west corner and its north-east.
const all: MapBounds = [
  [-3.7038, 40.4168],
  [13.3888, 52.5105],
];

export default function Example() {
  // One popup at a time, which is what `open` is for.
  const [open, setOpen] = useState<string | null>(null);

  return (
    <MapView
      aria-label="Our offices"
      mapStyle={style}
      bounds={all}
      boundsPadding={64}
      cooperativeGestures
    >
      {offices.map((office) => (
        <MapMarker
          key={office.name}
          position={office.at}
          label={`${office.name} office`}
          open={open === office.name}
          onOpenChange={(next) => setOpen(next ? office.name : null)}
          popup={
            <>
              <strong>{office.name}</strong>
              <br />
              {office.people} people
            </>
          }
        />
      ))}
      <MapControls />
    </MapView>
  );
}
