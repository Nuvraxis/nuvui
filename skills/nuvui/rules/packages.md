# The add-on packages

Each add-on is installed next to `@nuvui/react`, which it needs, and has a stylesheet of its own to load after the core's. Its first reference page, `reference/<package>/index.md`, has the install command and the setup. These are the steps that are easy to miss.

```tsx
import "@nuvui/react/styles.css";
import "@nuvui/<package>/styles.css";
```

## @nuvui/table

- Install `@tanstack/react-table` with it: it's a peer dependency. `@tanstack/react-virtual` is needed only for virtual rows.
- `Table` and its parts are plain styled elements. `DataTable` is the one with sorting, filtering, selection and paging, and takes a table made by `useDataTable`, which is TanStack Table's.
- The hook comes from an entry that says how much of TanStack to bring: `@nuvui/table/full` for everything, which also draws a search box, a column chooser and paging. For a table that does one thing, such as sorting, make a hook with only that feature. [reference/table/index.md](../reference/table/index.md) has both.
- A column is TanStack's. What a cell shows is its `cell`: `cell: ({ getValue }) => <FormattedNumber value={getValue()} />`. A date in a cell is written with `Intl.DateTimeFormat`, with the time zone said, inside a `time` element.
- Keep `columns` outside the component, or in `useMemo`. An array made during render is new every time, and the rows are worked out again.
- A data table needs a name: `caption`, `aria-label` or `aria-labelledby`. TypeScript reports one with none.
- The file that calls `useDataTable` has `"use client"`.
- It's ESM only.

## @nuvui/charts

- Install `recharts` with it. The chart itself is Recharts' own components, inside a `ChartContainer`.
- The container needs a `config`, with an entry for each series, and an `aria-label`.
- Color a series with `chartFill("key")` or its like, which is a CSS variable the container sets, so the chart follows the theme. Never a color written out.
- The file a chart is in has `"use client"`.
- reference/charts/ has a page for each kind: bar, line, area, pie, radar, radial, scatter, composed.

## @nuvui/date-picker

- `react-day-picker` and `date-fns` come with it. Don't install them.
- Values are `Date` objects. Don't turn one into text with `toISOString()`, which gives the day in UTC and can be the day before. Use the form value, or date-fns' `format(date, "yyyy-MM-dd")`.
- Other languages are a `locale` from date-fns. A time zone is said on purpose. [reference/date-picker/index.md](../reference/date-picker/index.md) has both.

## @nuvui/chat

- The components draw a conversation. They don't talk to a model or a server: messages come in as props, and a callback says when something is sent.
- `Markdown` and `CodeBlock` color code with a highlighter you pass in. The ready one is `createShikiHighlighter` from `@nuvui/chat/shiki`, which needs `shiki` installed. Make one for the whole app, outside any component.
- Without a highlighter, code is shown plain. That's allowed.
- `CodeBlock` with `typing` types its code out, for a page that shows code off. Not for code in a conversation. It's all there at once for less motion.

## @nuvui/kanban

- The board keeps the order: which card ids are in which column. What a card is stays with you, looked up by id when it's drawn.
- `onValueChange` is called once per move, with the columns as they are now. That's when to save.

## @nuvui/editor

- It's about 120 kB compressed. Load it with the screen that has it: `lazy` and `Suspense`, or `next/dynamic`.
- The value is a string of HTML. Before HTML from a database is put in a page, sanitize it on the server, or show it with the editor itself, read only.

## @nuvui/emoji

- Emoji are drawn as text in the device's own font. There are no pictures to load, and they look different from one device to the next.
- Comparing two emoji with `===` can fail: the same emoji is sometimes written with an extra invisible character, U+FE0F. Strip it from both before comparing.

## @nuvui/map

- Install `maplibre-gl` with it, version 6.4.1 or newer.
- **Say where MapLibre's worker is**, once, before a map is drawn. Without it the map stays on "Loading map".

  ```tsx
  // Next.js, with Turbopack or webpack, and webpack alone
  "use client";
  import { setMapWorkerUrl } from "@nuvui/map";

  setMapWorkerUrl(
    new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url),
  );
  ```

  ```tsx
  // Vite
  import { setMapWorkerUrl } from "@nuvui/map";
  import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

  setMapWorkerUrl(workerUrl);
  ```

  Put it in a file of its own, such as `components/map-worker.ts`, and import that file from the client component that draws the map.

- **It has no tiles.** `mapStyle` is required: the address of a MapLibre style from a tile provider the app's owner has chosen. Ask which, and don't pick one for them. A provider has terms and a cost.

  The examples in the reference use OpenFreeMap's address, so that they run. It's a stand-in. Don't copy it into an app. Where the provider isn't known yet, read the address from the app's configuration, such as an environment variable, show the places in words where there's no address, and say what's still to be decided.

- A place is `[longitude, latitude]`, in that order. The types are exported: `MapLngLat` is that pair, and `MapBounds` is two of them, the south-west corner and the north-east. `mapBoundsOf` makes one from a list of places.
- A marker's popup closes on a press anywhere else on the map, another marker included, so one is open at a time without your keeping it. `open` and `onOpenChange` are for opening one from outside the map, such as from a list beside it.
- Don't load MapLibre's own stylesheet.
- Give the map an `aria-label`, each marker a `label`, and the same places in words beside the map.
- It's ESM only.

## @nuvui/flow

- Nothing else to install. A diagram is data: `nodes`, each with an `id`, a `label` and a `position` (its top left corner), and `edges`, each `from` one id `to` another. Positions come from the app. Nothing lays a diagram out by itself.
- `aria-label` is required, and each node's `label` is its name for a screen reader: make each one tell it from the others.
- With `editable`, `onNodesChange` and `onEdgesChange` are called once per change, a drag when it ends, with the lists as they are now and the change. That's when to save. Don't save from `onNodeDrag`, which comes every frame.
- Keep the lists in state, or in `useMemo` for generated ones. The nodes that didn't change are the same objects, and a new object is read again.
- A node holds words, not React content: it's drawn in SVG.
- The frame's height is `--nuv-flow-height`, 24rem by default.

## @nuvui/media

- A file (MP4, WebM) needs nothing else. A stream needs its library, handed over as a function, so it loads only when a stream plays: `hls={() => import("hls.js")}` for `.m3u8`, `dash={() => import("dashjs")}` for `.mpd`. Install the one used. A function can't cross from a server component, so a player with one goes in a file with `"use client"`.
- Give every player a `title`: it's its name for a screen reader and what the lock screen shows.
- Sources with a `height` are qualities and fill the quality menu. Sources with only a `type` are formats, of which the browser plays the first it can.
- Captions, subtitles and chapters are `tracks`, as WebVTT. The player draws captions itself, so don't style `::cue`. Previews over the seek bar come from `thumbnails`, a WebVTT file.
- Never autoplay with sound. `autoPlay` mutes the player.
- `persist="a-key"` keeps the viewer's volume, speed, captions and quality. Leave it off where storage needs consent.
- `controls={false}` and the parts (`MediaPlayButton`, `MediaSeek`, `MediaTime` and the rest) as children lay out controls of your own. `handleRef` plays, pauses and seeks from outside.
- The frame's shape is `--nuv-video-player-aspect`, 16 / 9 by default.
- `AudioPlayer` takes the same sources, tracks and streams. `layout` is `bar` (the default), `podcast` (with `artwork` and `artist`) or `voice` (small, for a chat bubble, in the text's color).
- A waveform comes from `peaks`: work them out once on the server and keep them with the file. `computePeaks(fileOrBlob)` does it in the browser, for a recording just made or a short file.
- In a list of voice messages, `preload="none"` with `duration` loads nothing until one plays.
- A transcript needs the player's `handleRef`: `<MediaTranscript player={ref} />`, in a client component. It reads the captions shown, or the first captions track, so an audio player needs a captions track for it.

## @nuvui/backgrounds

- A background is a box with its content as children: `<StarsBackground className="hero">…</StarsBackground>`. Give it a size and a layout with `className`. Don't put it in a box of its own behind the content.
- Body text on one needs `scrim="strong"`, which keeps it at 4.5:1. `soft` dims the background and promises no contrast, so text on it goes on a card of its own.
- Anything that moves for more than five seconds beside other content needs a way to stop it: a button that sets `paused`, with `aria-pressed` and a name that doesn't change. `GridBackground` doesn't move by itself and needs none.
- Colors are CSS variables, such as `--nuv-stars-background-color`, and default to the theme's. Don't pass colors as props.
- Less motion, forced colors, a hidden tab and being out of view are handled by the component. Don't add a media query for them.
- `GradientBackground` works in a server component. The others are client components, and can still be rendered from one.

## @nuvui/barcodes

- A code is black on white in every theme, on purpose: a scanner needs the contrast. Don't theme it.
- Check a value before drawing it. [reference/barcodes/index.md](../reference/barcodes/index.md) has the function for that.
