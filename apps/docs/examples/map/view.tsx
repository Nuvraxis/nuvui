"use client";

import { type MapLngLat, MapView } from "@nuvui/map";
import { Button } from "@nuvui/react";
import { useState } from "react";

const style = "https://tiles.openfreemap.org/styles/liberty";

const cities: Record<string, MapLngLat> = {
  Berlin: [13.405, 52.52],
  Paris: [2.3522, 48.8566],
  Tokyo: [139.6917, 35.6895],
};

export default function Example() {
  const [center, setCenter] = useState<MapLngLat>(cities.Berlin as MapLngLat);
  const [zoom, setZoom] = useState(10);
  const [rested, setRested] = useState("");

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.entries(cities).map(([name, at]) => (
          <Button
            key={name}
            intent="secondary"
            size="sm"
            onClick={() => {
              setCenter(at);
              setZoom(10);
            }}
          >
            {name}
          </Button>
        ))}
      </div>
      <MapView
        aria-label="Cities"
        mapStyle={style}
        center={center}
        zoom={zoom}
        cooperativeGestures
        // Handed back as it moves, the view is the app's to keep: in the
        // address, say, so a link opens the map where it was.
        onMove={(view) => {
          setCenter(view.center);
          setZoom(view.zoom);
        }}
        onMoveEnd={(view) =>
          setRested(
            `${view.center[1].toFixed(3)}, ${view.center[0].toFixed(3)} at zoom ${view.zoom.toFixed(1)}`,
          )
        }
      />
      <p role="status" style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        {rested ? `At rest at ${rested}` : "Not moved yet"}
      </p>
    </div>
  );
}
