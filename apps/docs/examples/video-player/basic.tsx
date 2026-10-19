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
