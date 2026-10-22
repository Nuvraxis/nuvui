import "@nuvui/react/styles.css";
import "@nuvui/3d/styles.css";
import { type ModelDecoders, ModelViewer } from "@nuvui/3d";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { REVISION } from "three";

// What each model did, read by check.mjs once all of them have said.
type Result =
  | {
      format: string;
      triangles: number;
      textures: number;
      compressions: string[];
    }
  | { error: string; message: string };
const results: Record<string, Result | string> = { revision: REVISION };
(window as unknown as { results: typeof results }).results = results;

// The models are the package's test models, copied into public/models by
// scripts/test-consumers.mjs.
const models: { name: string; src: string; decoders?: ModelDecoders }[] = [
  { name: "glb", src: "/models/box.glb" },
  { name: "gltf", src: "/models/crate.gltf" },
  { name: "stl", src: "/models/block.stl" },
  {
    name: "meshopt",
    src: "/models/box-meshopt.glb",
    decoders: { meshopt: true },
  },
];

function App() {
  return (
    <main>
      {models.map(({ name, src, decoders }) => (
        <ModelViewer
          key={name}
          label={name}
          src={src}
          decoders={decoders}
          autoRotate
          onLoad={(info) => {
            results[name] = {
              format: info.format,
              triangles: info.triangles,
              textures: info.textures,
              compressions: info.compressions,
            };
          }}
          onError={(error) => {
            results[name] = {
              error: error.code,
              message: String(error.cause ?? error.message),
            };
          }}
        />
      ))}
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
