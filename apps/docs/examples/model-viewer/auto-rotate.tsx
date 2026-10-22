import { ModelViewer } from "@nuvui/3d";

export default function Example() {
  return (
    <ModelViewer
      label="Terracotta vase"
      src="/docs/models/vase.glb"
      poster="/docs/models/vase.webp"
      autoRotate
    />
  );
}
