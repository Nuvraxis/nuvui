"use client";

import { ModelViewer } from "@nuvui/3d";
import { ToggleGroup, ToggleGroupItem } from "@nuvui/react";
import { useState } from "react";

const models = {
  glb: { label: "Desk lamp", src: "/docs/models/lamp.glb" },
  // A .gltf with its buffer and its texture in files beside it.
  gltf: { label: "Pine crate", src: "/docs/models/crate.gltf" },
  // Shape only, in millimeters, drawn in the theme's color.
  stl: { label: "Gear with 18 teeth", src: "/docs/models/gear.stl" },
};

type Format = keyof typeof models;

export default function Example() {
  const [format, setFormat] = useState<Format>("glb");
  const model = models[format];

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <ToggleGroup
        type="single"
        aria-label="Format"
        value={format}
        onValueChange={(value) => value && setFormat(value as Format)}
      >
        <ToggleGroupItem value="glb">GLB</ToggleGroupItem>
        <ToggleGroupItem value="gltf">glTF</ToggleGroupItem>
        <ToggleGroupItem value="stl">STL</ToggleGroupItem>
      </ToggleGroup>
      <ModelViewer label={model.label} src={model.src} />
    </div>
  );
}
