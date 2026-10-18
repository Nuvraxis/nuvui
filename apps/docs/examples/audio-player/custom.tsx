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
      title="Demo track"
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
