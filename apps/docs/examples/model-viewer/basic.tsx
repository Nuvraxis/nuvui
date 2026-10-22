import { ModelViewer } from "@nuvui/3d";

export default function Example() {
  return (
    <ModelViewer
      label="Oak chair"
      description="A chair with an oak seat and back on four steel legs."
      src="/docs/models/chair.glb"
      poster="/docs/models/chair.webp"
    />
  );
}
