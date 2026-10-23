// react-three-fiber's elements, such as <mesh>, are typed by its own
// types. Referred to like this, they're typed without loading it here.
/// <reference types="@react-three/fiber" />
"use client";

import { ModelViewer } from "@nuvui/3d";
import { useState } from "react";

// Places on the pump, in the model's own units, which are meters.
const notes = [
  { id: 1, at: [0.15, 0.33, 0] as const, text: "Outlet: check the seal" },
  { id: 2, at: [-0.12, 0.23, -0.02] as const, text: "Motor: due for service" },
  { id: 3, at: [0.25, 0.11, 0] as const, text: "Pump body: paint chipped" },
];

export default function Example() {
  const [active, setActive] = useState(1);

  return (
    <div style={{ display: "grid", gap: 12, inlineSize: "100%" }}>
      <ModelViewer
        label="Pump with three notes on it"
        description={notes.map((note) => `${note.id}. ${note.text}`).join(" ")}
        src="/docs/models/pump.glb"
      >
        {/* react-three-fiber elements, drawn with the model. */}
        {notes.map((note) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: a mesh is drawn in the scene, not an element on the page. The list below is what the keys reach.
          <mesh
            key={note.id}
            position={note.at}
            onClick={() => setActive(note.id)}
          >
            <sphereGeometry
              args={[note.id === active ? 0.02 : 0.014, 24, 16]}
            />
            <meshBasicMaterial
              color={note.id === active ? "#e11d48" : "#f59e0b"}
            />
          </mesh>
        ))}
      </ModelViewer>
      <ol style={{ margin: 0, paddingInlineStart: 20 }}>
        {notes.map((note) => (
          <li key={note.id}>
            <button
              type="button"
              aria-pressed={note.id === active}
              onClick={() => setActive(note.id)}
              style={{
                font: "inherit",
                fontWeight: note.id === active ? 600 : 400,
                background: "none",
                border: 0,
                padding: "4px 0",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              {note.text}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
