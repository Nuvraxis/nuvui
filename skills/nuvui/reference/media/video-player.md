<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/media/video-player.mdx. Don't edit it here: run `pnpm skill`. -->

# VideoPlayer

A video with its own controls. Play, seek with chapters and previews, volume, speed, quality, captions drawn in the theme, picture in picture and fullscreen, from a pointer, a finger or the keyboard. Plays files, and HLS and DASH streams.

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <div className="w-full px-6 py-8">
      <VideoPlayer
        title="A music player, close up"
        src="/docs/clips/demo_video.mp4"
        poster="/docs/clips/demo_video.jpg"
        tracks={[
          {
            kind: "captions",
            src: "/docs/clips/demo_video.en.vtt",
            srcLang: "en",
            label: "English",
          },
        ]}
        ambient
      />
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/media @nuvui/react
```

## Import

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

<VideoPlayer title="Getting started" src="/videos/intro.mp4" poster="/videos/intro.jpg" />
```

`title` names the player for a screen reader and is what the phone's lock screen shows while it plays. Without one, give an `aria-label`.

## Sources

`src` takes an address, a source, or a list of them.

- **One file:** `src="/videos/intro.mp4"`.
- **The same video in several formats,** of which the browser plays the first it can: a list of sources with a `type` each, as in the example below. WebM is smaller, and MP4 plays everywhere.
- **The same video in several qualities:** a list of sources with a `height` or a `label` each. They fill the quality menu, the first is played first, and a change keeps the place and whether it was playing.

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="Building a screen with nuvui"
      src={[
        { src: "/docs/clips/demo-720.webm", type: "video/webm" },
        { src: "/docs/clips/demo-720.mp4", type: "video/mp4" },
      ]}
      poster="/docs/clips/poster.jpg"
    />
  );
}
```

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="Two qualities, remembered"
      src={[
        { src: "/docs/clips/demo-720.mp4", height: 720 },
        { src: "/docs/clips/demo-360.mp4", height: 360 },
      ]}
      poster="/docs/clips/poster.jpg"
      persist="docs-video"
    />
  );
}
```

## Captions and subtitles

Give each WebVTT file as a track. A track with `default` is shown from the start, unless the viewer turned captions off before. The captions button turns them on and off, and the settings menu chooses the language and the size.

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="Captions in two languages"
      src="/docs/clips/demo-720.mp4"
      poster="/docs/clips/poster.jpg"
      tracks={[
        {
          kind: "captions",
          src: "/docs/clips/captions.en.vtt",
          srcLang: "en",
          label: "English",
          default: true,
        },
        {
          kind: "subtitles",
          src: "/docs/clips/captions.es.vtt",
          srcLang: "es",
          label: "Español",
        },
      ]}
    />
  );
}
```

The player draws the captions itself rather than leaving them to the browser, so they're the same in every browser, take your theme, and come in the size the viewer picked, measured against the width of the frame. The italics and voices in a cue are kept. A track on another site needs that site to allow it with CORS, and the player needs `crossOrigin="anonymous"`.

The same words can sit beside the video as text, with the line being said marked: that's [MediaTranscript](media-transcript.md).

## Chapters and previews

A chapters track, or a `chapters` list, splits the seek bar into parts with a gap between each. A WebVTT thumbnails file, as video services make them, gives a frame over the bar where the pointer hovers, beside the chapter's name and the time.

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="A clip in three chapters"
      src="/docs/clips/demo-720.mp4"
      poster="/docs/clips/poster.jpg"
      tracks={[{ kind: "chapters", src: "/docs/clips/chapters.vtt" }]}
      thumbnails="/docs/clips/thumbnails.vtt"
    />
  );
}
```

```tsx
<VideoPlayer
  src="/videos/intro.mp4"
  chapters={[
    { start: 0, title: "Getting started" },
    { start: 95, title: "Building the screen" },
    { start: 310, title: "Shipping it" },
  ]}
  thumbnails="/videos/intro-thumbnails.vtt"
/>
```

A thumbnails file has a cue for each span of time, naming an image and, when frames share one image, where in it the frame is:

```txt title="intro-thumbnails.vtt"
WEBVTT

00:00:00.000 --> 00:00:02.000
intro-thumbnails.jpg#xywh=0,0,160,90

00:00:02.000 --> 00:00:04.000
intro-thumbnails.jpg#xywh=160,0,160,90
```

## Streaming

An address that ends in `.m3u8` is an HLS stream, and one that ends in `.mpd` is DASH. When the address doesn't say, give the source a `type`. Hand the player the library that plays it, as a function that imports it:

```tsx
"use client";

import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="An HLS stream"
      src="/docs/clips/hls/index.m3u8"
      poster="/docs/clips/poster.jpg"
      hls={() => import("hls.js")}
    />
  );
}
```

```tsx
"use client";

import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="A DASH stream"
      src="/docs/clips/dash/index.mpd"
      poster="/docs/clips/poster.jpg"
      dash={() => import("dashjs")}
    />
  );
}
```

- **The library is loaded when a stream plays, and only then.** The function is yours, so your bundler sees the import and splits it into a file of its own, and an app that never streams never loads it.
- **A stream's qualities fill the quality menu,** with Auto first, which is the library choosing as the connection allows, and says which quality it's on now. A stream's audio tracks fill a menu of their own.
- **Safari plays HLS by itself.** Where `hls.js` isn't given or can't run, and the browser can play HLS, the player lets it. Then there's no quality menu, since the browser chooses.
- **In a server component,** a function can't be handed to a client component. Put the player in a file of your own with `"use client"` at the top, as these examples are.
- **`hlsConfig` and `dashSettings`** are passed to the library as they are, for anything the player doesn't set.
- **`attachSource`** plays a source yourself. It's given the media element and the source, and returns what undoes it. Use it for DRM, or a library of your own.

## Loading less

Each player loads the video's length and first frame by default, which is `preload="metadata"`. On a page with many videos:

- **`lazy`** loads nothing until the player is near the screen.
- **`facade`** puts only the poster and a play button on the page, and the video at the first press, which then plays.

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="Loaded at the first press"
      src="/docs/clips/demo-720.mp4"
      poster="/docs/clips/poster.jpg"
      facade
    />
  );
}
```

## Remembering settings

With `persist`, the viewer's volume, mute, speed, captions, caption size and quality are kept between visits, in `localStorage`. Give it a key, `persist="course-player"`, so that two kinds of player in one app keep their own, or `persist` alone for one key shared by all. It's off unless you ask for it, since some apps can't store anything without the visitor's consent. In a browser that refuses storage, the player plays as if nothing was kept.

## Ambient light

`ambient` puts a soft glow around the frame, in the colors of the picture, drawn from it a few times a second. It's off when the visitor asks for less motion, in fullscreen, and where the browser forces its own colors. Give the player room around it for the glow to be seen.

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <div className="w-full px-6 py-8">
      <VideoPlayer
        title="Ambient light"
        src="/docs/clips/demo-720.mp4"
        poster="/docs/clips/poster.jpg"
        ambient
      />
    </div>
  );
}
```

## One at a time

Players with the same `exclusive` group pause each other: starting one pauses the one playing. `exclusive` alone puts a player in one group shared by all.

## Your own controls

With `controls={false}`, the player draws none of its controls, and the parts are yours to lay out as its children, over the picture. Each part reads the player it's in.

```tsx
import {
  MediaPlayButton,
  MediaSeek,
  MediaSkipButton,
  MediaTime,
  VideoPlayer,
} from "@nuvui/media/video-player";

// The player's own controls off, and a few of its parts laid out across
// the top of the picture instead.
export default function Example() {
  return (
    <VideoPlayer
      title="Controls of your own"
      src="/docs/clips/demo-720.mp4"
      poster="/docs/clips/poster.jpg"
      controls={false}
    >
      <div className="absolute inset-x-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2">
        <MediaSkipButton seconds={-10} />
        <MediaPlayButton />
        <MediaSkipButton seconds={10} />
        <MediaSeek />
        <MediaTime />
      </div>
    </VideoPlayer>
  );
}
```

| Part | What it is |
| --- | --- |
| `MediaPlayButton` | Plays and pauses, and plays again from the start at the end. |
| `MediaSkipButton` | Goes back or ahead `seconds`, which is below zero for back. |
| `MediaSeek` | The seek bar, with chapters, what's loaded, and the preview over it. |
| `MediaTime` | The time played and the length, or the time left. A press swaps them. |
| `MediaVolume` | Mute, and the volume beside it with a mouse. |
| `MediaCaptionsButton` | Captions on and off. Not shown when there are none. |
| `MediaSettings` | The menu: speed, quality, captions and their size, audio tracks, and the shortcuts. |
| `MediaPictureInPictureButton` | Picture in picture. Not shown where the browser has none. |
| `MediaFullscreenButton` | Fullscreen. Not shown where the browser has none. |

## From your app

`handleRef` plays, pauses and seeks the player, and hands you its media element.

```tsx
const player = useRef<MediaPlayerHandle>(null);

<VideoPlayer src="/videos/intro.mp4" title="Intro" handleRef={player} />
<button onClick={() => player.current?.seek(95)}>Go to Building the screen</button>
```

`onTimeUpdate` is called about four times a second while it plays, with the time in seconds, and is where to save how far someone got. Give that back as `startTime` next time.

## VideoPlayer props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `tracks` | `MediaTrackItem[]` |  | Captions, subtitles and chapters, as WebVTT files. |
| `chapters` | `MediaChapter[]` |  | Chapters, which replace a chapters track if there is one. |
| `defaultMuted` | `boolean` | `false` |  |
| `defaultVolume` | `number` | `1` | From 0 to 1. |
| `defaultRate` | `number` | `1` |  |
| `loop` | `boolean` |  |  |
| `startTime` | `number` |  | Where to start, in seconds. |
| `crossOrigin` | `"anonymous" \| "use-credentials"` |  |  |
| `rates` | `number[]` | `[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]` | The speeds in the menu. |
| `persist` | `string \| boolean` |  | Keeps volume, speed, captions and quality between visits, in `localStorage`, under this key, or "nuvui-media" with `true`. |
| `exclusive` | `string \| boolean` |  | Starting this player pauses every other player in the same group. A name for the group, or `true` for one shared by all. |
| `hls` | `HlsLoader` |  | Loads hls.js for an HLS stream: `() => import("hls.js")`. |
| `dash` | `DashLoader` |  | Loads dashjs for a DASH stream: `() => import("dashjs")`. |
| `hlsConfig` | `Record<string, unknown>` |  | Passed to `new Hls()`. |
| `dashSettings` | `Record<string, unknown>` |  | Passed to dashjs's `updateSettings()`. |
| `attachSource` | `((media: HTMLMediaElement, source: MediaSourceItem) => (() => void) \| undefined)` |  | Plays the source yourself, for DRM or a library of your own: given the media element and the source, it returns what undoes it. |
| `labels` | `Partial<MediaLabels>` |  | The words, to translate the player. |
| `handleRef` | `React.Ref<MediaPlayerHandle>` |  |  |
| `onPlay` | `(() => void)` |  |  |
| `onPause` | `(() => void)` |  |  |
| `onEnded` | `(() => void)` |  |  |
| `onTimeUpdate` | `((time: number) => void)` |  | About four times a second while it plays, with the time in seconds. |
| `onError` | `((kind: StreamError) => void)` |  |  |
| `src` (required) | `string \| MediaSourceItem[] \| MediaSourceItem` |  | What to play: an address, a source, or several. Sources with a `height` or a `label` are qualities, and fill the quality menu. Sources without are alternatives, such as WebM and MP4, of which the browser plays the first it can. An `.m3u8` or `.mpd` address is a stream. |
| `poster` | `string` |  | The picture shown before it plays. |
| `title` | `string` |  | The video's title: the player's name, and what the lock screen shows. |
| `aria-label` | `string` |  | The player's name for a screen reader. Defaults to `title`. |
| `thumbnails` | `string` |  | A WebVTT file of frames for the preview over the seek bar. |
| `autoPlay` | `boolean` |  | Starts on its own. Only allowed muted, as browsers require, so it's muted when this is set. Moving video that starts by itself is a problem for some people: give it a reason. |
| `preload` | `"auto" \| "metadata" \| "none"` | `"metadata"` | How much to load before it plays. With `lazy`, nothing until the player is near the screen. |
| `lazy` | `boolean` |  | Loads nothing until the player is near the screen. |
| `facade` | `boolean` |  | Shows only the poster and a play button, and puts the video on the page at the first press. For a page with many videos. |
| `skip` | `number` | `10` | Seconds the J and L keys and a double tap go. |
| `ambient` | `boolean` |  | A soft glow around the frame in the video's own colors. |
| `controls` | `boolean` | `true` | The player's own controls. Set to false to lay out your own from the parts, as children. |
| `children` | `ReactNode` |  | Over the video: your own controls from the parts, or anything else. |

It also takes the attributes of a `section`, which is what it's drawn as.

## MediaSourceItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `src` (required) | `string` |  |  |
| `type` | `string` |  | Its MIME type, when the address doesn't say what it is. |
| `label` | `string` |  | Its name in the quality menu, such as "1080p". |
| `height` | `number` |  | Its height in pixels, which orders the quality menu. |

## MediaTrackItem

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `src` (required) | `string` |  |  |
| `kind` (required) | `"captions" \| "chapters" \| "descriptions" \| "metadata" \| "subtitles"` |  |  |
| `srcLang` | `string` |  | Its language, such as "en" or "pt-BR". |
| `label` | `string` |  | Its name in the captions menu. |
| `default` | `boolean` |  | Shown from the start, unless the viewer turned captions off before. |

## MediaChapter

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `start` (required) | `number` |  |  |
| `end` | `number` |  | Where it ends. The next chapter's start, or the end, when left out. |
| `title` (required) | `string` |  |  |

## MediaPlayerHandle

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `play` (required) | `() => void` |  |  |
| `pause` (required) | `() => void` |  |  |
| `toggle` (required) | `() => void` |  |  |
| `seek` (required) | `(time: number) => void` |  |  |
| `media` (required) | `HTMLMediaElement \| null` |  | The media element, once it's on the page. |
| `store` (required) | `MediaStore` |  | The player's state, for a part outside it such as `MediaTranscript`. |

## Translation

Every word the player shows or says is in `labels`, in English until you give another. The ones that put a number or a name into a sentence are functions.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `video` (required) | `string` |  | The video player's name when it's given no `aria-label` and no `title`. |
| `audio` (required) | `string` |  | The audio player's name when it's given no `aria-label` and no `title`. |
| `transcript` (required) | `string` |  | The transcript's name when it's given no `aria-label`. |
| `play` (required) | `string` |  |  |
| `pause` (required) | `string` |  |  |
| `replay` (required) | `string` |  |  |
| `mute` (required) | `string` |  |  |
| `unmute` (required) | `string` |  |  |
| `volume` (required) | `string` |  |  |
| `seek` (required) | `string` |  | The seek bar's name. |
| `enterFullscreen` (required) | `string` |  |  |
| `exitFullscreen` (required) | `string` |  |  |
| `enterPictureInPicture` (required) | `string` |  |  |
| `exitPictureInPicture` (required) | `string` |  |  |
| `captions` (required) | `string` |  |  |
| `settings` (required) | `string` |  |  |
| `speed` (required) | `string` |  |  |
| `normalSpeed` (required) | `string` |  | The speed of 1, in the speed menu. |
| `quality` (required) | `string` |  |  |
| `auto` (required) | `(current?: string) => string` |  | Quality chosen by the player, with the one it's on now if known. |
| `audioTrack` (required) | `string` |  |  |
| `off` (required) | `string` |  | Captions turned off, in the captions menu. |
| `captionSize` (required) | `string` |  |  |
| `small` (required) | `string` |  |  |
| `medium` (required) | `string` |  |  |
| `large` (required) | `string` |  |  |
| `skipBack` (required) | `(seconds: number) => string` |  |  |
| `skipAhead` (required) | `(seconds: number) => string` |  |  |
| `showRemaining` (required) | `string` |  | The time button's name while it shows the time played. |
| `showElapsed` (required) | `string` |  | The time button's name while it shows the time left. |
| `live` (required) | `string` |  |  |
| `loading` (required) | `string` |  |  |
| `errorNetwork` (required) | `string` |  |  |
| `errorDecode` (required) | `string` |  |  |
| `errorUnsupported` (required) | `string` |  |  |
| `audioErrorNetwork` (required) | `string` |  | The same three, for the audio player. |
| `audioErrorDecode` (required) | `string` |  |  |
| `audioErrorUnsupported` (required) | `string` |  |  |
| `retry` (required) | `string` |  |  |
| `shortcuts` (required) | `string` |  |  |
| `close` (required) | `string` |  |  |
| `hours` (required) | `(count: number) => string` |  | Spoken lengths of time, for the seek bar's value. |
| `minutes` (required) | `(count: number) => string` |  |  |
| `seconds` (required) | `(count: number) => string` |  |  |
| `timeOf` (required) | `(current: string, total: string) => string` |  | The seek bar's value: "1 minute 5 seconds of 4 minutes". |
| `captionsOn` (required) | `(track: string) => string` |  | Said when captions are turned on, with the track's name. |
| `captionsOff` (required) | `string` |  |  |
| `speedChanged` (required) | `(rate: string) => string` |  |  |
| `qualityChanged` (required) | `(quality: string) => string` |  |  |
| `shortcutPlay` (required) | `string` |  | What each shortcut does, in the shortcuts sheet. |
| `shortcutVolume` (required) | `string` |  |  |
| `shortcutMute` (required) | `string` |  |  |
| `shortcutFullscreen` (required) | `string` |  |  |
| `shortcutCaptions` (required) | `string` |  |  |
| `shortcutJump` (required) | `string` |  |  |
| `shortcutSpeed` (required) | `string` |  |  |
| `shortcutFrame` (required) | `string` |  |  |
| `shortcutShortcuts` (required) | `string` |  |  |

```tsx
<VideoPlayer
  src="/videos/intro.mp4"
  title="Introducción"
  labels={{
    play: "Reproducir",
    pause: "Pausar",
    captions: "Subtítulos",
    skipBack: (seconds) => `Retroceder ${seconds} segundos`,
  }}
/>
```

## Accessibility

### Keyboard

The keys work while focus is anywhere in the player, and a press on the picture gives it focus. A key the player uses goes no further, so your app's own shortcuts don't also act on it, and outside the player the keys are the page's.

| Key | What it does |
| --- | --- |
| <kbd>Space</kbd> or <kbd>K</kbd> | Plays and pauses. On a button, Space presses the button. |
| <kbd>J</kbd> and <kbd>L</kbd> | Back and ahead ten seconds, or `skip`. |
| <kbd>←</kbd> and <kbd>→</kbd> | Back and ahead five seconds. On a right-to-left page, the arrow that points back goes back. |
| <kbd>↑</kbd> and <kbd>↓</kbd> | Volume up and down. |
| <kbd>M</kbd> | Mutes and unmutes. |
| <kbd>F</kbd> | Fullscreen. |
| <kbd>C</kbd> | Captions on and off. |
| <kbd>0</kbd> to <kbd>9</kbd> | Goes to that tenth of the way. |
| <kbd>&lt;</kbd> and <kbd>&gt;</kbd> | Slower and faster. |
| <kbd>,</kbd> and <kbd>.</kbd> | One frame back and ahead, while paused. |
| <kbd>?</kbd> | Shows these shortcuts. |

On the seek bar and the volume, the arrows move the slider, Page Up and Page Down move it further, and Home and End go to the ends.

### What the component handles

- **Every control is a button or a slider with a name,** and a button whose name changes says what it'll do now: Play, then Pause.
- **The seek bar's value is in words,** "1 minute 5 seconds of 4 minutes", and changes for a screen reader at most once a second, not with every frame.
- **Changes the viewer makes are said once,** in a live region: captions on, the speed, the quality, a double tap's skip.
- **The controls hide while it plays,** after a few seconds without a move, and come back on a move, a tap, a key, or focus on any control. They never hide while it's paused, while a menu is open, or while a control has focus.
- **On a touch screen,** every control is 44 pixels each way, a tap shows and hides the controls, and a double tap on either side skips.
- **Nothing starts with sound by itself.** `autoPlay` mutes the player, as browsers require anyway.
- **Forced colors, less motion and right to left** are each followed: the seek bar runs from the right on a right-to-left page.

### What you need to handle

- **Captions.** A video with speech needs a captions track, and it's yours to write or have written. A [transcript](media-transcript.md) beside it reads the same track.
- **A text alternative** for what's only seen. A description track, or the same information on the page.
- **A reason to autoplay.** Moving video that starts by itself is a problem for some people (WCAG 2.2.2). Start muted, and keep it short, or don't.
- **The title.** It's the player's name for a screen reader: say what the video is.

## On small screens

The controls keep their size. Under a touch screen the volume slider isn't there, since a phone's volume is in its buttons and a page can't change it. In a player under 26rem wide, picture in picture leaves the row, and the time shows only what's played.

## Server rendering and a strict policy

The server sends the video element with its poster and the browser's own controls, so it plays before the script arrives, or without it. Once the script runs, the player's controls take over.

Nothing the player draws needs a `style` attribute: what moves is set through the CSSOM. A stream played by `hls.js` or `dashjs` plays through Media Source Extensions, whose sources are `blob:` addresses, so a Content Security Policy needs `media-src blob:` beside your video's own origin. `hls.js` also starts a worker from a `blob:` address, which needs `worker-src blob:`, unless you pass `hlsConfig={{ enableWorker: false }}`.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-video-player-radius` | `var(--radius-lg)` | Corner radius of the player. |
| `--nuv-video-player-fg` | `var(--color-white)` | Color of the controls and their words. |
| `--nuv-video-player-bg` | `var(--color-black)` | Color behind the picture, seen where its shape doesn't fill the frame. |
| `--nuv-video-player-aspect` | `16/9` | The frame's shape, such as 4 / 3. Fullscreen fills the screen. |
| `--nuv-video-player-fit` | `contain` | How the picture fills the frame: contain shows all of it, cover fills it. |
| `--nuv-video-player-controls-bg` | `color-mix(in oklab, var(--color-black) 72%, transparent)` | The shade under the controls, at the bottom of the picture. |
| `--nuv-video-player-big-play-bg` | `color-mix(in oklab, var(--color-black) 60%, transparent)` | Background of the big play button over the poster. |
| `--nuv-video-player-caption-bg` | `color-mix(in oklab, var(--color-black) 78%, transparent)` | Background behind each line of captions. |
| `--nuv-video-player-caption-fg` | `var(--color-white)` | Color of the captions. |
| `--nuv-video-player-caption-scale` | `3.2cqi`, `2.4cqi`, `4.4cqi` | Size of the captions against the frame's width. Set by the size the viewer picks. |
| `--nuv-video-player-ambient-opacity` | `0.55` | How strong the ambient glow is. |

The controls the players share read these:

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-media-button-hover-bg` | `color-mix(in oklab, var(--color-white) 18%, transparent)` | Background of a control under the pointer. |
| `--nuv-media-live` | `var(--color-danger)` | Color of the dot beside Live. |
| `--nuv-media-track-bg` | `color-mix(in oklab, var(--color-white) 30%, transparent)` | Color of a slider's track. |
| `--nuv-media-accent` | `var(--color-primary)` | Color of what's played on the seek bar, the waveform and the volume, of the audio player's play button, and of the big button on hover. |
| `--nuv-media-fill` | `0` | How far a slider is, from 0 to 1. Set by the script. |
| `--nuv-media-thumb` | `var(--color-white)` | Color of a slider's handle. |
| `--nuv-media-buffered-bg` | `color-mix(in oklab, var(--color-white) 45%, transparent)` | Color of what's loaded on the seek bar. |
| `--nuv-media-part-buffered` | `0` | How much of a part of the seek bar is loaded, from 0 to 1. Set by the script. |
| `--nuv-media-part-fill` | `0` | How much of a part of the seek bar is played, from 0 to 1. Set by the script. |
| `--nuv-media-hover` | `0` | Where the pointer is across the seek bar, from 0 to 1. Set by the script. |
| `--nuv-media-preview-bg` | `color-mix(in oklab, var(--color-black) 82%, transparent)` | Background of the preview over the seek bar. |
| `--nuv-media-waveform-height` | `2.5rem` | Height of the waveform, in the audio player. |
| `--nuv-media-wave-bg` | `color-mix(in oklab, currentcolor 28%, transparent)` | Color of the waveform's bars that aren't played yet, in the audio player. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-video-player` | VideoPlayer |
| `.nuv-video-player__ambient` | The glow behind the frame, with `ambient`. |
| `.nuv-video-player__bar` | The row of buttons under the seek bar. |
| `.nuv-video-player__big-play` | The big play button over the poster. |
| `.nuv-video-player__captions` | The captions shown now. |
| `.nuv-video-player__controls` | The controls, over the bottom of the picture. |
| `.nuv-video-player__cue` | A line of captions. |
| `.nuv-video-player__error` | What went wrong, and the button to try again. |
| `.nuv-video-player__frame` | The frame the picture is in. |
| `.nuv-video-player__media` | The video element. |
| `.nuv-video-player__pip` | The picture in picture button, which a narrow player leaves out. |
| `.nuv-video-player__poster` | The poster, with `facade`, before the video is on the page. |
| `.nuv-video-player__ripple` | The mark a double tap leaves. |
| `.nuv-video-player__seek` | The seek bar in the controls. |
| `.nuv-video-player__spacer` | The space between the buttons on each side. |
| `.nuv-video-player__spinner` | Shown while it waits for the video. |
| `.nuv-video-player__surface` | The layer over the picture that takes a press or a tap. |

The parts the players share:

| Class | What it's on |
| --- | --- |
| `.nuv-media-button` | A control with an icon. |
| `.nuv-media-hidden` | Words for a screen reader only. |
| `.nuv-media-icon` | A control's icon. |
| `.nuv-media-menu` | The settings menu and its parts. |
| `.nuv-media-menu__name` | A setting's name in the menu. |
| `.nuv-media-menu__value` | A setting's value in the menu. |
| `.nuv-media-seek` | The seek bar. |
| `.nuv-media-seek__buffered` | What's loaded of a part. |
| `.nuv-media-seek__chapter` | The chapter's name in the preview. |
| `.nuv-media-seek__fill` | What's played of a part. |
| `.nuv-media-seek__frame` | The frame in the preview. |
| `.nuv-media-seek__part` | One chapter, or the whole bar when there are none. |
| `.nuv-media-seek__parts` | The chapters along the seek bar. |
| `.nuv-media-seek__preview` | What shows over the bar where the pointer is. |
| `.nuv-media-seek__time` | The time in the preview. |
| `.nuv-media-shortcuts__list` | The list in the shortcuts sheet. |
| `.nuv-media-shortcuts__row` | A shortcut and what it does. |
| `.nuv-media-slider` | A slider: the seek bar or the volume. |
| `.nuv-media-slider__fill` | What's filled of a slider's track. |
| `.nuv-media-slider__thumb` | A slider's handle. |
| `.nuv-media-slider__track` | A slider's track. |
| `.nuv-media-time` | The time. |
| `.nuv-media-time--live` | Live, in place of the time, for a live stream. |
| `.nuv-media-time__total` | The length after the time played, which a narrow player leaves out. |
| `.nuv-media-volume` | Mute and the volume slider. |
| `.nuv-media-volume__slider` | The volume slider. |
| `.nuv-media-waveform` | The waveform to seek on, in the audio player. |
| `.nuv-media-waveform__bars` | The box the bars are drawn in. |
| `.nuv-media-waveform__played` | The bars of what's played, in the accent color. |
| `.nuv-media-waveform__shape` | The bars, drawn twice: once whole, once for what's played. |

## Do and don't

- **Do** give every video a `title` that says what it is, and a captions track if anyone speaks.
- **Do** give a poster, so the player has a picture before it plays, and its shape is known before the video loads.
- **Do** use `facade` or `lazy` on a page with many videos.
- **Don't** autoplay with sound. Browsers refuse it, and the player mutes it.
- **Don't** put a player in a box narrower than its controls. Under about 320 pixels, use the parts and lay out fewer.
