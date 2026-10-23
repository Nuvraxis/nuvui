"use client";

import { type ModelInfo, ModelViewer, type ModelViewerError } from "@nuvui/3d";
import { Button, FileUpload, Label } from "@nuvui/react";
import { useState } from "react";
import "./model-check.scss";

// Models served by this site, to try the viewer before picking a file.
const samples = [
  { name: "Oak chair", files: "/models/chair.glb" },
  { name: "Gear", files: "/models/gear.stl" },
  { name: "Crate with a KTX2 texture", files: "/models/crate-ktx2.glb" },
];

const isModel = (file: File) => /\.(glb|gltf|stl)$/i.test(file.name);
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const compressions = { meshopt: "Meshopt", ktx2: "KTX2" };
const bytes = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilobyte",
  maximumFractionDigits: 1,
});

export default function ModelCheck() {
  const [picked, setPicked] = useState<File[]>([]);
  const [sample, setSample] = useState(samples[0]);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<ModelViewerError | null>(null);

  // Files join the list as they're picked. The model shown is the one
  // picked last, with the buffers and textures beside it.
  const model = [...picked].reverse().find(isModel);
  const files = model
    ? [model, ...picked.filter((file) => !isModel(file))]
    : picked;
  const name = model?.name ?? (picked.length ? "Your files" : sample?.name);

  return (
    <div className="model-check">
      <header className="model-check__head">
        <h1 className="model-check__title">Check a model</h1>
        <p className="model-check__lead">
          Drop a GLB, glTF or STL file to turn it, zoom in, and see what it's
          made of. The file is read in your browser and isn't sent anywhere.
        </p>
      </header>

      <div className="model-check__body">
        <div className="model-check__pick">
          <Label htmlFor="model-check-files">Your model</Label>
          <FileUpload
            id="model-check-files"
            accept=".glb,.gltf,.stl,.bin,.png,.jpg,.jpeg,.webp,.ktx2"
            multiple
            onFilesChange={(next) => {
              setPicked(next);
              setInfo(null);
              setError(null);
            }}
          >
            Drop a model here, or choose it. Pick a glTF together with its .bin
            and textures.
          </FileUpload>
          {picked.length === 0 && (
            <div className="model-check__samples">
              <p className="model-check__samples-label">Or try one of ours</p>
              <div className="model-check__sample-list">
                {samples.map((item) => (
                  <Button
                    key={item.name}
                    intent={item === sample ? "primary" : "secondary"}
                    size="sm"
                    aria-pressed={item === sample}
                    onClick={() => {
                      setSample(item);
                      setInfo(null);
                      setError(null);
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ModelViewer
          className="model-check__viewer"
          label={name ?? "Model"}
          src={files.length > 0 ? files : (sample?.files ?? "")}
          decoders={{ meshopt: true, ktx2: "/basis/" }}
          onLoad={(loaded) => {
            setInfo(loaded);
            setError(null);
          }}
          onError={(failure) => {
            setInfo(null);
            setError(failure);
          }}
        />

        <section
          className="model-check__facts"
          aria-labelledby="model-check-facts"
          aria-live="polite"
        >
          <h2 id="model-check-facts" className="model-check__heading">
            What's in it
          </h2>
          {info ? (
            <dl className="model-check__list">
              <div className="model-check__row">
                <dt>Format</dt>
                <dd>{info.format.toUpperCase()}</dd>
              </div>
              <div className="model-check__row">
                <dt>Size</dt>
                <dd>
                  {info.size.map((side) => number.format(side)).join(" × ")} in
                  its own units
                </dd>
              </div>
              <div className="model-check__row">
                <dt>Triangles</dt>
                <dd>{number.format(info.triangles)}</dd>
              </div>
              <div className="model-check__row">
                <dt>Meshes</dt>
                <dd>{number.format(info.meshes)}</dd>
              </div>
              <div className="model-check__row">
                <dt>Materials</dt>
                <dd>{number.format(info.materials)}</dd>
              </div>
              <div className="model-check__row">
                <dt>Textures</dt>
                <dd>{number.format(info.textures)}</dd>
              </div>
              <div className="model-check__row">
                <dt>Compressed with</dt>
                <dd>
                  {info.compressions.length
                    ? info.compressions
                        .map((compression) => compressions[compression])
                        .join(" and ")
                    : "Nothing"}
                </dd>
              </div>
              <div className="model-check__row">
                <dt>Files</dt>
                <dd>{bytes.format(info.bytes / 1024)}</dd>
              </div>
            </dl>
          ) : (
            <p className="model-check__empty">
              {error
                ? "The viewer says why it can't show this model."
                : "Loading the model."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
