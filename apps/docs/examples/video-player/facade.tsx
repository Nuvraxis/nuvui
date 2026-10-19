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
