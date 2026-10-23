<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/3d/model-viewer.mdx. Don't edit it here: run `pnpm skill`. -->

# ModelViewer

A 3D model to turn and zoom with a pointer, a finger or the keys, for glTF, GLB and STL files from your site or picked by the person. It has a poster, says what it can't show in words, and is read by its name.

Use a model where its shape is the point: a product to look at from every side, a part to check before it's printed, where on a machine a fault is. For something one picture says as well, use the picture. A model is large to load and needs WebGL to draw.

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

It needs React 19. [3D](index.md) covers that, the styles, and how the package keeps three out of the page until a model is shown.

## Import

```tsx
import { ModelViewer } from "@nuvui/3d";
```

```tsx
<ModelViewer label="Oak chair" src="/models/chair.glb" />
```

`label` is the viewer's name, read in place of the drawing, so say what the model is.

## Formats

A GLB, a glTF and an STL. The format is read from the file's name, or from its first bytes. [3D](index.md#formats) says more about each.

```tsx
"use client";

import { ModelViewer } from "@nuvui/3d";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { useState } from "react";

const models = {
  glb: { label: "Desk lamp", src: "/docs/models/lamp.glb" },
  // A .gltf with its buffer and its texture in files beside it.
  gltf: { label: "Pine crate", src: "/docs/models/crate.gltf" },
  // Shape only, in millimeters, drawn in the theme's color.
  stl: { label: "Gear with 18 teeth", src: "/docs/models/gear.stl" },
};

type Format = keyof typeof models;

export default function Example() {
  const [format, setFormat] = useState<Format>("glb");
  const model = models[format];

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <ToggleGroup
        type="single"
        aria-label="Format"
        value={format}
        onValueChange={(value) => value && setFormat(value as Format)}
      >
        <ToggleGroupItem value="glb">GLB</ToggleGroupItem>
        <ToggleGroupItem value="gltf">glTF</ToggleGroupItem>
        <ToggleGroupItem value="stl">STL</ToggleGroupItem>
      </ToggleGroup>
      <ModelViewer label={model.label} src={model.src} />
    </div>
  );
}
```

## Files the person picks

`src` takes a `File`, or a list of them, as well as an address. Pick them with the core's [FileUpload](../components/file-upload.md). A glTF whose buffer and textures are files of their own is picked together with them, and the viewer finds each one the glTF names among the picked files by its name. When one is missing, it says which.

```tsx
"use client";

import { type ModelInfo, ModelViewer } from "@nuvui/3d";
import { FileUpload, Label } from "@nuvui/react";
import { useState } from "react";

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const isModel = (file: File) => /\.(glb|gltf|stl)$/i.test(file.name);

export default function Example() {
  const [files, setFiles] = useState<File[]>([]);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  // Files join the list as they're picked. The model shown is the one
  // picked last, with the buffers and textures beside it.
  const model = [...files].reverse().find(isModel);
  const shown = model
    ? [model, ...files.filter((file) => !isModel(file))]
    : files;

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <Label htmlFor="model-file">Your model</Label>
      {/* A glTF whose buffers and textures are files of their own is
          picked together with them. */}
      <FileUpload
        id="model-file"
        accept=".glb,.gltf,.stl,.bin,.png,.jpg,.jpeg,.webp,.ktx2"
        multiple
        onFilesChange={(next) => {
          setFiles(next);
          setInfo(null);
        }}
      >
        Drop a GLB, glTF or STL file here, or choose one. It stays in your
        browser.
      </FileUpload>
      {shown.length > 0 && (
        <ModelViewer
          label={model?.name ?? "Your model"}
          src={shown}
          decoders={{ meshopt: true, ktx2: "/docs/basis/" }}
          onLoad={setInfo}
          onError={() => setInfo(null)}
        />
      )}
      {info && (
        <p style={{ margin: 0 }}>
          {info.format.toUpperCase()}, {number.format(info.triangles)}{" "}
          triangles, {info.size.map((side) => number.format(side)).join(" × ")}{" "}
          in its own units.
        </p>
      )}
    </div>
  );
}
```

The files are read in the browser. The viewer sends them nowhere and keeps nothing once it's let them go. A picked glTF that names a file by a full address, such as one on the web, isn't loaded: fetching it would tell whoever made the model that it was opened. The viewer says that file is missing, by its address. Set `maxSize` on `FileUpload` for the largest file you'll take: a very large model can run a phone out of memory, and the viewer then says it can't draw it.

## What's in a model

`onLoad` is called with what the model is made of: its format, its size in its own units, its triangles, meshes, materials and textures, the space inside it, the compressions it used, and the size of its files. The example above shows some of them.

```tsx
<ModelViewer
  label="Bracket"
  src={file}
  onLoad={(info) => setPrice(estimate(info.volume))}
/>
```

The space inside, `volume`, is only right for a model whose surfaces are closed, as one made to be printed is. An STL's units are usually millimeters, so its volume is in cubic millimeters.

## Compressed models

`decoders` turns on Meshopt for shapes and KTX2 for textures. [3D](index.md#compressed-gltf) says what each needs, and how to serve the KTX2 transcoder.

```tsx
import { ModelViewer } from "@nuvui/3d";

export default function Example() {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
        inlineSize: "100%",
      }}
    >
      {/* Meshopt's decoder is in three, with nothing to serve. */}
      <ModelViewer
        label="Oak chair, compressed with Meshopt"
        src="/docs/models/chair-meshopt.glb"
        decoders={{ meshopt: true }}
      />
      {/* KTX2's transcoder is two files the site serves, from the three
          it has installed. */}
      <ModelViewer
        label="Pine crate, with a KTX2 texture"
        src="/docs/models/crate-ktx2.glb"
        decoders={{ ktx2: "/docs/basis/" }}
      />
    </div>
  );
}
```

## Where the camera starts

`camera` says where the view starts: `azimuth` in degrees round from the front, to the model's right, `elevation` in degrees above its middle, and `distance` as a share of the distance the whole model fits at. A new `camera` moves the view there, and Home and the reset button go back to it.

```tsx
"use client";

import { ModelViewer, type ModelViewerCamera } from "@nuvui/3d";
import { Button } from "@nuvui/react";
import { useState } from "react";

const views: Record<string, ModelViewerCamera> = {
  Front: { azimuth: 0, elevation: 0 },
  Side: { azimuth: 90, elevation: 0 },
  Above: { azimuth: 0, elevation: 80 },
  Close: { azimuth: 30, elevation: 15, distance: 0.6 },
};

export default function Example() {
  const [view, setView] = useState("Front");

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.keys(views).map((name) => (
          <Button
            key={name}
            intent={name === view ? "primary" : "secondary"}
            size="sm"
            aria-pressed={name === view}
            onClick={() => setView(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      <ModelViewer
        label="Pump"
        src="/docs/models/pump.glb"
        camera={views[view]}
      />
    </div>
  );
}
```

By default the camera is 30 degrees round and 15 above, at the distance the model fits at. A model is framed by its bounds, so a part in millimeters and a building in meters both fill the view.

## A poster

`poster` is a picture of the model, shown while it loads, and in its place when it can't be drawn. Make it the same size as the viewer, with a clear background.

## Turning by itself

`autoRotate` turns the model slowly, a turn in 30 seconds, until someone turns it, presses it or a button, or it's given the focus. It doesn't turn for anyone who asked for less motion, while it's scrolled out of view, or while the tab is in the background.

```tsx
import { ModelViewer } from "@nuvui/3d";

export default function Example() {
  return (
    <ModelViewer
      label="Terracotta vase"
      src="/docs/models/vase.glb"
      poster="/docs/models/vase.webp"
      autoRotate
    />
  );
}
```

## Your own things in the scene

Children are react-three-fiber elements, drawn with the model and in its units, such as a marker on one of its parts. They can take react-three-fiber's pointer events.

```tsx
// react-three-fiber's elements, such as <mesh>, are typed by its own
// types. Referred to like this, they're typed without loading it here.
/// <reference types="@react-three/fiber" />
"use client";

import { ModelViewer } from "@nuvui/3d";
import { useState } from "react";

// Places on the pump, in the model's own units, which are meters.
const notes = [
  { id: 1, at: [0.15, 0.33, 0] as const, text: "Outlet: check the seal" },
  { id: 2, at: [-0.12, 0.23, -0.02] as const, text: "Motor: due for service" },
  { id: 3, at: [0.25, 0.11, 0] as const, text: "Pump body: paint chipped" },
];

export default function Example() {
  const [active, setActive] = useState(1);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <ModelViewer
        label="Pump with three notes on it"
        description={notes.map((note) => `${note.id}. ${note.text}`).join(" ")}
        src="/docs/models/pump.glb"
      >
        {/* react-three-fiber elements, drawn with the model. */}
        {notes.map((note) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: a mesh is drawn in the scene, not an element on the page. The list below is what the keys reach.
          <mesh
            key={note.id}
            position={note.at}
            onClick={() => setActive(note.id)}
          >
            <sphereGeometry
              args={[note.id === active ? 0.02 : 0.014, 24, 16]}
            />
            <meshBasicMaterial
              color={note.id === active ? "#e11d48" : "#f59e0b"}
            />
          </mesh>
        ))}
      </ModelViewer>
      <ol style={{ margin: 0, paddingInlineStart: 20 }}>
        {notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              aria-pressed={note.id === active}
              onClick={() => setActive(note.id)}
              style={{
                font: "inherit",
                fontWeight: note.id === active ? 600 : 400,
                background: "none",
                border: 0,
                padding: "4px 0",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              {note.text}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

A marker is drawn, and not read. Write what each one marks beside the viewer as well, as the list here does, and in `description`.

Elements such as `<mesh>` are typed by react-three-fiber's own types, which come with an import from `@react-three/fiber`. In a file that only renders them, `/// <reference types="@react-three/fiber" />` at its top types them, without loading react-three-fiber in that file.

## Colors

An STL has no colors of its own, and is drawn in `--nuv-model-viewer-model`, the theme's primary color unless it's set. The light from below is `--nuv-model-viewer-ground`, the theme's muted color. Both are read again when the theme changes. A glTF keeps its own materials.

```tsx
import { ModelViewer } from "@nuvui/3d";
import type { CSSProperties } from "react";

// An STL has no colors of its own. It's drawn in --nuv-model-viewer-model,
// which is the theme's primary color unless it's set.
const colors = {
  inlineSize: "100%",
  "--nuv-model-viewer-model": "var(--color-success)",
  "--nuv-model-viewer-height": "18rem",
} as CSSProperties;

export default function Example() {
  return (
    <div style={colors}>
      <ModelViewer
        label="L-shaped bracket, 40 by 30 millimeters"
        src="/docs/models/bracket.stl"
      />
    </div>
  );
}
```

## Loading, and what it can't show

While a model loads, the viewer says so over it, with a bar that fills while the size is known. When it can't show one, it says why in words, in its place, and `onError` is called with a `ModelViewerError` whose `code` says which:

| `code` | Why |
| --- | --- |
| `webgl` | The browser can't draw WebGL. |
| `network` | The file couldn't be fetched. |
| `format` | It isn't a GLB, glTF or STL file. |
| `parse` | It is, and couldn't be read. |
| `missing-files` | A picked glTF names files that weren't picked with it. `files` has their names. |
| `draco` | It's compressed with Draco, which the viewer doesn't read. |
| `meshopt`, `ktx2` | It needs a decoder that `decoders` hasn't turned on. |
| `context-lost` | The browser took the drawing away, such as when the graphics driver restarted, and didn't give it back within five seconds. |

A new `src` starts again.

## Props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `src` (required) | `string \| File \| readonly File[] \| URL` |  | The model: the address of a `.glb`, `.gltf` or `.stl` file, or files the person picked. A glTF whose buffers and textures are files of their own is picked together with them. |
| `format` | `"glb" \| "gltf" \| "stl"` |  | The format, for an address or a file whose name doesn't say, such as a signed address. Otherwise it's read from the name, or from the file. |
| `label` (required) | `string` |  | What the model is, such as "Office chair". It's the viewer's name, read in place of the drawing. |
| `description` | `string` |  | A longer description of the model, read after its name. |
| `poster` | `string` |  | The address of a picture of the model, shown while it loads, and in its place when it can't be drawn. |
| `camera` | `ModelViewerCamera` |  | Where the camera starts. Changing it moves the camera there. |
| `decoders` | `ModelDecoders` |  | The decoders for compressed glTF. Both are off, and a model that needs one says so in words. |
| `interactive` | `boolean` | `true` | Whether the model can be turned and zoomed, by pointer, finger, keys and buttons. |
| `controls` | `boolean` | `true` | The buttons to zoom and to go back to the first view. |
| `autoRotate` | `boolean` | `false` | Turns the model slowly until it's touched. Not for anyone who asked for less motion, and not while it's out of view or the tab is hidden. |
| `onLoad` | `((info: ModelInfo) => void)` |  | Called when a model has loaded, with what it's made of. |
| `onError` | `((error: ModelViewerError) => void)` |  | Called when a model can't be shown, with why. |
| `labels` | `Partial<ModelViewerLabels>` |  | The viewer's own words, for another language. |
| `children` | `ReactNode` |  | react-three-fiber elements, drawn in the scene with the model and in its units, such as a marker on one of its parts. |

It's a `div`, and takes what a `div` takes, including `ref`, `className` and `style`.

### camera

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `azimuth` | `number` | `30` | Degrees around the model, from its front. Positive goes round to the model's right. |
| `elevation` | `number` | `15` | Degrees above the model's middle. Negative looks from below. |
| `distance` | `number` | `1` | How far away, as a share of the distance the whole model fits at. 1 fits it, 2 is twice as far. |

### decoders

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `meshopt` | `boolean` |  | Reads glTF compressed with Meshopt. Nothing to serve: it's in three. |
| `ktx2` | `string` |  | Reads KTX2 textures. The address of the folder where the app serves `basis_transcoder.js` and `basis_transcoder.wasm`, copied from `three/examples/jsm/libs/basis/` of the three it has installed. |

### What onLoad is called with

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `format` (required) | `"glb" \| "gltf" \| "stl"` |  |  |
| `size` (required) | `[width: number, height: number, depth: number]` |  | Width, height and depth, in the model's own units. An STL's are often millimeters. |
| `triangles` (required) | `number` |  |  |
| `meshes` (required) | `number` |  |  |
| `materials` (required) | `number` |  | The model's own materials. An STL has none. |
| `textures` (required) | `number` |  |  |
| `volume` (required) | `number` |  | The space inside the model's surfaces, in its own units cubed. Only meaningful for a model whose surfaces are closed, as one to be printed is. |
| `compressions` (required) | `ModelCompression[]` |  | The compressions it was read with. |
| `bytes` (required) | `number` |  | The size of the file, or of all the picked files together, in bytes. |

## Translation

`labels` takes the viewer's own words: the buttons' names, how to use the keys, what's said while it loads, and each error. The viewer's name is its `label`.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `roleDescription` (required) | `string` |  | Said with the viewer's name, in place of "image". |
| `keys` (required) | `string` |  | How to turn it from the keyboard, said when it has the focus. |
| `controls` (required) | `string` |  | The name of the group of buttons. |
| `zoomIn` (required) | `string` |  |  |
| `zoomOut` (required) | `string` |  |  |
| `reset` (required) | `string` |  | The name of the button that goes back to the first view. |
| `loading` (required) | `string` |  | Shown and said while the model is on its way. |
| `progress` (required) | `(percent: number) => string` |  | The loading bar's value, from 0 to 100. |
| `errorWebgl` (required) | `string` |  |  |
| `errorNetwork` (required) | `string` |  |  |
| `errorFormat` (required) | `string` |  |  |
| `errorParse` (required) | `string` |  |  |
| `errorMissingFiles` (required) | `(names: string[]) => string` |  | The names of the files a picked glTF names that weren't picked with it. |
| `errorDraco` (required) | `string` |  |  |
| `errorMeshopt` (required) | `string` |  |  |
| `errorKtx2` (required) | `string` |  |  |
| `errorContextLost` (required) | `string` |  | The browser took the drawing away and hasn't given it back. |

## Accessibility

| Key | What it does |
| --- | --- |
| <kbd>Tab</kbd> | Goes to the model, then to the buttons. |
| <kbd>←</kbd> <kbd>→</kbd> | Turns the model the way the arrow points, 15 degrees a press. |
| <kbd>↑</kbd> <kbd>↓</kbd> | Looks from higher or lower. |
| <kbd>Shift</kbd> with an arrow | Turns it 45 degrees. |
| <kbd>+</kbd> <kbd>−</kbd> | Zooms in and out. |
| <kbd>Home</kbd> | Goes back to the first view. |

The arrows turn the model the same way on a page that reads right to left: a model isn't text, and its left is the screen's left.

### What the component handles

- The model is an image with a name, `label`, and "3D model" said with it. The canvas is hidden from screen readers, since nothing in it can be read.
- `description` is read after the name, and so is how to use the keys.
- It takes the focus, with a ring inside its edge, and the keys turn it while it has it. A press gives it the focus.
- The wheel zooms only while it has the focus, so the page scrolls past a viewer it isn't on. One finger turns it and two zoom.
- The buttons have names, are disabled while there's no model, and a zoom button that can go no further is disabled too. They take a tap over 44 pixels on a touch screen.
- While a model loads, that's said, and what it can't show is said as an alert.
- It doesn't turn by itself for anyone who asked for less motion.
- Where the browser forces its own colors, the buttons, the focus ring and the words are drawn in them. The model is drawn in its own colors, as a picture is.

### What you need to handle

- Give it a `label` that says what the model is: "Oak chair", and not "3D model".
- A model says little to someone who can't see it. Put what matters about it in words as well, in `description` or beside it: its size, its colors, what each part is.
- Keep it smaller than the screen on a phone, so a finger can scroll the page past it.
- A model that turns by itself for more than five seconds beside other content needs a way to stop it. A press on it stops it, and so does the focus, but say so if it isn't obvious.

## On small screens

The viewer is as wide as the room it's given, and `--nuv-model-viewer-height` is how tall. A finger on it turns the model and doesn't scroll the page, so leave room around it.

## CSS variables

Set any of these on a `ModelViewer`, or on anything around it. The two colors under [Colors](#colors) are read by the scene and set the same way.

```css
.product-model {
  --nuv-model-viewer-height: 32rem;
  --nuv-model-viewer-model: var(--color-success);
}
```

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-model-viewer-height` | `24rem` | Height of the viewer. |
| `--nuv-model-viewer-border` | `var(--color-border)` | Color of the viewer's border. |
| `--nuv-model-viewer-radius` | `var(--radius-lg)` | Corner radius of the viewer. |
| `--nuv-model-viewer-bg` | `transparent` | What's behind the model. Clear, so the viewer takes the color of what it's on. |
| `--nuv-model-viewer-note-bg` | `var(--color-popover)` | Background of the words and the bar shown while a model loads. |
| `--nuv-model-viewer-note-fg` | `var(--color-popover-foreground)` | Color of the words shown while a model loads. |
| `--nuv-model-viewer-error-bg` | `var(--color-muted)` | Background of what's said when a model can't be shown. |
| `--nuv-model-viewer-error-fg` | `var(--color-foreground)` | Color of what's said when a model can't be shown. |
| `--nuv-model-viewer-controls-offset` | `calc(var(--spacing) * 2)` | Room between the buttons and the viewer's corner. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-model-viewer` | ModelViewer |
| `.nuv-model-viewer__canvas` | The canvas the model is drawn on |
| `.nuv-model-viewer__control` | Each button |
| `.nuv-model-viewer__controls` | The group of buttons |
| `.nuv-model-viewer__error` | What's said when a model can't be shown |
| `.nuv-model-viewer__error--over` | The same, as a band at the foot of a poster |
| `.nuv-model-viewer__hidden` | Words that are read and not shown |
| `.nuv-model-viewer__loading` | The words and the bar while a model loads |
| `.nuv-model-viewer__note` | The words while a model loads |
| `.nuv-model-viewer__poster` | The poster |
| `.nuv-model-viewer__stage` | What has the name and takes the keys, with the canvas in it |
