<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/map/map-clusters.mdx. Don't edit it here: run `pnpm skill`. -->

# MapClusters

Many places on a map, gathered into one button with a number on it where they're near each other, and drawn apart as the map zooms in. Each gathering and each place is a button with a name.

Use clusters when there are more places than a map can show one by one: every branch in a country, every charging point in a city. Zoomed out, places that would sit on top of each other are one round button that says how many. A press on it zooms the map in, and they come apart.

```tsx
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
```

## Install

```sh
pnpm add @nuvui/map maplibre-gl @nuvui/react
```

## Import

```tsx
import { MapClusters, MapMarker, MapView } from "@nuvui/map";
```

Clusters go inside a [MapView](map-view.md), which is where the styles, the worker and the provider are covered.

```tsx
<MapView aria-label="Our branches" mapStyle={style} bounds={all}>
  <MapClusters points={branches}>
    {(branch) => <MapMarker position={branch.position} label={branch.name} />}
  </MapClusters>
</MapView>
```

## The places

`points` is every place, in view or not. Each has an `id` that tells it from the others and a `position`, as longitude and then latitude. Whatever else is on it is yours, and comes back to you.

```tsx
interface Branch extends MapClusterPoint {
  name: string;
  open: boolean;
}
```

The child is a function. It's called for each place in view that stands on its own, with that place, and returns its [MapMarker](map-view.md#markers): a pin, a popup, a drawing of your own, as for any marker. It isn't called for the places in a gathering, or for those out of view, so a thousand places don't make a thousand elements.

## How near is near

`radius` is how close two places are on the screen, in pixels, to be gathered. The default is 50. Smaller, and more places stand alone, closer together.

`maxZoom` is the zoom past which nothing is gathered, however near. The default is 14, which is a few streets. Two places at one address stay one button until then, and past it are two markers on the same spot, so raise it where that happens.

Changing either gathers the places again from the start.

## What a gathering says

A gathering shows its number, shortened past a thousand in the reader's own language. Its name, which is what's read, comes from `clusterLabel`. The default is "12 places". Say what they are:

```tsx
<MapClusters
  points={chargers}
  clusterLabel={(count) => `${count} charging points`}
>
```

A press on a gathering zooms the map in to where it comes apart, which may be into smaller gatherings. Pressed from the keys, the focus goes to the map, since the button that had it is gone.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `points` (required) | `Point[]` |  | Every place, whether it's in view or not. |
| `children` (required) | `(point: Point) => ReactNode` |  | Draws a place that stands on its own, as a `MapMarker`. It's called for the places in view that aren't gathered, and not for the rest. |
| `radius` | `number` | `50` | How near two places are, in pixels, to be gathered into one. |
| `maxZoom` | `number` | `14` | The zoom past which nothing is gathered, however near. |
| `clusterLabel` | `((count: number) => string)` | `(count) => '${count} places'` | The name of a gathering, from how many places are in it. It's what's read in place of the number. |

It renders markers and nothing around them, so it takes no `ref`, `className` or `style`. Style a gathering through the variables below, or by its class.

### MapClusterPoint

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `id` (required) | `string \| number` |  | What tells it from the others. |
| `position` (required) | `MapLngLat` |  | Where it is. |

## Translation

`clusterLabel` is the gathering's name, from its number, so it can follow the rules your language has for one, two and many. The number on the button is written by the browser in the reader's language.

## Accessibility

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Goes to each gathering, then to each marker that's a button. |
| <kbd>Enter</kbd> <kbd>Space</kbd> | On a gathering, zooms the map in to where it comes apart. |

### What the component handles

- A gathering is a button, read by its name and not by the bare number.
- Only what's in view is on the page, so the Tab key doesn't go through places nobody can see.
- A gathering takes a tap over 44 pixels on a touch screen.
- Pressed from the keys, the focus goes to the map, where the arrow keys and plus and minus go on working.
- Where the browser forces its own colors, a gathering has an edge in them.

### What you need to handle

- Say in `clusterLabel` what the places are.
- Give each marker a `label` that names its place.
- A map of many places is hard going without sight. Give the same places as a list that can be searched, as the [charging points block](https://nuvui.nuvraxis.com/blocks/data) does.

## On small screens

A narrower map shows less, so more is gathered at the same zoom. Nothing else changes: a gathering is the same size, and is pressed the same way.

## CSS variables

A gathering's variables are in the [MapView](map-view.md#css-variables) page's list with the rest of the map's: `--nuv-map-cluster-bg`, `--nuv-map-cluster-fg` and `--nuv-map-cluster-size`.

```css
.chargers {
  --nuv-map-cluster-bg: var(--color-danger);
  --nuv-map-cluster-fg: var(--color-danger-foreground);
}
```

A gathering has the class `nuv-map__cluster` and `data-size`, which is `sm` under ten places, `md` under a hundred and `lg` from there.

## Server components

`MapClusters` starts with `"use client"`, and its child is a function, so it's written in a client component. It's drawn once there's a map, which is in a browser.

## Do and don't

**Do**

- Use it from a few dozen places up, or wherever markers would cover each other.
- Pass every place and let the map decide what's in view.
- Keep `id` the same for a place from one render to the next.

**Don't**

- Don't gather three or four places that fit on the map as they are.
- Don't use the number on a gathering as the only way to learn how many places there are. Say it beside the map.
