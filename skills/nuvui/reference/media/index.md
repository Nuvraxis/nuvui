<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/media/index.mdx. Don't edit it here: run `pnpm skill`. -->

# Media

The @nuvui/media package. A video player with captions in the theme, chapters, previews over the seek bar, qualities, streaming with hls.js or dashjs, and controls for a pointer, a finger and the keyboard.

Video is a package of its own, `@nuvui/media`. It plays through the browser's own `<video>` element, with nuvui's controls over it, and needs nothing the core doesn't have. An audio player follows in the same package.

| Component | What it is |
| --- | --- |
| [VideoPlayer](video-player.md) | A video with its own controls: play, seek with chapters and previews, volume, speed, quality, captions drawn in the theme, picture in picture and fullscreen. Plays files, and HLS and DASH streams. |

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

Both files open with the same line naming the cascade layers, so the order you import them in doesn't decide which rule wins. The player's styles are also on their own, at `@nuvui/media/css/video-player.css`.

## What it keeps and what you keep

The player keeps its own state: whether it plays, the time, the volume, the speed, the captions shown. You hear about it through `onPlay`, `onPause`, `onEnded` and `onTimeUpdate`, and you can play, pause and seek it through `handleRef`. With `persist`, it keeps the viewer's volume, speed, captions and quality between visits, in the browser's storage, under a key you give.

## What it leaves out

- **Recording,** from a camera or a microphone.
- **DRM.** `attachSource` hands you the media element, so a DRM library or a vendor's player can take over the source.
- **Playlists,** one video after another. Change `src` when one ends.
- **Ads,** and anything that plays between parts of a video.
- **A transcript beside the video.** It's planned, in the same package.
