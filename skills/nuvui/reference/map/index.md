<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/map/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Map

The @nuvui/map package. A map on MapLibre, installed next to @nuvui/react, with markers and popups that are React elements and controls that are the library's own buttons. It needs map tiles from a provider you choose.

The map is a package of its own, `@nuvui/map`, since drawing one needs an engine the core doesn't have:

| Component | What it is |
| --- | --- |
| [MapView](map-view.md) | A map, with `MapMarker` for a place on it, `MapPopup` for a box that points at one, and `MapControls` for the buttons over it. |
| [MapRoute](map-route.md) | A line through a list of places, for a way that was driven or one that's planned. |
| [MapClusters](map-clusters.md) | Many places, gathered into one button with a number on it where they're near each other. |

```tsx
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
```

## Install

```sh
pnpm add @nuvui/map maplibre-gl @nuvui/react
```

`@nuvui/react` is a peer dependency: the controls are the core's [Button](../components/button.md), and the map's box, its markers and its popups are drawn with the core's tokens.

The map is drawn by [MapLibre GL JS](https://maplibre.org), which is BSD-3-Clause licensed. It's a peer dependency too, version 6.4.1 or newer, so it's yours to install and to keep up to date, and its worker is a file your app can reach.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/map/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The map's styles are also on their own, at `@nuvui/map/css/map.css`. With that one, load `button.css` from `@nuvui/react/css/` as well.

MapLibre has a stylesheet of its own, and you don't load it. The rules of it that a map can't do without are in this package's stylesheet, in the library's colors.

## Tell the map where its worker is

MapLibre does its work off the page's own thread, in a worker, and the worker is a file of its own: `maplibre-gl/dist/maplibre-gl-worker.mjs`. MapLibre looks for it beside itself. A bundler folds MapLibre into a file of the bundler's naming and leaves nothing beside it, so an app that's built with one says where the worker is, once, before a map is drawn. `setMapWorkerUrl` takes the address, and your bundler is asked for it.

With Next.js, or webpack:

```tsx title="components/map-worker.ts"
"use client";

import { setMapWorkerUrl } from "@nuvui/map";

setMapWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
);
```

With Vite:

```tsx title="src/main.tsx"
import { setMapWorkerUrl } from "@nuvui/map";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setMapWorkerUrl(workerUrl);
```

Either way the bundler copies the file into what it builds and hands back where it put it. Run this from a file that's loaded before any map is, such as the one your app starts in, or one that your own map component imports.

Without it, a map in a bundled app stays on "Loading map".

Whatever serves your site has to send that file as JavaScript. A browser won't run a worker that's sent as anything else, and some servers don't know the ending `.mjs`. If the map never loads once the site is up, look at what the worker's address is sent as.

## You bring the map

A map is drawn from tiles, small squares of it that are fetched as the map moves, and tiles are served by someone. This package has no tiles and no provider. `mapStyle` takes the address of a [MapLibre style](https://maplibre.org/maplibre-style-spec/), which says where the tiles come from and how they're drawn, or the style itself.

```tsx
<MapView mapStyle="https://tiles.example.com/styles/streets.json" />
```

Who serves the style is your provider, and that's a choice:

- **It has a cost.** A provider charges by how much map is looked at, or gives some away, or you run a tile server of your own. Read their terms before a map is on a page that many people open.
- **Their names are shown.** Most terms ask that the provider, and the people whose data it is, are named on the map. The names come from the style and are drawn in the map's corner at every width. Don't hide them.
- **They see the reader.** A reader's browser asks the provider for the tiles, so the provider learns the reader's address and what part of the world they looked at. Say so where you say such things, such as in a privacy notice.

The examples on these pages use [OpenFreeMap](https://openfreemap.org)'s style, which asks for no key. So opening one of these pages asks OpenFreeMap for tiles.

## It's large, so it's loaded when it's needed

MapLibre is about 235 kB compressed, and its worker another 120 kB. The package asks for MapLibre when a map is first drawn, and not before, so a page with no map on screen loads neither and a server never does. The rest of the package is about 6 kB.

Until MapLibre and the style have come, the box says the map is loading.

## What a browser needs

- **WebGL.** A map is drawn with it. Where a browser has none, or it's turned off, the box says the map couldn't be drawn, and `onError` is called. Give the address in words as well where the place matters.
- **A content security policy,** if you have one, has to let the map work. The worker is a file on your own site, so `worker-src 'self'` covers it. Served from another origin, such as a CDN, MapLibre runs it from a `blob:` address, and it needs `worker-src blob:`. `connect-src` and `img-src` have to name your provider.

## What it leaves out

- **Tiles, and a default style.** See above.
- **Finding a place from words,** and directions between two. Those are services, from your provider or another. [MapRoute](map-route.md) draws the way such a service gives.
- **Drawing on the map,** such as an area to search in.
- **A picture of a map** for where there's no WebGL, or for print.
