"use client";

import { ModelViewer, type ModelViewerCamera } from "@nuvui/3d";
import { Button } from "@nuvui/react";
import { useState } from "react";

const views: Record<string, ModelViewerCamera> = {
  Front: { azimuth: 0, elevation: 0 },
  Side: { azimuth: 90, elevation: 0 },
  Above: { azimuth: 0, elevation: 80 },
  Close: { azimuth: 30, elevation: 15, distance: 0.6 },
};

export default function Example() {
  const [view, setView] = useState("Front");

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {Object.keys(views).map((name) => (
          <Button
            key={name}
            intent={name === view ? "primary" : "secondary"}
            size="sm"
            aria-pressed={name === view}
            onClick={() => setView(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      <ModelViewer
        label="Pump"
        src="/docs/models/pump.glb"
        camera={views[view]}
      />
    </div>
  );
}
