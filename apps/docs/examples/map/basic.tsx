"use client";

import { MapControls, MapMarker, MapView } from "@nuvui/map";

// A style is where the tiles come from and how they're drawn. This one is
// OpenFreeMap's, which asks for no key. Use your own provider's.
const style = "https://tiles.openfreemap.org/styles/liberty";

export default function Example() {
  return (
    <MapView
      aria-label="Where the Berlin office is"
      mapStyle={style}
      defaultCenter={[13.3888, 52.5105]}
      defaultZoom={13}
      cooperativeGestures
    >
      <MapMarker
        position={[13.3888, 52.5105]}
        label="Berlin office"
        popup={
          <>
            <strong>Berlin office</strong>
            <br />
            Friedrichstraße 68, open nine to five
          </>
        }
      />
      <MapControls />
    </MapView>
  );
}
