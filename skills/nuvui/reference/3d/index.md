<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/3d/index.mdx. Don't edit it here: run `pnpm skill`. -->

# 3D

The @nuvui/3d package. A viewer for 3D models on react-three-fiber and three.js, for glTF, GLB and STL files, from your site or picked by the person. It needs React 19.

The 3D viewer is a package of its own, `@nuvui/3d`, since drawing a model needs an engine the core doesn't have:

| Component | What it is |
| --- | --- |
| [ModelViewer](model-viewer.md) | A model to turn and zoom, with a pointer, a finger or the keys, from an address or from files the person picked. |

```tsx
import { ModelViewer } from "@nuvui/3d";

export default function Example() {
  return (
    <ModelViewer
      label="Oak chair"
      description="A chair with an oak seat and back on four steel legs."
      src="/docs/models/chair.glb"
      poster="/docs/models/chair.webp"
    />
  );
}
```

## Install

```sh
pnpm add @nuvui/3d three @react-three/fiber @nuvui/react
```

`@nuvui/react` is a peer dependency: the buttons are the core's [Button](../components/button.md), and the loading bar is its [Progress](../components/progress.md).

The model is drawn by [three.js](https://threejs.org) through [react-three-fiber](https://r3f.docs.pmnd.rs), both MIT licensed. Both are peer dependencies, so they're yours to install and to keep up to date:

- **three 0.156 or newer.** That's what react-three-fiber asks for. The package is built and tested against 0.186, and a test installs 0.156 and loads a model of each format.
- **react-three-fiber 9.** It needs React 19, and so does this package. The rest of nuvui works with React 18.2 as well.

react-three-fiber 9 says it works with React up to 19.3. When a later React comes out, installing warns until react-three-fiber says it works with it too. This package adds no limit of its own.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/3d/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The viewer's styles are also on their own, at `@nuvui/3d/css/model-viewer.css`. With that one, load `button.css` and `progress.css` from `@nuvui/react/css/` as well.

## It's large, so it's loaded when it's needed

three, react-three-fiber and the viewer's scene, with every loader and decoder, come to about 250 kB compressed with Brotli, and three is 155 kB of that. The viewer asks for them when it first comes near the screen, and not before. Until then it makes no WebGL context, so a page of many models only draws the ones being looked at, and stays under the browser's limit on contexts. The loaders and decoders are loaded only for a model that needs them. The server sends the viewer's name, its poster, the words while it loads and its buttons, and never loads three. The rest of the package is about 8 kB.

A page with many models, such as a gallery, can show posters and put a viewer only where one is opened. The [Model library block](https://nuvui.nuvraxis.com/blocks/3d) does that.

## Formats

- **GLB:** one file, with its materials and textures inside it. The best one to serve.
- **glTF:** a `.gltf` file, with its buffers and textures in files beside it, found by their addresses relative to it, or written into it.
- **STL:** binary or text, shape only. It's drawn in the theme's color. STL files are often in millimeters, and the viewer frames a model of any size.

The format is read from the file's name, or from its first bytes when the name doesn't say, as with a signed address. `format` says it outright.

OBJ, FBX, USDZ and the rest aren't read. Most 3D tools export glTF, and [glTF Transform](https://gltf-transform.dev) converts and compresses on the command line.

## Compressed glTF

A glTF can be compressed in two ways the viewer reads, once `decoders` turns them on:

| Decoder | What it shrinks | What it needs |
| --- | --- | --- |
| `meshopt: true` | The shapes, with [Meshopt](https://meshoptimizer.org) | Nothing to serve. Its decoder comes with three, and is loaded only for a model that uses it. |
| `ktx2: "/basis/"` | The textures, as KTX2 | Two files your site serves, from the address you give. |

Both are off by default, so a page that shows plain models needs nothing more. A model that needs one that's off says so in words in the viewer, and so does a model compressed with Draco, which the viewer doesn't read. Export it again with Meshopt.

### Serving the KTX2 transcoder

KTX2 textures are turned into what the reader's graphics card takes by a transcoder: `basis_transcoder.js` and `basis_transcoder.wasm`, in three's own package. Copy both from `three/examples/jsm/libs/basis/` of the three you have installed into a folder your site serves, and give that folder's address:

```tsx
<ModelViewer
  label="Crate"
  src="/models/crate-ktx2.glb"
  decoders={{ ktx2: "/basis/" }}
/>
```

Copy them again when three is updated: a transcoder from another version can fail. A line in your build does it, such as:

```sh
cp node_modules/three/examples/jsm/libs/basis/basis_transcoder.* public/basis/
```

## What a browser needs

- **WebGL.** Where a browser has none, or it's turned off, the viewer keeps its poster, says it can't draw 3D models, and calls `onError`.
- **A content security policy,** if you have one. A plain model needs nothing beyond what [the policy in the guide](../content-security-policy.md) allows. A model with its textures packed inside it, or picked by the person, needs `blob:` in `connect-src`, since three reads them from `blob:` addresses with `fetch`, and a glTF with its files written in as `data:` addresses needs `data:` there. A page that shows Meshopt models needs `'wasm-unsafe-eval'` in `script-src`, since the decoder is WebAssembly. `'wasm-unsafe-eval'` lets a page compile WebAssembly, and doesn't let it run a string as script. KTX2 needs more: `blob:` in `worker-src`, since the transcoder runs in workers, and `'unsafe-eval'` in `script-src`, since the transcoder three ships makes functions from strings as it starts. Without `'unsafe-eval'` a KTX2 model doesn't load, and the viewer goes on saying it's loading. A policy is the page's and not the viewer's, so send the looser one only for the pages that show compressed models.

## People's own models

The viewer shows files a person picks, with the core's [FileUpload](../components/file-upload.md), as well as files from your site. A picked file is read in the browser and never sent anywhere by the viewer, so it suits models that are confidential. What the app does with the file after that is the app's. See [ModelViewer](model-viewer.md#files-the-person-picks).

## What it leaves out

- **Lighting and environment files.** The light is made in the browser from the theme, and nothing is downloaded for it.
- **Editing a model,** measuring on it, and cutting through it.
- **Animations in a glTF.** A model is shown at rest.
- **Draco, OBJ, FBX and USDZ.** See above.
- **A picture of a model** for where there's no WebGL, or for print. `poster` is yours to make.
