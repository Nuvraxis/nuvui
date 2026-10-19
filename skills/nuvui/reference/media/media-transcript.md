<!-- Written by apps/docs/scripts/agent-skill.mjs from apps/docs/content/docs/media/media-transcript.mdx. Don't edit it here: run `pnpm skill`. -->

# MediaTranscript

The words of a player's captions as text beside it or under it, with the line being said marked and kept in view, and a press on a line to play from there.

```tsx
"use client";

import { MediaTranscript } from "@nuvui/media/media-transcript";
import { type MediaPlayerHandle, VideoPlayer } from "@nuvui/media/video-player";
import { useRef } from "react";

// Beside the video where there's room, as tall as it is, and under it
// where there isn't.
export default function Example() {
  const player = useRef<MediaPlayerHandle>(null);
  return (
    <div className="grid w-full gap-3 md:grid-cols-[2fr_1fr]">
      <VideoPlayer
        title="Building a screen with nuvui"
        src="/docs/clips/demo-720.mp4"
        poster="/docs/clips/poster.jpg"
        tracks={[
          {
            kind: "captions",
            src: "/docs/clips/captions.en.vtt",
            srcLang: "en",
            label: "English",
          },
        ]}
        handleRef={player}
      />
      <div className="relative">
        <MediaTranscript
          player={player}
          className="md:absolute md:inset-0 md:[--nuv-media-transcript-height:none]"
        />
      </div>
    </div>
  );
}
```

## Install

```sh
pnpm add @nuvui/media @nuvui/react
```

## Import

Give the player a `handleRef`, and the transcript the same ref as `player`:

```tsx
"use client";

import { AudioPlayer, type MediaPlayerHandle } from "@nuvui/media/audio-player";
import { MediaTranscript } from "@nuvui/media/media-transcript";
import { useRef } from "react";

export function Episode() {
  const player = useRef<MediaPlayerHandle>(null);
  return (
    <>
      <AudioPlayer
        title="Episode 12"
        src="/audio/episode-12.mp3"
        tracks={[{ kind: "captions", src: "/audio/episode-12.en.vtt", srcLang: "en", label: "English", default: true }]}
        handleRef={player}
      />
      <MediaTranscript player={player} />
    </>
  );
}
```

A ref is made in a client component, so the player and its transcript go in a file of your own with `"use client"` at the top.

## Where the words come from

The transcript reads the player's captions: the track shown, or, while none is, as when the viewer turned captions off or the player is an audio player, the first captions or subtitles track, which it loads without drawing it. A video's captions menu changes the language of both.

Each cue is a line, with the time it starts. A cue's tags are left out and its entities read, so `<i>quiet</i>` is "quiet" and `&amp;` is "&".

## Beside a video

The transcript is its own scroll box, 20rem tall at most, which `--nuv-media-transcript-height` changes. Beside a video, as in the example at the top, it's placed over a box as tall as the row, and its height is `none`. Where there isn't room, it goes under the video.

## Following along

As it plays, the line being said is marked, and the transcript scrolls itself, not the page, to keep the line in view. It's left alone while the pointer is over it or the keyboard is in it, so it doesn't move what someone is reading. `follow={false}` marks the line and never scrolls.

A press on a line plays from where it starts.

## Speakers

A `<v>` tag in a cue names who says it, and the transcript shows the name above their first line, and again where the speaker changes:

```txt title="episode-12.en.vtt"
WEBVTT

00:00:00.000 --> 00:00:04.400
<v Ana Costa>Welcome to nuvui radio.

00:00:05.000 --> 00:00:09.400
<v Ben Okafor>Thanks, Ana.
```

## MediaTranscript props

| Prop | Type | Default | What it's for |
| --- | --- | --- | --- |
| `player` (required) | `RefObject<MediaPlayerHandle \| null>` |  | The player whose words it shows: the ref given to its `handleRef`. |
| `follow` | `boolean` | `true` | Keeps the line being said in view as it plays, except while the pointer is over the transcript or the keyboard is in it. |
| `aria-label` | `string` | `"Transcript"` | The transcript's name for a screen reader. |
| `labels` | `Partial<MediaLabels>` |  | The words, to translate it. Its own is `transcript`, its name. |

It also takes the attributes of a `section`, which is what it's drawn as.

## Accessibility

### Keyboard

Only one line is in the Tab order, so the transcript is one stop on the way through the page.

| Key | What it does |
| --- | --- |
| <kbd>↑</kbd> and <kbd>↓</kbd> | The line before and after. |
| <kbd>Home</kbd> and <kbd>End</kbd> | The first line and the last. |
| <kbd>Enter</kbd> or <kbd>Space</kbd> | Plays from the line. |

### What the component handles

- **It's a region named Transcript,** a list of buttons, each with the line's time and words.
- **The line being said is marked with `aria-current="time"`,** and in the theme's color, and in the system's highlight where the browser forces colors.
- **It prints whole,** with no scroll box, for anyone who'd rather read it on paper.

### What you need to handle

- **The captions themselves.** The transcript is as good as the track it reads. A recording with speech needs one, written or checked by a person.
- **What's only seen** in a video, which a transcript of what's said doesn't have. A description track, or the same information on the page.

## CSS variables

| Variable | Default | What it sets |
| --- | --- | --- |
| `--nuv-media-transcript-height` | `20rem` | The most it grows before it scrolls. `none` for as tall as its box. |
| `--nuv-media-transcript-border` | `var(--color-border)` | Color of its border. |
| `--nuv-media-transcript-radius` | `var(--radius-lg)` | Corner radius. |
| `--nuv-media-transcript-bg` | `var(--color-surface)` | Background. |
| `--nuv-media-transcript-fg` | `var(--color-surface-foreground)` | Color of the words. |

## Classes

| Class | What it's on |
| --- | --- |
| `.nuv-media-transcript` | MediaTranscript |
| `.nuv-media-transcript__line` | A line, as a button that plays from it. |
| `.nuv-media-transcript__list` | The list of lines. |
| `.nuv-media-transcript__text` | A line's words. |
| `.nuv-media-transcript__time` | The time a line starts. |
| `.nuv-media-transcript__voice` | A speaker's name, above their lines. |
