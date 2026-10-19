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
