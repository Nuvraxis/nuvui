<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/map/map-view.mdx. Don't edit it here: run `pnpm skill`. -->

# MapView

A map on MapLibre, with markers that are read by name, popups, and controls that are the library's own buttons. It takes the arrow keys, says when it's loading, and says when it can't be drawn.

Use a map where the place is the point: where an office is, where a van is now, which branch is nearest. For an address that only has to be read, write the address. A map is large to load and takes a provider to draw.

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

## Import

```tsx
import { MapControls, MapMarker, MapPopup, MapView } from "@nuvui/map";
```

The styles come from `@nuvui/map/styles.css`, which you load once for the whole app, after `@nuvui/react/styles.css`. [Map](index.md) covers that, and two things a map needs before it's drawn: [where MapLibre's worker is](index.md#tell-the-map-where-its-worker-is), and where its tiles come from, which is yours to choose.

```tsx
<MapView
  aria-label="Where the office is"
  mapStyle="https://tiles.example.com/styles/streets.json"
  defaultCenter={[13.3888, 52.5105]}
  defaultZoom={13}
>
  <MapMarker position={[13.3888, 52.5105]} label="Berlin office" />
  <MapControls />
</MapView>
```

A place is written as longitude and then latitude, which is the order GeoJSON and MapLibre have, and the other way round from how coordinates are often said.

## Where the map is

`defaultCenter` and `defaultZoom` are where it begins. Zoom 0 is the whole world, 10 a city, and 15 a few streets.

`bounds` is an area to show all of, by its south-west and north-east corners, in place of a center and a zoom. The map fits it when first drawn and again when it changes, with `boundsPadding` pixels of room around it. It's the one to use for "show every marker", and `mapBoundsOf` works it out from a list of places.

```tsx
"use client";

import {
  type MapBounds,
  MapControls,
  type MapLngLat,
  MapMarker,
  MapView,
} from "@nuvui/map";
import { useState } from "react";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up, and stands in for the places your server has.
const offices: { name: string; at: MapLngLat; people: number }[] = [
  { name: "Berlin", at: [13.3888, 52.5105], people: 42 },
  { name: "Paris", at: [2.3522, 48.8566], people: 18 },
  { name: "Madrid", at: [-3.7038, 40.4168], people: 9 },
];

// The area that holds them all: its south-west corner and its north-east.
const all: MapBounds = [
  [-3.7038, 40.4168],
  [13.3888, 52.5105],
];

export default function Example() {
  // One popup at a time, which is what `open` is for.
  const [open, setOpen] = useState<string | null>(null);

  return (
    <MapView
      aria-label="Our offices"
      mapStyle={style}
      bounds={all}
      boundsPadding={64}
      cooperativeGestures
    >
      {offices.map((office) => (
        <MapMarker
          key={office.name}
          position={office.at}
          label={`${office.name} office`}
          open={open === office.name}
          onOpenChange={(next) => setOpen(next ? office.name : null)}
          popup={
            <>
              <strong>{office.name}</strong>
              <br />
              {office.people} people
            </>
          }
        />
      ))}
      <MapControls />
    </MapView>
  );
}
```

## Moving it from your code

`center` and `zoom` move the map when they change. `onMove` is called as the map moves, with where it is, and `onMoveEnd` when it's come to rest.

```tsx
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
```

The map isn't held still by `center`: someone can always drag it. Hand what `onMove` gives back to `center` and `zoom` when the view is yours to keep, in the address bar for one. Handed back, it doesn't move the map again.

## Markers

A `MapMarker` is a place on the map. `label` is its name, which is read in place of the drawing, so say what's there: "Berlin office", and not "marker".

Without anything to do, a marker is a picture. With `popup`, `onClick` or `draggable`, it's a button, and a stop for the Tab key.

### With a popup

`popup` is what opens over the marker when it's pressed. The popup is named for the marker, the focus goes into it, and Escape or its button closes it and puts the focus back. A press on the map, or on another marker, closes it too.

`open` with `onOpenChange` is for keeping it yourself, for opening a marker from outside the map, such as from a list beside it, or for knowing which is open. The example under [Where the map is](#where-the-map-is) keeps it. A popup that your code opens, or that's open with the page through `defaultOpen`, leaves the focus where it is.

### Drawn your way

Children are drawn in place of the pin. `anchor` says which part of the marker is on the place: the middle of its foot, which is right for a pin, or `"center"`, which is right for a dot or a badge.

```tsx
"use client";

import { MapControls, type MapLngLat, MapMarker, MapView } from "@nuvui/map";
import { Badge } from "@nuvui/react";

const style = "https://tiles.openfreemap.org/styles/liberty";

// Made up: vans and how many parcels each still has on board.
const vans: { name: string; at: MapLngLat; parcels: number }[] = [
  { name: "Van 12", at: [-0.1276, 51.5072], parcels: 14 },
  { name: "Van 7", at: [-0.0877, 51.5133], parcels: 3 },
  { name: "Van 31", at: [-0.1586, 51.5229], parcels: 22 },
];

export default function Example() {
  return (
    <MapView
      aria-label="Vans on the road"
      mapStyle={style}
      defaultCenter={[-0.12, 51.513]}
      defaultZoom={12}
      cooperativeGestures
    >
      {vans.map((van) => (
        <MapMarker
          key={van.name}
          position={van.at}
          // The name says what the drawing shows, since the drawing isn't read.
          label={`${van.name}, ${van.parcels} parcels on board`}
          anchor="center"
        >
          <Badge>{van.parcels}</Badge>
        </MapMarker>
      ))}
      <MapControls compass locate fullscreen />
    </MapView>
  );
}
```

What's drawn isn't read, so put what it shows in `label` as well.

### One that's moved

With `draggable`, a marker is dragged with a pointer or a finger, and moved with the arrow keys when the focus is on it: ten pixels a press, fifty with Shift. `onPositionChange` is called with where it was put.

```tsx
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
```

Say in its `label` that it can be moved, since nothing else tells someone who doesn't see it.

## A popup of its own

`MapPopup` is a box that points at a place, for one that no marker opens: where the map was pressed, or what a search found. It's there while it's rendered, and `onClose` asks you to take it away. The focus goes into it when it opens, unless `autoFocus` is off.

```tsx
{found && (
  <MapPopup
    position={found.at}
    aria-label={found.name}
    onClose={() => setFound(null)}
  >
    {found.name}
  </MapPopup>
)}
```

## Controls

`MapControls` is a column of buttons in a corner of the map. They're the core's buttons, so they're in your theme.

- `zoom`, on by default: zoom in and zoom out, each disabled when there's no further to go.
- `compass`: turns north back up, and shows which way north is.
- `locate`: goes to where the reader is, which the browser asks them to allow, and marks it. When the browser won't say, that's said to a screen reader. `onLocate` is called with the place.
- `fullscreen`: fills the screen with the map. It's left out where the browser can't, which is on an iPhone.

`position` is the corner, and children are buttons of your own, after the others.

## In a page that scrolls

A map takes the mouse wheel to zoom and a finger to move, which is how someone scrolling down a page gets stuck in one. `cooperativeGestures` leaves both to the page: the map zooms with <kbd>Ctrl</kbd> or <kbd>⌘</kbd> held and moves under two fingers, and says so over itself when the wheel or one finger is tried. The examples on this page have it.

Leave it off where the map is the page, as in a screen that's a map from edge to edge.

## Loading, and when there's no map

Until MapLibre and the style have come, the box says "Loading map". When the map can't be drawn, because the browser has no WebGL or the style can't be had, the box says so and `onError` is called with the error. `onError` is also called for a tile that can't be had, which leaves the map standing.

Where the place matters, don't let the map be the only way to learn it. Write the address beside it.

## The map itself

`useMap` gives a component inside a `MapView` the MapLibre map, for what the props don't cover: a layer of your own, a source, the map's own events.

```tsx
function Outline({ area }: { area: GeoJSON.Feature }) {
  const map = useMap();

  useEffect(() => {
    // A style that's still on its way can't be added to.
    if (!map.isStyleLoaded()) return;
    map.addSource("area", { type: "geojson", data: area });
    map.addLayer({ id: "area", type: "line", source: "area" });
    return () => {
      map.removeLayer("area");
      map.removeSource("area");
    };
  }, [map, area]);

  return null;
}
```

`onLoad` hands over the same map, once its style and first tiles have come. What you do with it is MapLibre's API and not this library's, so a major version of MapLibre may change it.

## Props

### MapView

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `mapStyle` (required) | `MapStyle` |  | The map's style, which says where its tiles come from and how they're drawn: the address of a style, or the style itself. Whoever serves it is the map's provider, and that's yours to choose. |
| `center` | `MapLngLat` |  | The middle of the map, when you keep it. The map moves there when it changes. |
| `defaultCenter` | `MapLngLat` | `[0, 20]` | The middle of the map to begin with. |
| `zoom` | `number` |  | How far in the map is, when you keep it. 0 is the whole world. |
| `defaultZoom` | `number` | `1` | How far in the map is to begin with. |
| `bounds` | `MapBounds` |  | An area to show all of. The map fits it when first drawn, in place of the center and the zoom, and again when it changes. |
| `boundsPadding` | `number` | `48` | The room left around `bounds`, in pixels. |
| `minZoom` | `number` |  |  |
| `maxZoom` | `number` |  |  |
| `interactive` | `boolean` | `true` | Whether the map can be moved, by pointer, touch and keys. Read when the map is first drawn. |
| `cooperativeGestures` | `boolean` | `false` | Leaves the wheel and one finger to the page: the map zooms with Ctrl or ⌘ held, and moves under two fingers. For a map in a page that scrolls. Read when the map is first drawn. |
| `onMove` | `((view: MapViewState) => void)` |  | Called as the map moves, with where it is. |
| `onMoveEnd` | `((view: MapViewState) => void)` |  | Called when the map has come to rest. |
| `onLoad` | `((map: MapInstance) => void)` |  | Called once, when the style and the first tiles have come. |
| `onError` | `((error: Error) => void)` |  | Called when the map can't be drawn, or a tile or the style can't be had. |
| `labels` | `MapLabels` |  | The map's own words, for another language. Read when the map is first drawn. |

It's a `div`, and takes what a `div` takes, including `ref`, `className` and `style`. `aria-label` is the map's name.

### MapMarker

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `position` (required) | `MapLngLat` |  | Where it is. |
| `label` (required) | `string` |  | What it marks, such as "Berlin office". It's the marker's name, read in place of the drawing. |
| `anchor` | `"bottom" \| "center"` | `"bottom"` | The part of the marker that's on the place: the middle of its foot, for a pin, or its own middle, for a dot. |
| `draggable` | `boolean` | `false` | Whether it can be moved, by dragging it or with the arrow keys. |
| `onPositionChange` | `((position: MapLngLat) => void)` |  | Called when it's been moved, with where it was put. |
| `popup` | `ReactNode` |  | What opens over the marker when it's pressed. |
| `open` | `boolean` |  | Whether the popup is open, when you keep it. Use it with `onOpenChange`. |
| `defaultOpen` | `boolean` | `false` | Whether the popup is open to begin with. |
| `onOpenChange` | `((open: boolean) => void)` |  | Called when the popup opens or closes. |
| `children` | `ReactNode` |  | The marker's drawing, in place of the pin. |

It takes what a `button` takes, including `ref`, `className` and `onClick`. An `onClick` that calls `preventDefault()` leaves the popup closed.

### MapPopup

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `position` (required) | `MapLngLat` |  | The place it points at. |
| `onClose` | `(() => void)` |  | Called when it's closed: by its button, by Escape, or by a press on the map. |
| `offset` | `Offset` | `0` | How far it stands off the place, in pixels. |
| `closeOnMapClick` | `boolean` | `true` | Whether a press on the map closes it. |
| `autoFocus` | `boolean` | `true` | Whether the focus goes into it when it opens. Turn it off for one that opens without being asked for, such as with the page. |

It's a `div`, and takes what a `div` takes. Give it an `aria-label`.

### MapControls

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `position` | `"bottom-end" \| "bottom-start" \| "top-end" \| "top-start"` | `"top-end"` | The corner they're in. The start is the left where text reads from the left. |
| `zoom` | `boolean` | `true` | Buttons to zoom in and out. |
| `compass` | `boolean` | `false` | A button that turns north back up. It shows which way north is. |
| `locate` | `boolean` | `false` | A button that goes to where the reader is, which the browser asks them to allow. |
| `fullscreen` | `boolean` | `false` | A button that fills the screen with the map, where the browser can. |
| `onLocate` | `((position: MapLngLat) => void)` |  | Called when the browser has said where the reader is. |

It's a `div`, and takes what a `div` takes.

## Translation

`labels` on `MapView` takes the map's own words: the buttons' names, what's said while it loads and when it can't be drawn, and what `cooperativeGestures` says over the map. They're read when the map is first drawn. A marker's `label` and a popup's `aria-label` are yours.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `map` | `string` |  | The name of the map, when it's given no `aria-label`. |
| `loading` | `string` |  | Shown and said until the map's style has come. |
| `error` | `string` |  | Shown and said when the map can't be drawn. |
| `zoomIn` | `string` |  |  |
| `zoomOut` | `string` |  |  |
| `resetNorth` | `string` |  | The name of the button that turns north back up. |
| `locate` | `string` |  | The name of the button that goes to where the reader is. |
| `locateError` | `string` |  | Said when the browser won't say where the reader is. |
| `location` | `string` |  | The name of the marker at where the reader is. |
| `fullscreen` | `string` |  |  |
| `exitFullscreen` | `string` |  |  |
| `closePopup` | `string` |  |  |
| `gestureMac` | `string` |  | With `cooperativeGestures`, shown over the map on a Mac when the wheel is turned over it. |
| `gestureOther` | `string` |  | The same, on other computers. |
| `gestureTouch` | `string` |  | The same, on a touch screen, when one finger is dragged over it. |

## Accessibility

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Goes to the map, then to each marker that's a button, in the order they're written, then to the links that name whose map it is, then to the controls. |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> | On the map, moves it. On a marker that can be moved, moves the marker. |
| <kbd>+</kbd> <kbd>−</kbd> | On the map, zooms in and out. |
| <kbd>Shift</kbd> with <kbd>←</kbd> <kbd>→</kbd> | On the map, turns it. |
| <kbd>Enter</kbd> <kbd>Space</kbd> | On a marker, opens its popup or closes it. |
| <kbd>Escape</kbd> | Closes the popup and puts the focus back on its marker. |

### What the component handles

- The map is a region with a name and takes the focus, with a ring when the keys are on it.
- A marker is read by its `label`. One that does something is a button, and says whether its popup is open.
- A popup is a dialog named for its marker. The focus goes into it when the marker is pressed, and back to the marker when it's closed from inside.
- The controls are buttons with names. A zoom button that can go no further is disabled.
- While the map loads, and when it can't be drawn, that's said and not only shown.
- Moves that are asked for are made at once, without a glide, where the reader has asked for less motion.
- A marker and each button take a tap over 44 pixels on a touch screen.
- Where the browser forces its own colors, the pin is drawn in them.

### What you need to handle

- Give the map an `aria-label` that says what it's of: "Our offices", and not "Map".
- A map says little to someone who can't see it. Give what it shows another way as well: a list of the places beside it, or the address in words. The [Find a branch block](https://nuvui.nuvraxis.com/blocks/data) is a list and a map of the same places.
- Keep the markers that are buttons few enough to tab through. Hundreds of stops is no way across a page. [MapClusters](map-clusters.md) gathers the ones that are near each other.
- The colors of the map are the style's. Check that what matters on it can be told apart, and that your markers stand off it.

## On small screens

The map is as wide as the room it's given, and `--nuv-map-height` is how tall. On a phone, with `cooperativeGestures`, one finger scrolls the page and two move the map.

A popup is never wider than `--nuv-map-popup-width`, and opens on whichever side of its place has room.

## CSS variables

Set any of these on a `MapView`, or on anything around it.

```css
.locator {
  --nuv-map-height: 32rem;
  --nuv-map-marker-bg: var(--color-danger);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-map-height` | `24rem` | Height of the map's box. |
| `--nuv-map-border` | `var(--color-border)` | Color of the box's border. |
| `--nuv-map-radius` | `var(--radius-lg)` | Corner radius of the box. |
| `--nuv-map-bg` | `var(--color-muted)` | What's behind the map before its tiles come, and behind the words shown in its place. |
| `--nuv-map-note-fg` | `var(--color-foreground)` | Color of the words shown while the map loads and when it can't be drawn. |
| `--nuv-map-marker-bg` | `var(--color-primary)` | Color of the pin, and of the dot where the reader is. |
| `--nuv-map-marker-fg` | `var(--color-primary-foreground)` | Color of the pin's edge and of the dot in it. It's what keeps the pin seen on a map of any color. |
| `--nuv-map-cluster-size` | `2.25rem` | Width and height of a gathering of under ten places. It's half a rem more from ten, and a rem more from a hundred. |
| `--nuv-map-cluster-fg` | `var(--color-primary-foreground)` | Color of a gathering's number and of its edge. Keep it at 4.5:1 against its background. |
| `--nuv-map-cluster-bg` | `var(--color-primary)` | Background of a gathering. |
| `--nuv-map-route-edge` | `var(--color-primary-foreground)` | Color of the edge along a route's line. It's what keeps the line seen on a map of any color. |
| `--nuv-map-route-color` | `var(--color-primary)` | Color of a route's line. |
| `--nuv-map-popup-width` | `18rem` | The most a popup is wide. |
| `--nuv-map-popup-padding` | `calc(var(--spacing) * 3)` | Space inside a popup. |
| `--nuv-map-popup-fg` | `var(--color-surface-foreground)` | Color of a popup's text. |
| `--nuv-map-controls-offset` | `calc(var(--spacing) * 2)` | Space between the controls and the box's edge. |
| `--nuv-map-attribution-bg` | `var(--color-surface)` | Background behind the names of whose map it is. |
| `--nuv-map-attribution-fg` | `var(--color-surface-foreground)` | Color of those names. Keep it at 4.5:1 against its background. |
| `--nuv-map-popup-border` | `var(--color-border-strong)` | Color of the line and the shadow around a popup. |
| `--nuv-map-popup-radius` | `var(--radius-md)` | Corner radius of a popup. |
| `--nuv-map-popup-bg` | `var(--color-surface)` | Background of a popup and its tip. |
| `--nuv-map-gesture-bg` | `var(--color-foreground)` | With cooperativeGestures, what covers the map while it says how to move it. |
| `--nuv-map-gesture-fg` | `var(--color-background)` | Color of those words. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-map` | MapView |
| `.nuv-map__canvas` | What MapLibre draws the map in. |
| `.nuv-map__cluster` | A gathering in MapClusters. It's a marker as well, and has that class too. |
| `.nuv-map__control` | One of the buttons. |
| `.nuv-map__controls` | MapControls |
| `.nuv-map__controls--bottom-end` | In the bottom corner at the end. |
| `.nuv-map__controls--bottom-start` | In the bottom corner at the start. |
| `.nuv-map__controls--top-end` | In the top corner at the end. |
| `.nuv-map__controls--top-start` | In the top corner at the start. |
| `.nuv-map__location` | The dot where the reader is. |
| `.nuv-map__marker` | MapMarker |
| `.nuv-map__marker-holder` | What MapLibre places on the map, with a marker in it. |
| `.nuv-map__note` | The words shown while the map loads, and when it can't be drawn. |
| `.nuv-map__pin` | The pin drawn when a marker has no children. |
| `.nuv-map__pin-body` | The pin's shape. |
| `.nuv-map__pin-dot` | The dot in the pin. |
| `.nuv-map__popup` | MapPopup |
| `.nuv-map__popup-body` | What's in the popup. |
| `.nuv-map__popup-close` | The popup's close button. |
| `.nuv-map__route` | MapRoute's own element. It isn't drawn: the line's colors are read from it. |
| `.nuv-map__status` | What's said when the reader can't be found. Not drawn. |

The box has `data-state`, which is `loading`, `ready` or `error`. A marker that can be moved has `data-draggable`, and a gathering has `data-size`. MapLibre's own elements keep its class names, which begin with `maplibregl-`.

## Server components

`MapView` and its parts start with `"use client"`. A `MapView` with plain props can be rendered from a server component, and the server draws the box with the words "Loading map". The map itself is drawn in a browser. Markers, popups and controls are drawn once there's a map, so they aren't in what the server sends.

## Do and don't

**Do**

- Say what the map is of, and give the same places in words beside it.
- Use `bounds` to show every marker, and not a center and a zoom worked out by hand.
- Turn on `cooperativeGestures` for a map in a page that scrolls.

**Don't**

- Don't hide the names in the map's corner. They're a term of using the map.
- Don't put a map on a page where the address would do. It's 350 kB and a request to someone else's server.
- Don't use a marker's color alone to say something, such as open or closed. Say it in the `label` and the popup.
