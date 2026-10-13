"use client";

import {
  type MapBounds,
  MapControls,
  type MapLngLat,
  MapMarker,
  MapView,
  setMapWorkerUrl,
} from "@nuvui/map";
import { Input } from "@nuvui/react";
import { useEffect, useId, useMemo, useState } from "react";
import "./branch-finder.scss";

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

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  at: MapLngLat;
}

// Made up, and stands in for the branches your server has.
const branches: Branch[] = [
  {
    id: "amsterdam",
    name: "Amsterdam Centrum",
    address: "Damrak 41, 1012 LK",
    city: "Amsterdam",
    hours: "Open until 18:00",
    at: [4.8952, 52.3759],
  },
  {
    id: "rotterdam",
    name: "Rotterdam Blaak",
    address: "Blaak 16, 3011 TA",
    city: "Rotterdam",
    hours: "Open until 18:00",
    at: [4.4885, 51.9195],
  },
  {
    id: "utrecht",
    name: "Utrecht Vredenburg",
    address: "Vredenburg 9, 3511 BA",
    city: "Utrecht",
    hours: "Open until 20:00",
    at: [5.1143, 52.0926],
  },
  {
    id: "the-hague",
    name: "The Hague Spui",
    address: "Spui 70, 2511 BT",
    city: "The Hague",
    hours: "Closed today",
    at: [4.3166, 52.0767],
  },
  {
    id: "eindhoven",
    name: "Eindhoven Markt",
    address: "Markt 22, 5611 EC",
    city: "Eindhoven",
    hours: "Open until 17:30",
    at: [5.4783, 51.4392],
  },
];

// The area that holds every branch in a list, with a little room where
// the list is one branch and the area would be a point.
function areaOf(list: Branch[]): MapBounds | undefined {
  if (list.length === 0) return undefined;
  const lngs = list.map((branch) => branch.at[0]);
  const lats = list.map((branch) => branch.at[1]);
  const room = list.length === 1 ? 0.02 : 0;
  return [
    [Math.min(...lngs) - room, Math.min(...lats) - room],
    [Math.max(...lngs) + room, Math.max(...lats) + room],
  ];
}

export default function BranchFinder() {
  const [query, setQuery] = useState("");
  // The branch that's open, in the list and on the map.
  const [chosen, setChosen] = useState<string | null>(null);
  const id = useId();

  const found = useMemo(() => {
    const typed = query.trim().toLowerCase();
    if (!typed) return branches;
    return branches.filter((branch) =>
      [branch.name, branch.city, branch.address].some((text) =>
        text.toLowerCase().includes(typed),
      ),
    );
  }, [query]);
  const area = useMemo(() => areaOf(found), [found]);

  // A branch chosen on the map may be out of view in the list.
  useEffect(() => {
    if (!chosen) return;
    document
      .getElementById(`${id}-${chosen}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [chosen, id]);

  return (
    <main className="branch-finder">
      <div className="branch-finder__side">
        <h1 className="branch-finder__title">Find a branch</h1>
        <Input
          type="search"
          aria-label="Search by name, city or street"
          placeholder="Name, city or street"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setChosen(null);
          }}
        />
        <p className="branch-finder__count" role="status">
          {found.length === 0
            ? "No branch matches"
            : found.length === 1
              ? "1 branch"
              : `${found.length} branches`}
        </p>
        <ul className="branch-finder__list">
          {found.map((branch) => (
            <li key={branch.id}>
              <button
                id={`${id}-${branch.id}`}
                type="button"
                className="branch-finder__branch"
                aria-pressed={chosen === branch.id}
                onClick={() =>
                  setChosen((now) => (now === branch.id ? null : branch.id))
                }
              >
                <span className="branch-finder__name">{branch.name}</span>
                <span className="branch-finder__line">{branch.address}</span>
                <span className="branch-finder__line">{branch.hours}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <MapView
        className="branch-finder__map"
        aria-label="Branches on a map"
        mapStyle={mapStyle}
        bounds={area}
        boundsPadding={64}
        maxZoom={16}
      >
        {found.map((branch) => (
          <MapMarker
            key={branch.id}
            position={branch.at}
            label={branch.name}
            open={chosen === branch.id}
            onOpenChange={(open) => setChosen(open ? branch.id : null)}
            popup={
              <>
                <strong>{branch.name}</strong>
                <br />
                {branch.address}
                <br />
                {branch.hours}
              </>
            }
          />
        ))}
        <MapControls locate />
      </MapView>
    </main>
  );
}
