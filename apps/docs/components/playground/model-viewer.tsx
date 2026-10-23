"use client";

import { ModelViewer } from "@nuvui/3d";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const models = {
  "chair.glb": "Oak chair",
  "lamp.glb": "Desk lamp",
  "crate.gltf": "Pine crate",
  "gear.stl": "Gear with 18 teeth",
} as const;
const files = Object.keys(models) as (keyof typeof models)[];

export function ModelViewerPlayground() {
  const [file, setFile] = useState<keyof typeof models>("chair.glb");
  const [autoRotate, setAutoRotate] = useState(false);
  const [controls, setControls] = useState(true);
  const [interactive, setInteractive] = useState(true);

  const code = `<ModelViewer
  label="${models[file]}"
  src="/models/${file}"${autoRotate ? "\n  autoRotate" : ""}${controls ? "" : "\n  controls={false}"}${interactive ? "" : "\n  interactive={false}"}
/>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="src"
            value={file}
            options={files}
            onChange={setFile}
          />
          <CheckboxControl
            label="autoRotate"
            checked={autoRotate}
            onChange={setAutoRotate}
          />
          <CheckboxControl
            label="controls"
            checked={controls}
            onChange={setControls}
          />
          <CheckboxControl
            label="interactive"
            checked={interactive}
            onChange={setInteractive}
          />
        </>
      }
    >
      <ModelViewer
        label={models[file]}
        src={`/docs/models/${file}`}
        autoRotate={autoRotate}
        controls={controls}
        interactive={interactive}
      />
    </Playground>
  );
}
