"use client";

import {
  type MapClusterPoint,
  MapClusters,
  MapControls,
  type MapLngLat,
  MapMarker,
  MapView,
  mapBoundsOf,
  setMapWorkerUrl,
} from "@nuvui/map";
import { Switch } from "@nuvui/react";
import { useId, useMemo, useState } from "react";
import "./charging-map.scss";

// MapLibre does its work in a file of its own, and has to be told where
// your bundler put it. This is how Next.js is asked. With Vite, import
// the file with `?url` at the end and pass what you get. Once in an app
// is enough, so move it to wherever your app starts.
setMapWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
);

// Where the map's tiles come from and how they're drawn. This one is
// OpenFreeMap's, which asks for no key. Put your own provider's here.
const mapStyle = "https://tiles.openfreemap.org/styles/liberty";

interface Charger extends MapClusterPoint {
  id: string;
  name: string;
  city: string;
  free: number;
}

// Made up, and stands in for the charging points your server has: a few
// around each of four cities, each with four sockets.
const cities: { name: string; at: MapLngLat; count: number }[] = [
  { name: "Amsterdam", at: [4.8952, 52.3702], count: 8 },
  { name: "Groningen", at: [6.5665, 53.2194], count: 6 },
  { name: "Enschede", at: [6.8937, 52.2215], count: 5 },
  { name: "Eindhoven", at: [5.4697, 51.4416], count: 4 },
];
const around: MapLngLat[] = [
  [0, 0],
  [0.012, 0.006],
  [-0.01, 0.009],
  [0.018, -0.008],
  [-0.016, -0.005],
  [0.006, 0.015],
  [-0.004, -0.014],
  [0.022, 0.012],
];
const chargers: Charger[] = cities.flatMap((city) =>
  around.slice(0, city.count).map((offset, index) => ({
    id: `${city.name.toLowerCase()}-${index + 1}`,
    name: `${city.name} ${index + 1}`,
    city: city.name,
    position: [city.at[0] + offset[0], city.at[1] + offset[1]],
    free: (index * 3 + city.count) % 4,
  })),
);

const all = mapBoundsOf(chargers.map((charger) => charger.position));

const sockets = (charger: Charger) =>
  charger.free === 0 ? "All in use" : `${charger.free} of 4 free`;

export default function ChargingMap() {
  const [freeOnly, setFreeOnly] = useState(false);
  // The charging point that's open, in the list and on the map.
  const [chosen, setChosen] = useState<string | null>(null);
  const id = useId();

  const shown = useMemo(
    () =>
      freeOnly ? chargers.filter((charger) => charger.free > 0) : chargers,
    [freeOnly],
  );
  const open = shown.find((charger) => charger.id === chosen);

  return (
    <main className="charging-map">
      <div className="charging-map__side">
        <h1 className="charging-map__title">Charging points</h1>
        <div className="charging-map__filter">
          <label htmlFor={`${id}-free`}>Only with a socket free</label>
          <Switch
            id={`${id}-free`}
            checked={freeOnly}
            onCheckedChange={(next) => {
              setFreeOnly(next);
              setChosen(null);
            }}
          />
        </div>
        <p className="charging-map__count" role="status">
          {shown.length} charging points
        </p>
        <ul className="charging-map__list">
          {shown.map((charger) => (
            <li key={charger.id}>
              <button
                type="button"
                className="charging-map__point"
                aria-pressed={chosen === charger.id}
                onClick={() =>
                  setChosen((now) => (now === charger.id ? null : charger.id))
                }
              >
                <span className="charging-map__name">{charger.name}</span>
                <span className="charging-map__line">{sockets(charger)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <MapView
        className="charging-map__map"
        aria-label="Charging points on a map"
        mapStyle={mapStyle}
        bounds={all}
        boundsPadding={64}
        // One chosen in the list is gone to, near enough that it stands on
        // its own and its popup can open.
        center={open?.position}
        zoom={open ? 15 : undefined}
      >
        <MapClusters
          points={shown}
          clusterLabel={(count) => `${count} charging points`}
        >
          {(charger) => (
            <MapMarker
              position={charger.position}
              label={`${charger.name}, ${sockets(charger).toLowerCase()}`}
              open={chosen === charger.id}
              onOpenChange={(next) => setChosen(next ? charger.id : null)}
              popup={
                <>
                  <strong>{charger.name}</strong>
                  <br />
                  {sockets(charger)}
                </>
              }
            />
          )}
        </MapClusters>
        <MapControls locate />
      </MapView>
    </main>
  );
}
