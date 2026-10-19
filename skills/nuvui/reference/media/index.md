<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/media/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Media

The @nuvui/media package. A video player and an audio player with captions in the theme, chapters, a waveform to seek on, a transcript that follows along, streaming with hls.js or dashjs, and controls for a pointer, a finger and the keyboard.

Video and sound are a package of their own, `@nuvui/media`. The players play through the browser's own `<video>` and `<audio>` elements, with nuvui's controls over them, and need nothing the core doesn't have.

| Component | What it is |
| --- | --- |
| [VideoPlayer](video-player.md) | A video with its own controls: play, seek with chapters and previews, volume, speed, quality, captions drawn in the theme, picture in picture and fullscreen. Plays files, and HLS and DASH streams. |
| [AudioPlayer](audio-player.md) | A sound with its own controls: play, seek on a bar or a waveform, the time, volume and speed. One row, a podcast layout, or a voice message small enough for a chat. |
| [MediaTranscript](media-transcript.md) | The words of a player's captions beside it, with the line being said marked and kept in view, and a press on a line to play from there. |

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

## Install

```sh
pnpm add @nuvui/media @nuvui/react
```

`@nuvui/react` is a peer dependency: the controls use the core's tokens, its menus and its tooltips. A file (MP4, WebM, MP3, Ogg) needs nothing else.

A stream needs a library the player loads when one plays, and only then. Install the one for the streams you have:

```sh
pnpm add hls.js   # for .m3u8 streams
pnpm add dashjs   # for .mpd streams
```

Safari plays HLS by itself, and the player lets it when no library is given. Every other browser needs `hls.js` for HLS, and every browser needs `dashjs` for DASH.

## Load the styles

Import the package's stylesheet once, after the core's:

```tsx title="app/layout.tsx"
import "@nuvui/react/styles.css";
import "@nuvui/media/styles.css";
```

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. Each component's styles are also on their own, at `@nuvui/media/css/video-player.css`, `audio-player.css` and `media-transcript.css`.

## Imports

Each component has an entry of its own, so an app with only sound loads only what sound needs:

```tsx
import { VideoPlayer } from "@nuvui/media/video-player";
import { AudioPlayer, computePeaks } from "@nuvui/media/audio-player";
import { MediaTranscript } from "@nuvui/media/media-transcript";
```

## What it keeps and what you keep

A player keeps its own state: whether it plays, the time, the volume, the speed, the captions shown. You hear about it through `onPlay`, `onPause`, `onEnded` and `onTimeUpdate`, and you can play, pause and seek it through `handleRef`. With `persist`, it keeps the listener's volume and speed between visits, and a video's captions and quality too, in the browser's storage, under a key you give.

## What it leaves out

- **Recording,** from a camera or a microphone.
- **DRM.** `attachSource` hands you the media element, so a DRM library or a vendor's player can take over the source.
- **Playlists,** one after another. Change `src` when one ends.
- **Ads,** and anything that plays between parts of a video.
- **A live visualizer** that moves with the sound. The waveform is drawn from peaks worked out before.
