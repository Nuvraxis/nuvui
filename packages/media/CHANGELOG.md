# @nuvui/media

## 0.1.1

### Patch Changes

- Updated dependencies [[`23249f5`](https://github.com/Nuvraxis/nuvui/commit/23249f5adb5edd7f2e83429ae7b6de50e4397944)]:
  - @nuvui/react@0.8.0

## 0.1.0

### Minor Changes

- [#85](https://github.com/Nuvraxis/nuvui/pull/85) [`4aaa839`](https://github.com/Nuvraxis/nuvui/commit/4aaa83960a25da8abca345f5f5be259cbc42cccf) Thanks [@sajanv88](https://github.com/sajanv88)! - A new package, for video and sound.
  
  - `VideoPlayer` plays a video with its own controls over the browser's own player: play, a seek bar, volume, speed with the pitch kept, picture in picture and fullscreen, from a pointer, a finger or the keyboard. The controls hide while it plays and nothing moves, and come back on a move, a tap or a key.
  - `src` takes a file, the same video in several formats, or several qualities, which fill a quality menu. A change of quality keeps the place.
  - Captions and subtitles from WebVTT tracks are drawn by the player, in the theme and in a size the viewer picks. Chapters, from a track or a list, are gaps along the seek bar, and a thumbnails track gives a frame over it where the pointer hovers.
  - HLS and DASH streams play through hls.js and dashjs, which the app hands over as `hls={() => import("hls.js")}` and `dash={() => import("dashjs")}`, so they're loaded only when a stream plays. A stream's levels fill the quality menu, with Auto first. Safari plays HLS by itself when no library is given. `attachSource` hands over the media element for DRM or a library of the app's own.
  - `facade` puts only the poster and a play button on the page until the first press, and `lazy` loads nothing until the player is near the screen.
  - `persist` keeps the viewer's volume, speed, captions and quality between visits. `exclusive` lets only one player in a group play at a time. `ambient` casts a glow around the frame in the video's own colors.
  - Keyboard shortcuts work while focus is in the player, with a sheet of them on `?`. On a phone, a double tap on either side skips. The lock screen shows the title and controls it.
  - With `controls={false}`, the parts (`MediaPlayButton`, `MediaSeek`, `MediaTime`, `MediaVolume`, `MediaSettings` and the rest) lay out controls of your own.
  - The server sends the video with the browser's own controls, so it plays before the script runs, and nothing the player draws needs a `style` attribute.
  - `AudioPlayer` plays sound with the same sources, streams, keys and settings: one row by default, a podcast's layout with its artwork, title, a larger play button and buttons back 15 seconds and ahead 30, or a voice message small enough for a chat bubble, in the colors of the text around it.
  - `peaks` draws a waveform to seek on in place of the seek bar, with what's played in the accent color. `computePeaks` works them out from a file or a recording in the browser, and `duration` shows a length before anything has loaded.
  - `MediaTranscript` puts a player's captions beside it as text: the line being said is marked and kept in view in its own scroll box, a press on a line plays from there, and the speaker shows where it changes. It reads the captions shown, or the first captions track while none is.
  - It has no dependencies of its own.
