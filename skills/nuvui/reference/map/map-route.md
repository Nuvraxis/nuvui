<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/map/map-route.mdx. Don't edit it here: run `pnpm skill`. -->

# MapRoute

A line on a map through a list of places, for a way that was driven or one that's planned. It's drawn in the theme's colors, with an edge that keeps it seen on a map of any color.

Use a route for a way from one place to another: where a van has been, what a walk covers, which stops a line calls at. It draws the line and doesn't find it. The places come from you, which mostly means from a routing service, your map provider's or another.

```tsx
"use client";

import {
  MapControls,
  type MapLngLat,
  MapMarker,
  MapRoute,
  MapView,
  mapBoundsOf,
} from "@nuvui/map";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up. The line your routing service gives goes here: this library
// draws a way, and doesn't find one.
const driven: MapLngLat[] = [
  [4.8952, 52.3702],
  [4.8936, 52.3667],
  [4.8905, 52.3631],
  [4.8882, 52.3598],
];
const planned: MapLngLat[] = [
  [4.8882, 52.3598],
  [4.8911, 52.3564],
  [4.8972, 52.3541],
];

const stops: { name: string; at: MapLngLat }[] = [
  { name: "Depot, where the van set out", at: [4.8952, 52.3702] },
  { name: "The van, at Leidseplein", at: [4.8882, 52.3598] },
  { name: "Last stop, Sarphatipark", at: [4.8972, 52.3541] },
];

export default function Example() {
  return (
    <MapView
      aria-label="Van 12 on its round"
      mapStyle={style}
      // Every place on the way, in view.
      bounds={mapBoundsOf([...driven, ...planned])}
      boundsPadding={64}
      cooperativeGestures
    >
      <MapRoute coordinates={driven} />
      <MapRoute coordinates={planned} dashed />
      {stops.map((stop) => (
        <MapMarker key={stop.name} position={stop.at} label={stop.name} />
      ))}
      <MapControls />
    </MapView>
  );
}
```

## Install

```sh
pnpm add @nuvui/map maplibre-gl @nuvui/react
```

## Import

```tsx
import { MapRoute, MapView, mapBoundsOf } from "@nuvui/map";
```

A route goes inside a [MapView](map-view.md), which is where the styles, the worker and the provider are covered.

```tsx
<MapView aria-label="The way to the office" mapStyle={style}>
  <MapRoute
    coordinates={[
      [13.3777, 52.5163],
      [13.3888, 52.5105],
      [13.4050, 52.5200],
    ]}
  />
</MapView>
```

`coordinates` is the places the line goes through, in order, each as longitude and then latitude. A straight line is drawn from each to the next, so a way along roads needs a place at every bend, which is what a routing service gives.

## Showing all of it

`mapBoundsOf` takes a list of places and gives back the area that holds them, for the map's `bounds`. With it the map opens on the whole route, whatever size the map is.

```tsx
<MapView
  aria-label="Van 12 on its round"
  mapStyle={style}
  bounds={mapBoundsOf(way)}
  boundsPadding={64}
>
  <MapRoute coordinates={way} />
</MapView>
```

It works on any list of places, so it's also the one for "show every marker".

## Driven and planned

`dashed` draws the line in dashes. Two routes, one after the other, show a way that's part done: the first for what's behind, the second with `dashed` for what's ahead. The example at the top does that.

`width` is how thick the line is, in pixels.

## Colors

The line is the primary color, with an edge in the color that goes on it. Both are CSS variables, `--nuv-map-route-color` and `--nuv-map-route-edge`, and they take a color of the theme's.

```tsx
"use client";

import {
  MapControls,
  type MapLngLat,
  MapRoute,
  MapView,
  mapBoundsOf,
} from "@nuvui/map";
import type { CSSProperties } from "react";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up: two lines of a tram, each in its own color.
const lines: { name: string; color: string; way: MapLngLat[] }[] = [
  {
    name: "Line 2",
    color: "var(--color-success)",
    way: [
      [4.8759, 52.3584],
      [4.8829, 52.3622],
      [4.8898, 52.3667],
      [4.8952, 52.3738],
    ],
  },
  {
    name: "Line 12",
    color: "var(--color-danger)",
    way: [
      [4.8721, 52.3721],
      [4.8829, 52.3622],
      [4.8911, 52.3564],
      [4.9021, 52.3524],
    ],
  },
];

export default function Example() {
  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <MapView
        aria-label="Tram lines 2 and 12"
        mapStyle={style}
        bounds={mapBoundsOf(lines.flatMap((line) => line.way))}
        boundsPadding={48}
        cooperativeGestures
      >
        {lines.map((line) => (
          <MapRoute
            key={line.name}
            coordinates={line.way}
            width={5}
            // A color of the theme's, by its variable.
            style={{ "--nuv-map-route-color": line.color } as CSSProperties}
          />
        ))}
        <MapControls />
      </MapView>
      {/* A color on a map says nothing to someone who can't see it, so the
          lines are in words as well. */}
      <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
        Line 2 runs from Vondelpark to Centraal. Line 12 runs from Westerpark to
        Amstel, and crosses line 2 at Leidseplein.
      </p>
    </div>
  );
}
```

Set them on the route itself with `style` or a `className`, or on anything around the map. They're read when the route is drawn, and again when its props or the page's theme change.

Don't let the color be the only thing that tells two routes apart. Name them in words beside the map.

## Under the place names

A route is drawn over everything in the map's style, names of streets included. `before` takes the name of a layer in the style and draws the route under it, which keeps the names readable over a thick line.

```tsx
<MapRoute coordinates={way} before="road_label" />
```

The names of the layers are the style's own, so they differ from one provider to the next. Your provider's style lists them. A name the style doesn't have leaves the route on top.

## Stops along it

A route has no markers. Put a [MapMarker](map-view.md#markers) at each place that matters: the start, the end, the stops.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `coordinates` (required) | `MapLngLat[]` |  | The places the line goes through, in order. |
| `width` | `number` | `4` | How thick the line is, in pixels. |
| `dashed` | `boolean` | `false` | Draws it in dashes, for a way that's planned and not yet gone. |
| `before` | `string` |  | The name of a layer in the map's style to draw it under, such as the style's first layer of place names. Left out, it's drawn over the map. |

It renders a `span` that isn't drawn, which is where the colors are read from, and takes what a `span` takes, including `ref`, `className` and `style`. The line itself is drawn by MapLibre on the map's canvas.

### mapBoundsOf

```ts
function mapBoundsOf(places: MapLngLat[]): MapBounds | undefined;
```

The south-west and north-east corners of the area that holds every place. An empty list gives `undefined`, which leaves the map where it is.

## Accessibility

A line on a canvas is a picture, and isn't read. Nothing on it takes the focus.

### What the component handles

- The line has an edge in a second color, so it stands off a map of any color.

### What you need to handle

- Say in words what the route shows: where it starts and ends, the stops in order, how far along it is. A list beside the map does it. The [delivery route block](https://nuvui.nuvraxis.com/blocks/data) is a list and a map of the same stops.
- Give the map an `aria-label` that says whose way it is.
- Don't tell routes apart by color alone.

## On small screens

The line is as thick on a phone as on a desk. With `bounds` from `mapBoundsOf`, the whole route is in view at any width.

## CSS variables

The route's variables are in the [MapView](map-view.md#css-variables) page's list with the rest of the map's: `--nuv-map-route-color` and `--nuv-map-route-edge`.

```css
.late {
  --nuv-map-route-color: var(--color-danger);
}
```

## Server components

`MapRoute` starts with `"use client"`. It's drawn once there's a map, which is in a browser, so it isn't in what a server sends.

## Do and don't

**Do**

- Pass the places a routing service gives, with one at every bend.
- Use `dashed` for what's planned, beside a solid line for what's done.
- Put the stops in words beside the map.

**Don't**

- Don't draw a straight line between two towns and call it a way to drive.
- Don't use more colors than someone can keep apart. Past three or four routes, let the reader choose which to show.
