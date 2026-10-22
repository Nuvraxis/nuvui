"use client";

import { type ModelInfo, ModelViewer } from "@nuvui/3d";
import { FileUpload, Label } from "@nuvui/react";
import { useState } from "react";

const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const isModel = (file: File) => /\.(glb|gltf|stl)$/i.test(file.name);

export default function Example() {
  const [files, setFiles] = useState<File[]>([]);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  // Files join the list as they're picked. The model shown is the one
  // picked last, with the buffers and textures beside it.
  const model = [...files].reverse().find(isModel);
  const shown = model
    ? [model, ...files.filter((file) => !isModel(file))]
    : files;

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <Label htmlFor="model-file">Your model</Label>
      {/* A glTF whose buffers and textures are files of their own is
          picked together with them. */}
      <FileUpload
        id="model-file"
        accept=".glb,.gltf,.stl,.bin,.png,.jpg,.jpeg,.webp,.ktx2"
        multiple
        onFilesChange={(next) => {
          setFiles(next);
          setInfo(null);
        }}
      >
        Drop a GLB, glTF or STL file here, or choose one. It stays in your
        browser.
      </FileUpload>
      {shown.length > 0 && (
        <ModelViewer
          label={model?.name ?? "Your model"}
          src={shown}
          decoders={{ meshopt: true, ktx2: "/docs/basis/" }}
          onLoad={setInfo}
          onError={() => setInfo(null)}
        />
      )}
      {info && (
        <p style={{ margin: 0 }}>
          {info.format.toUpperCase()}, {number.format(info.triangles)}{" "}
          triangles, {info.size.map((side) => number.format(side)).join(" × ")}{" "}
          in its own units.
        </p>
      )}
    </div>
  );
}
