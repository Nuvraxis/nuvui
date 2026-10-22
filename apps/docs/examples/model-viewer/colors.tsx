import { ModelViewer } from "@nuvui/3d";
import type { CSSProperties } from "react";

// An STL has no colors of its own. It's drawn in --nuv-model-viewer-model,
// which is the theme's primary color unless it's set.
const colors = {
  inlineSize: "100%",
  "--nuv-model-viewer-model": "var(--color-success)",
  "--nuv-model-viewer-height": "18rem",
} as CSSProperties;

export default function Example() {
  return (
    <div style={colors}>
      <ModelViewer
        label="L-shaped bracket, 40 by 30 millimeters"
        src="/docs/models/bracket.stl"
      />
    </div>
  );
}
