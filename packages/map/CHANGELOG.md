# @nuvui/map

## 0.1.5

### Patch Changes

- Updated dependencies [[`20f9c69`](https://github.com/Nuvraxis/nuvui/commit/20f9c696f944c91c1fd84fef58f5357f18bf46c0)]:
  - @nuvui/react@0.10.0

## 0.1.4

### Patch Changes

- Updated dependencies [[`cd1b218`](https://github.com/Nuvraxis/nuvui/commit/cd1b218dc5bc36f69e00b2deed7c6a7bb05abfe6)]:
  - @nuvui/react@0.9.0

## 0.1.3

### Patch Changes

- [#89](https://github.com/Nuvraxis/nuvui/pull/89) [`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944) Thanks [@sajanv88](https://github.com/sajanv88)! - A map that was moved before React had drawn it with its `center` and `zoom` is no longer moved back to them. An app that keeps the view from `onMove` could see the map jump back to where it started, when it was moved as soon as it loaded.
- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0

## 0.1.2

### Patch Changes

- Updated dependencies [[`edff9a4`](https://github.com/Nuvraxis/nuvui/commit/edff9a4b8620d36176a4875fad6e00e6b53c121d)]:
  - @nuvui/react@0.7.0

## 0.1.1

### Patch Changes

- Updated dependencies [[`15bf3c3`](https://github.com/Nuvraxis/nuvui/commit/15bf3c38570b5b1952dcadc34f90c39ae9fdc592)]:
  - @nuvui/react@0.6.0

## 0.1.0

### Minor Changes

- [#62](https://github.com/Nuvraxis/nuvui/pull/62) [`679eae4`](https://github.com/Nuvraxis/nuvui/commit/679eae458b8565660a5bfbc31a9c1f1bd8d64db8) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for a map on MapLibre.
  
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
