"use client";

import { MapControls, type MapLngLat, MapMarker, MapView } from "@nuvui/map";
import { useState } from "react";

const style = "https://tiles.openfreemap.org/styles/liberty";

export default function Example() {
  const [at, setAt] = useState<MapLngLat>([4.9041, 52.3676]);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <MapView
        aria-label="Where to deliver"
        mapStyle={style}
        defaultCenter={at}
        defaultZoom={14}
        cooperativeGestures
      >
        <MapMarker
          position={at}
          label="Delivery point. Drag it, or move it with the arrow keys"
          draggable
          onPositionChange={setAt}
        />
        <MapControls />
      </MapView>
      <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Deliver to {at[1].toFixed(5)}, {at[0].toFixed(5)}
      </p>
    </div>
  );
}
