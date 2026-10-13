---
"@nuvui/map": minor
---

A new package, for a map on MapLibre.

- `MapView`, a map in a box of a set height. `mapStyle` takes the address of a MapLibre style, or the style itself: the tiles are a provider's, and which provider is yours to choose. `defaultCenter` and `defaultZoom` are where it begins, `bounds` is an area to show all of, and `center` and `zoom` move it when they change. `onMove` and `onMoveEnd` say where it is.
- `MapMarker`, a place on the map, drawn as a pin or as its children. `label` is its name, read in place of the drawing. With `popup` it's a button that opens one, and with `draggable` it's moved by pointer or by the arrow keys, and `onPositionChange` says where it was put.
- `MapPopup`, a box that points at a place, for one that no marker opens.
- `MapControls`, the core's buttons over the map: zoom, and optionally a compass, the reader's location and full screen.
- `MapRoute`, a line through a list of places, for a way that was driven or, with `dashed`, one that's planned. Its colors are the theme's, through `--nuv-map-route-color` and `--nuv-map-route-edge`, and `before` draws it under a layer of the style's.
- `MapClusters`, many places gathered into one button with a number on it where they're near each other. A press zooms in to where they come apart. Its child is a function that draws a place standing alone, called only for those in view, and `clusterLabel` names a gathering.
- `mapBoundsOf`, the area that holds a list of places, for `bounds`.
- `useMap`, the MapLibre map itself, for layers, sources and events.
- The map is one stop for the Tab key and takes the arrow keys, and each marker that does something is a button. The box says when the map is loading, and when the browser can't draw one.
- `cooperativeGestures` leaves the wheel and one finger to a page that scrolls.
- `setMapWorkerUrl` says where MapLibre's worker is, which an app built with a bundler has to do once.
- MapLibre GL JS is a peer dependency, version 6.4.1 or newer, loaded when a map is first drawn. Its stylesheet isn't needed.
- `@nuvui/react` is a peer dependency. The package is ESM only, as MapLibre is.
