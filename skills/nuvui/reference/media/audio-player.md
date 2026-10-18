<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/media/audio-player.mdx. Don't edit it here: run `pnpm skill`. -->

# AudioPlayer

A sound with its own controls. Play, seek on a bar or a waveform, the time, volume and speed, from a pointer, a finger or the keyboard. One row, a podcast layout, or a voice message small enough for a chat. Plays files, and HLS and DASH streams.

```tsx
import { AudioPlayer } from "@nuvui/media/audio-player";

export default function Example() {
  return <AudioPlayer title="Demo track" src="/docs/clips/demo_audio.mp3" />;
}
```

## Install

```sh
pnpm add @nuvui/media @nuvui/react
```

## Import

```tsx
import { AudioPlayer } from "@nuvui/media/audio-player";

<AudioPlayer title="Designing for every screen" src="/audio/episode-12.mp3" />
```

`title` names the player for a screen reader and is what the phone's lock screen shows while it plays. Without one, give an `aria-label`.

## Layouts

`layout` chooses how much the player shows.

- **`bar`,** the default: one row, with play, the seek bar or the waveform, the time, the volume and the settings. For anywhere.
- **`podcast`:** the `artwork`, the `title` and who it's by in `artist`, a larger play button between back 15 seconds and ahead 30, and the seek bar or the waveform across. The artwork sits beside the rest when the player is 30rem wide or more, and above it, smaller, when it isn't.
- **`voice`:** a play button, the waveform, the time and a press for the speed, small enough for a message in a chat. It has no frame of its own and takes the color of the text around it, so it sits in a bubble of any color.

```tsx
"use client";

import { AudioPlayer } from "@nuvui/media/audio-player";
import { useEffect, useState } from "react";

// The peaks were worked out once, when the sound was published, and are
// fetched beside it.
export default function Example() {
  const [peaks, setPeaks] = useState<number[]>();
  useEffect(() => {
    fetch("/docs/clips/demo_audio.peaks.json")
      .then((response) => response.json())
      .then(setPeaks)
      .catch(() => setPeaks(undefined));
  }, []);

  return (
    <AudioPlayer
      layout="podcast"
      title="Episode 12"
      artist="nuvui radio"
      artwork="/docs/clips/demo_audio.jpg"
      src="/docs/clips/demo_audio.mp3"
      tracks={[
        { kind: "chapters", src: "/docs/clips/demo_audio.chapters.vtt" },
      ]}
      peaks={peaks}
    />
  );
}
```

```tsx
"use client";

import { AudioPlayer, computePeaks } from "@nuvui/media/audio-player";
import { useEffect, useState } from "react";

const src = "/docs/clips/demo_audio.mp3";

// Two messages, played one at a time: starting one pauses the other. The
// peaks are worked out in the browser, as for a recording just made.
export default function Example() {
  const [peaks, setPeaks] = useState<number[]>();
  useEffect(() => {
    const controller = new AbortController();
    computePeaks(src, { count: 48, signal: controller.signal })
      .then(setPeaks)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="self-start rounded-2xl rounded-bl-sm bg-surface px-3 py-2 text-surface-foreground">
        <AudioPlayer
          layout="voice"
          aria-label="Voice message from Ana"
          src={src}
          duration={62.8}
          peaks={peaks}
          exclusive="chat"
        />
      </div>
      <div className="self-end rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
        <AudioPlayer
          layout="voice"
          aria-label="Your voice message"
          src={src}
          duration={62.8}
          peaks={peaks}
          exclusive="chat"
        />
      </div>
    </div>
  );
}
```

`skipBack` and `skipAhead` change how far the podcast's buttons go, and the J and L keys in every layout.

## A waveform

Give the player `peaks` and it draws the sound's waveform in place of the seek bar, with what's played in the accent color and the time under the pointer. It's a slider like the seek bar, for the keyboard and a screen reader.

Peaks are how loud the sound is along its length, from the start to the end. A few hundred is plenty, in any scale: the loudest is drawn the full height. Work them out once, when the file is uploaded, and keep them beside it, as the podcast example fetches them.

For a recording just made, or a short file, `computePeaks` works them out in the browser:

```tsx
import { computePeaks } from "@nuvui/media/audio-player";

const peaks = await computePeaks("/audio/message.mp3", { count: 48 });
// Or from a recording: computePeaks(blob)
```

The browser decodes the sound on a thread of its own, and the peaks are measured in short slices that leave the page free to draw. It takes an address, a `Blob` or the bytes, and `signal` stops it, as when the component that asked has gone. Decoding the whole of a long file in the page takes memory, which is why an hour's episode is better done on a server.

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `count` | `number` | `200` | How many peaks, spread evenly along the sound. |
| `signal` | `AbortSignal` |  | Stops the work, as when the component that asked is gone. |
| `init` | `RequestInit` |  | Passed to `fetch` when the source is an address, as for credentials. |

## Sources and streams

`src` takes an address, a source, or a list of the same sound in several formats, of which the browser plays the first it can:

```tsx
<AudioPlayer
  title="Designing for every screen"
  src={[
    { src: "/audio/episode-12.ogg", type: "audio/ogg" },
    { src: "/audio/episode-12.mp3", type: "audio/mpeg" },
  ]}
/>
```

An address that ends in `.m3u8` or `.mpd` is a stream, played as the [video player plays one](video-player.md#streaming): hand it `hls={() => import("hls.js")}` or `dash={() => import("dashjs")}`, and the library is loaded when it plays and only then. `attachSource` plays a source yourself.

## Chapters and a transcript

A chapters track, or a `chapters` list, names the part of the episode under the pointer, over the seek bar or the waveform, and splits the seek bar into parts.

A sound has no picture to draw captions on. Give a recording with speech a captions track all the same, and put a [MediaTranscript](media-transcript.md) beside it: the words, with the line being said marked, and a press on a line to play from there. That's what someone who can't hear it reads.

## Loading less

Each player loads the sound's length by default, which is `preload="metadata"`. In a long list, such as a chat with many voice messages, `preload="none"` loads nothing until one plays, and `duration` gives the length to show until then:

```tsx
<AudioPlayer layout="voice" src={message.url} duration={message.seconds} preload="none" />
```

## Remembering settings

With `persist`, the listener's volume, mute and speed are kept between visits, in `localStorage`. Give it a key, `persist="podcast"`, or `persist` alone for one key shared by all. It's off unless you ask for it.

## One at a time

Players with the same `exclusive` group pause each other, video players among them: starting one pauses the one playing. The voice example puts both messages in one group.

## Your own controls

With `controls={false}`, the player draws none of its controls, and the parts are yours to lay out as its children. Each part reads the player it's in.

```tsx
import {
  AudioPlayer,
  MediaPlayButton,
  MediaSkipButton,
  MediaTime,
} from "@nuvui/media/audio-player";

// The player's own controls off, and a few of its parts in a row of your
// own, with no seek bar.
export default function Example() {
  return (
    <AudioPlayer
      title="Controls of your own"
      src="/docs/clips/demo_audio.mp3"
      controls={false}
    >
      <div className="flex items-center justify-center gap-1">
        <MediaSkipButton seconds={-15} />
        <MediaPlayButton />
        <MediaSkipButton seconds={30} />
        <MediaTime />
      </div>
    </AudioPlayer>
  );
}
```

| Part | What it is |
| --- | --- |
| `MediaPlayButton` | Plays and pauses, and plays again from the start at the end. |
| `MediaSkipButton` | Goes back or ahead `seconds`, which is below zero for back. |
| `MediaSeek` | The seek bar, with chapters and what's loaded. |
| `MediaWaveform` | The waveform to seek on, from `peaks`. |
| `MediaTime` | The time played and the length, or the time left. A press swaps them. |
| `MediaVolume` | Mute, and the volume beside it with a mouse. |
| `MediaSettings` | The menu: speed, a stream's quality and audio track, and the shortcuts. |

## From your app

`handleRef` plays, pauses and seeks the player, and hands you its media element. It's also what a [MediaTranscript](media-transcript.md) reads.

```tsx
const player = useRef<MediaPlayerHandle>(null);

<AudioPlayer src="/audio/episode-12.mp3" title="Episode 12" handleRef={player} />
<button onClick={() => player.current?.seek(95)}>Go to the interview</button>
```

`onTimeUpdate` is called about four times a second while it plays, with the time in seconds, and is where to save how far someone got. Give that back as `startTime` next time.

## AudioPlayer props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `tracks` | `MediaTrackItem[]` |  | Captions, subtitles and chapters, as WebVTT files. |
| `chapters` | `MediaChapter[]` |  | Chapters, which replace a chapters track if there is one. |
| `defaultMuted` | `boolean` | `false` |  |
| `defaultVolume` | `number` | `1` | From 0 to 1. |
| `defaultRate` | `number` | `1` |  |
| `loop` | `boolean` |  |  |
| `startTime` | `number` |  | Where to start, in seconds. |
| `preload` | `"auto" \| "metadata" \| "none"` | `"metadata"` | How much to load before it plays. |
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
| `src` (required) | `string \| MediaSourceItem[] \| MediaSourceItem` |  | What to play: an address, a source, or several formats of the same sound, such as Ogg and MP3, of which the browser plays the first it can. An `.m3u8` or `.mpd` address is a stream. |
| `title` | `string` |  | The title: the player's name, and what the lock screen shows. |
| `artist` | `string` |  | Who it's by: the show, the speaker or the artist. Under the title in the podcast layout, and on the lock screen. |
| `artwork` | `string` |  | A square picture, shown in the podcast layout and on the lock screen. |
| `aria-label` | `string` |  | The player's name for a screen reader. Defaults to `title`. |
| `layout` | `"bar" \| "podcast" \| "voice"` | `"bar"` | - `bar`: one row of controls, for anywhere. - `podcast`: the artwork, the title, skip buttons and a larger play button. - `voice`: a play button, the waveform, the time and the speed, small enough for a message in a chat. |
| `peaks` | `readonly number[]` |  | The waveform to seek on, in place of the seek bar: how loud it is along its length, in any scale. `computePeaks` works them out from a file. |
| `duration` | `number` |  | The length in seconds, shown until the file has said its own. For a list of messages with `preload="none"`, which load nothing until played. |
| `skipBack` | `number` | `15` | Seconds J and the back button go. |
| `skipAhead` | `number` | `30` | Seconds L and the ahead button go. |
| `controls` | `boolean` | `true` | The player's own controls. Set to false to lay out your own from the parts, as children. |
| `children` | `ReactNode` |  | Your own controls from the parts, with `controls={false}`. |

It also takes the attributes of a `section`, which is what it's drawn as. `MediaSourceItem`, `MediaTrackItem`, `MediaChapter` and `MediaPlayerHandle` are as on the [VideoPlayer page](video-player.md#mediasourceitem).

## Translation

Every word is in `labels`, the same as the video player's. The audio player's own are `audio`, its name when it has no title, and the three for what went wrong: `audioErrorNetwork`, `audioErrorDecode` and `audioErrorUnsupported`. The [VideoPlayer page](video-player.md#translation) lists them all.

## Accessibility

### Keyboard

The keys work while focus is anywhere in the player. A key the player uses goes no further, so your app's own shortcuts don't also act on it.

| Key | What it does |
| --- | --- |
| <kbd>Space</kbd> or <kbd>K</kbd> | Plays and pauses. On a button, Space presses the button. |
| <kbd>J</kbd> and <kbd>L</kbd> | Back 15 seconds and ahead 30, or `skipBack` and `skipAhead`. |
| <kbd>←</kbd> and <kbd>→</kbd> | Back and ahead five seconds. On a right-to-left page, the arrow that points back goes back. |
| <kbd>↑</kbd> and <kbd>↓</kbd> | Volume up and down. |
| <kbd>M</kbd> | Mutes and unmutes. |
| <kbd>0</kbd> to <kbd>9</kbd> | Goes to that tenth of the way. |
| <kbd>&lt;</kbd> and <kbd>&gt;</kbd> | Slower and faster. |
| <kbd>?</kbd> | Shows these shortcuts. |

On the seek bar, the waveform and the volume, the arrows move the slider, Page Up and Page Down move it further, and Home and End go to the ends.

### What the component handles

- **Every control is a button or a slider with a name,** and a button whose name changes says what it'll do now: Play, then Pause. The voice layout's speed is named with its value, "Speed 1.5×".
- **The seek bar's and the waveform's value is in words,** "1 minute 5 seconds of 4 minutes", and changes for a screen reader at most once a second.
- **Changes the listener makes are said once,** in a live region, such as the speed.
- **On a touch screen,** every control answers a tap 44 pixels each way, the voice layout's small speed too.
- **Nothing starts by itself.** The audio player has no `autoPlay`.
- **Forced colors, less motion and right to left** are each followed: the waveform is mirrored on a right-to-left page.

### What you need to handle

- **A transcript** of a recording with speech, for anyone who can't hear it (WCAG 1.2.1). A captions track and a [MediaTranscript](media-transcript.md) are one way.
- **The title.** It's the player's name for a screen reader: say what the sound is. In a chat, name each message for who sent it, as the voice example does.

## Server rendering and a strict policy

The server sends the audio element with the browser's own controls, so it plays before the script arrives, or without it. Once the script runs, the player's controls take over.

Nothing the player draws needs a `style` attribute: the waveform is drawn as SVG, and what moves is set through the CSSOM. `computePeaks` fetches the file, so its origin needs to be in `connect-src`.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-audio-player-track-bg` | `color-mix(in oklab, currentcolor 18%, transparent)` | Color of a slider's track. |
| `--nuv-audio-player-buffered-bg` | `color-mix(in oklab, currentcolor 32%, transparent)` | Color of what's loaded on the seek bar. |
| `--nuv-audio-player-hover-bg` | `color-mix(in oklab, currentcolor 10%, transparent)` | Background of a control under the pointer. |
| `--nuv-audio-player-border` | `var(--color-border)` | Color of the player's border, in the bar and podcast layouts. |
| `--nuv-audio-player-radius` | `var(--radius-lg)` | Corner radius of the player. |
| `--nuv-audio-player-bg` | `var(--color-surface)` | Background of the player, in the bar and podcast layouts. |
| `--nuv-audio-player-fg` | `var(--color-surface-foreground)` | Color of the controls and their words. |
| `--nuv-audio-player-play-fg` | `var(--color-primary-foreground)` | Color of the play button's icon. |
| `--nuv-audio-player-muted-fg` | `var(--color-muted-foreground)` | Color of who it's by, under the title. |
| `--nuv-audio-player-accent` | `currentcolor` | Color of what's played, in the voice layout. The text's color by default. |
| `--nuv-audio-player-voice-width` | `16rem` | Width of the voice layout. |

The parts the players share read the variables listed on the [VideoPlayer page](video-player.md#css-variables), `--nuv-media-accent` among them.

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-audio-player` | AudioPlayer |
| `.nuv-audio-player__artist` | Who it's by. |
| `.nuv-audio-player__artwork` | The artwork, in the podcast layout. |
| `.nuv-audio-player__bar` | The row of controls. |
| `.nuv-audio-player__error` | What went wrong, and the button to try again. |
| `.nuv-audio-player__group` | A group of controls in the podcast layout's row. |
| `.nuv-audio-player__group--end` | The group at the end of the row. |
| `.nuv-audio-player__media` | The audio element, with the browser's controls until the script runs. |
| `.nuv-audio-player__meta` | The title and who it's by, in the podcast layout. |
| `.nuv-audio-player__play` | The play button and the ring around it while it waits. |
| `.nuv-audio-player__play-button` | The play button. |
| `.nuv-audio-player__seek` | The seek bar or the waveform in the row. |
| `.nuv-audio-player__speed` | The speed, in the voice layout. |
| `.nuv-audio-player__spinner` | The ring that turns while it waits for the sound. |
| `.nuv-audio-player__time` | The time, in the voice layout. |
| `.nuv-audio-player__title` | The title. |
| `.nuv-audio-player__track` | The seek bar's row, in the podcast layout. |

The classes of the parts the players share are on the [VideoPlayer page](video-player.md#classes).

## Do and don't

- **Do** give every player a `title`, or an `aria-label` that says whose message it is.
- **Do** keep peaks beside a long file, worked out once, rather than working them out in every visitor's browser.
- **Do** use `preload="none"` with `duration` in a long list of messages.
- **Don't** put the voice layout in a bubble narrower than about 12rem. Set `--nuv-audio-player-voice-width` to fit, or use the parts.
