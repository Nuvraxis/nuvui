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
