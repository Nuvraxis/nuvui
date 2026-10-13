# @nuvui/map

A map for [`@nuvui/react`](https://www.npmjs.com/package/@nuvui/react), on MapLibre.

This is early: the package isn't on npm yet, and before 1.0 a minor version may rename or remove things. The [changelog](https://nuvui.nuvraxis.com/docs/changelog) says where one does, and the [repository README](https://github.com/Nuvraxis/nuvui#readme) says where things stand.

```sh
pnpm add @nuvui/map maplibre-gl @nuvui/react
```

```tsx
"use client";

import "@nuvui/react/styles.css";
import "@nuvui/map/styles.css";
import { MapControls, MapMarker, MapView, setMapWorkerUrl } from "@nuvui/map";

// Where MapLibre's worker is. This is how Next.js and webpack are asked.
// With Vite, import the file with `?url` at the end and pass what you get.
setMapWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
);

export function Office() {
  return (
    <MapView
      aria-label="Where the office is"
      mapStyle="https://tiles.example.com/styles/streets.json"
      defaultCenter={[13.405, 52.52]}
      defaultZoom={12}
    >
      <MapMarker
        position={[13.405, 52.52]}
        label="Berlin office"
        popup="Friedrichstraße 68, open nine to five"
      />
      <MapControls />
    </MapView>
  );
}
```

## Say where the worker is

MapLibre does its work in a worker, which is a file of its own, and looks for it beside itself. A bundler leaves nothing beside it, so a bundled app calls `setMapWorkerUrl` once, before a map is drawn, with the address its bundler gives `maplibre-gl/dist/maplibre-gl-worker.mjs`. Without it the map stays on "Loading map". The [docs](https://nuvui.nuvraxis.com/docs/map) have it for Next.js and for Vite.

## You bring the map

A map is drawn from tiles, and tiles are served by someone. This package has no tiles and no provider: `mapStyle` takes the address of a MapLibre style, or the style itself, and whoever serves it is your provider. That's a choice with a cost, in money or in a server of your own, and with terms about how their names are shown. The names are drawn on the map from what the style says, at every width.

A reader's browser asks the provider for the tiles, so the provider sees their address and what they looked at. Say so where you say such things.

## What's in it

- `MapView`: the map. `defaultCenter` and `defaultZoom` are where it begins, or `bounds` an area to show all of. `center` and `zoom` move it when they change, and `onMove` says where it is.
- `MapMarker`: a place on it, drawn as a pin or as what you give it. It has a name that's read in place of the drawing. With `popup` it's a button that opens one, and with `draggable` it's moved by pointer or by the arrow keys.
- `MapPopup`: a box that points at a place, for one that no marker opens.
- `MapControls`: buttons to zoom, to turn north back up, to go to where the reader is and to fill the screen. They're the core's buttons.
- `useMap`: the MapLibre map itself, for layers, sources and events the props don't cover.

## How it behaves

The map is one stop for the Tab key: the arrow keys move it, and plus and minus zoom it. Each marker that does something is a button and a stop of its own, in the order they're written.

Until the style has come the box says the map is loading, and where the browser can't draw a map, which needs WebGL, it says so and `onError` is called.

In a page that scrolls, `cooperativeGestures` leaves the wheel and one finger to the page.

MapLibre is loaded when a map is first drawn, and not before, so a server renders the box and no map. It's about 235 kB compressed, and its worker another 120 kB. The rest of this package is about 4 kB.

## Dependencies

`@nuvui/react` is a peer dependency: the controls are its buttons, and the map is drawn with its tokens.

The map is drawn by [MapLibre GL JS](https://maplibre.org), which is BSD-3-Clause. It's a peer dependency as well, version 6.4.1 or newer: you install it, so its worker is a file your app can reach, and its security fixes are yours to take when they come. Its stylesheet isn't needed: the rules of it that a map can't do without are in this package's, in the library's colors.

It's a package of its own so that an app with no map doesn't install one.

The docs are at https://nuvui.nuvraxis.com/docs/map.

## License

MIT
