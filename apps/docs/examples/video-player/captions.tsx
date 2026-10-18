import { VideoPlayer } from "@nuvui/media/video-player";

export default function Example() {
  return (
    <VideoPlayer
      title="Captions in two languages"
      src="/docs/clips/demo-720.mp4"
      poster="/docs/clips/poster.jpg"
      tracks={[
        {
          kind: "captions",
          src: "/docs/clips/captions.en.vtt",
          srcLang: "en",
          label: "English",
          default: true,
        },
        {
          kind: "subtitles",
          src: "/docs/clips/captions.es.vtt",
          srcLang: "es",
          label: "Español",
        },
      ]}
    />
  );
}
