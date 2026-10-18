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
