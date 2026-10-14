"use client";

import {
  MapControls,
  type MapLngLat,
  MapMarker,
  MapRoute,
  MapView,
  mapBoundsOf,
  setMapWorkerUrl,
} from "@nuvui/map";
import { Badge } from "@nuvui/react";
import { useState } from "react";
import "./delivery-route.scss";

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

type State = "done" | "next" | "planned";

interface Stop {
  id: string;
  name: string;
  address: string;
  time: string;
  state: State;
  at: MapLngLat;
}

// Made up, and stands in for the round your server has.
const stops: Stop[] = [
  {
    id: "depot",
    name: "Depot",
    address: "Westerdoksdijk 40",
    time: "Left at 08:30",
    state: "done",
    at: [4.8936, 52.3852],
  },
  {
    id: "bakery",
    name: "Bakkerij Noord",
    address: "Haarlemmerstraat 62",
    time: "Delivered at 08:47",
    state: "done",
    at: [4.8903, 52.3806],
  },
  {
    id: "pharmacy",
    name: "Apotheek Jordaan",
    address: "Westerstraat 180",
    time: "Delivered at 09:12",
    state: "done",
    at: [4.8813, 52.3789],
  },
  {
    id: "bookshop",
    name: "Boekhandel Spui",
    address: "Spui 14",
    time: "Due at 09:40",
    state: "next",
    at: [4.8897, 52.3688],
  },
  {
    id: "florist",
    name: "Bloemen aan de Amstel",
    address: "Amstel 51",
    time: "Due at 10:05",
    state: "planned",
    at: [4.9003, 52.3667],
  },
  {
    id: "cafe",
    name: "Café De Pijp",
    address: "Ferdinand Bolstraat 24",
    time: "Due at 10:30",
    state: "planned",
    at: [4.8917, 52.3571],
  },
];

// The line your routing service gives goes here, with a place at every
// bend. This one goes straight from stop to stop.
const reached = stops.findIndex((stop) => stop.state === "next");
const driven = stops.slice(0, reached).map((stop) => stop.at);
const ahead = stops.slice(reached - 1).map((stop) => stop.at);
const all = mapBoundsOf(stops.map((stop) => stop.at));

const words: Record<State, string> = {
  done: "Done",
  next: "Next",
  planned: "Planned",
};
const intents = {
  done: "success",
  next: "primary",
  planned: "neutral",
} as const;

export default function DeliveryRoute() {
  // The stop that's open, in the list and on the map.
  const [chosen, setChosen] = useState<string | null>(null);
  const done = stops.filter((stop) => stop.state === "done").length;

  return (
    <main className="delivery-route">
      <div className="delivery-route__side">
        <header className="delivery-route__head">
          <h1 className="delivery-route__title">Van 12, morning round</h1>
          <p className="delivery-route__summary">
            {done} of {stops.length} stops done. Next is {stops[reached]?.name}.
          </p>
        </header>
        <ol className="delivery-route__stops" aria-label="Stops">
          {stops.map((stop, index) => (
            <li key={stop.id}>
              <button
                type="button"
                className="delivery-route__stop"
                aria-pressed={chosen === stop.id}
                onClick={() =>
                  setChosen((now) => (now === stop.id ? null : stop.id))
                }
              >
                <span
                  className="delivery-route__number"
                  data-state={stop.state}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="delivery-route__text">
                  <span className="delivery-route__name">{stop.name}</span>
                  <span className="delivery-route__line">{stop.address}</span>
                  <span className="delivery-route__line">{stop.time}</span>
                </span>
                <Badge intent={intents[stop.state]} variant="outline">
                  {words[stop.state]}
                </Badge>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <MapView
        className="delivery-route__map"
        aria-label="Van 12's round on a map"
        mapStyle={mapStyle}
        bounds={all}
        boundsPadding={64}
        maxZoom={16}
      >
        {/* Solid for what's behind the van, dashes for what's ahead. */}
        <MapRoute coordinates={driven} />
        <MapRoute coordinates={ahead} dashed />
        {stops.map((stop, index) => (
          <MapMarker
            key={stop.id}
            position={stop.at}
            anchor="center"
            // The number isn't read, so the name says it.
            label={`Stop ${index + 1}, ${stop.name}, ${words[stop.state].toLowerCase()}`}
            open={chosen === stop.id}
            onOpenChange={(open) => setChosen(open ? stop.id : null)}
            popup={
              <>
                <strong>{stop.name}</strong>
                <br />
                {stop.address}
                <br />
                {stop.time}
              </>
            }
          >
            <span className="delivery-route__pin" data-state={stop.state}>
              {index + 1}
            </span>
          </MapMarker>
        ))}
        <MapControls />
      </MapView>
    </main>
  );
}
