# @nuvui/3d

## 0.1.1

### Patch Changes

- Updated dependencies [[`cd1b218`](https://github.com/Nuvraxis/nuvui/commit/cd1b218dc5bc36f69e00b2deed7c6a7bb05abfe6)]:
  - @nuvui/react@0.9.0

## 0.1.0

### Minor Changes

- [#94](https://github.com/Nuvraxis/nuvui/pull/94) [`12702d8`](https://github.com/Nuvraxis/nuvui/commit/12702d884accc25cdae6dc145963080eafa31928) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for showing 3D models, on react-three-fiber and three.js. It needs React 19, as react-three-fiber 9 does, and three 0.156 or newer.
  
  - `ModelViewer` shows a GLB, a glTF or an STL file, from an address or from files the person picks. A glTF whose buffer and textures are files of their own is picked together with them, and each is found by its name. A picked file is read in the browser and sent nowhere.
  - The model is framed to fit whatever its units, a millimeter part or a building in meters. `camera` says where the view starts. It's turned by dragging, zoomed by pinching or with the wheel while the viewer has the focus, and turned and zoomed with the arrow keys, plus and minus, and Home to go back. Buttons zoom and reset.
  - `onLoad` is called with what the model is made of: its format, size, triangles, meshes, materials, textures, volume, compressions and the size of its files.
  - `decoders` turns on glTF compressed with Meshopt, which needs nothing served, and KTX2 textures, which need three's transcoder served by the app. Both are off by default. A model that needs one that's off, a Draco model, a missing file, a file that isn't a model and a browser with no WebGL each get their own words in the viewer, and `onError` is called with a `ModelViewerError` whose `code` says which.
  - The viewer is an image named by its required `label`, with "3D model" said with it, how to use the keys, and an optional `description`. While a model loads it says so, with a bar, and `poster` is shown until it's drawn and in its place when it can't be.
  - three and react-three-fiber are loaded when a model is first shown. The server sends the viewer's name, its poster and its buttons. A frame is drawn only when something changes. `autoRotate` turns the model slowly until it's touched, and not for anyone who asked for less motion, out of view or in a hidden tab.
  - An STL is drawn in `--nuv-model-viewer-model`, the theme's primary color, and the light comes from the theme too, made in the browser with nothing downloaded. Children are react-three-fiber elements drawn with the model, such as a marker on one of its parts.
  - `labels` translates every word it shows or says.
