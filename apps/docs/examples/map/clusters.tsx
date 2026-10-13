"use client";

import {
  type MapClusterPoint,
  MapClusters,
  MapControls,
  type MapLngLat,
  MapMarker,
  MapView,
  mapBoundsOf,
} from "@nuvui/map";

const style = "https://tiles.openfreemap.org/styles/liberty";

interface Charger extends MapClusterPoint {
  name: string;
  free: number;
}

// Made up, and stands in for the places your server has: a few charging
// points around each of four cities.
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
    id: `${city.name}-${index + 1}`,
    name: `${city.name} ${index + 1}`,
    position: [city.at[0] + offset[0], city.at[1] + offset[1]],
    free: (index * 3 + city.count) % 4,
  })),
);

const all = mapBoundsOf(chargers.map((charger) => charger.position));

export default function Example() {
  return (
    <MapView
      aria-label="Charging points"
      mapStyle={style}
      bounds={all}
      boundsPadding={64}
      cooperativeGestures
    >
      <MapClusters
        points={chargers}
        clusterLabel={(count) => `${count} charging points`}
      >
        {(charger) => (
          <MapMarker
            position={charger.position}
            label={`${charger.name}, ${charger.free} free`}
            popup={
              <>
                <strong>{charger.name}</strong>
                <br />
                {charger.free === 0
                  ? "All in use"
                  : `${charger.free} of 4 free`}
              </>
            }
          />
        )}
      </MapClusters>
      <MapControls />
    </MapView>
  );
}
