// react-three-fiber's elements, such as <mesh>, are typed by its own
// types. Referred to like this, they're typed without loading it here.
/// <reference types="@react-three/fiber" />
"use client";

import { ModelViewer, type ModelViewerCamera } from "@nuvui/3d";
import { Badge, type BadgeProps } from "@nuvui/react";
import { useState } from "react";
import "./part-notes.scss";

type Status = "open" | "watch" | "done";

// Made-up notes from an inspection. `at` is where each is on the pump, in
// the model's own units, which are meters, and `view` where the camera
// goes to see it.
const notes: {
  id: number;
  part: string;
  text: string;
  status: Status;
  at: [number, number, number];
  view: ModelViewerCamera;
}[] = [
  {
    id: 1,
    part: "Outlet",
    text: "The seal weeps under full pressure. Replace it at the next stop.",
    status: "open",
    at: [0.15, 0.335, 0],
    view: { azimuth: 25, elevation: 35, distance: 0.8 },
  },
  {
    id: 2,
    part: "Motor",
    text: "A bearing hums above 2,800 rpm. Listen again in a week.",
    status: "watch",
    at: [-0.12, 0.13, 0.14],
    view: { azimuth: -35, elevation: 10, distance: 0.8 },
  },
  {
    id: 3,
    part: "Pump body",
    text: "Paint chipped on the side toward the wall. No rust yet.",
    status: "watch",
    at: [0.255, 0.11, 0],
    view: { azimuth: 80, elevation: 10, distance: 0.8 },
  },
  {
    id: 4,
    part: "Fan cover",
    text: "Cleaned of dust, and the grille is whole.",
    status: "done",
    at: [-0.12, 0.13, -0.17],
    view: { azimuth: 200, elevation: 15, distance: 0.8 },
  },
];

const statuses: Record<
  Status,
  { label: string; intent: BadgeProps["intent"] }
> = {
  open: { label: "To fix", intent: "danger" },
  watch: { label: "Watching", intent: "warning" },
  done: { label: "Done", intent: "success" },
};

// The markers' colors are a picture's, as the model's are: the one chosen,
// and the rest.
const chosenColor = "#e11d48";
const otherColor = "#f59e0b";

export default function PartNotes() {
  const [active, setActive] = useState(1);
  const chosen = notes.find((note) => note.id === active) ?? notes[0];

  return (
    <div className="part-notes">
      <header className="part-notes__head">
        <p className="part-notes__eyebrow">Inspection, line 2</p>
        <h1 className="part-notes__title">Feed pump P-204</h1>
      </header>

      <div className="part-notes__body">
        <ModelViewer
          className="part-notes__viewer"
          label="Feed pump P-204, with numbered notes on its parts"
          description={notes
            .map((note) => `${note.id}, ${note.part}: ${note.text}`)
            .join(" ")}
          src="/models/pump.glb"
          poster="/models/pump.webp"
          camera={chosen?.view}
        >
          {notes.map((note) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: a mesh is drawn in the scene, not an element on the page. The list beside it is what the keys reach.
            <mesh
              key={note.id}
              position={note.at}
              onClick={(event) => {
                event.stopPropagation();
                setActive(note.id);
              }}
            >
              <sphereGeometry
                args={[note.id === active ? 0.018 : 0.012, 24, 16]}
              />
              <meshBasicMaterial
                color={note.id === active ? chosenColor : otherColor}
              />
            </mesh>
          ))}
        </ModelViewer>

        <section
          className="part-notes__notes"
          aria-labelledby="part-notes-list"
        >
          <h2 id="part-notes-list" className="part-notes__heading">
            Notes
          </h2>
          <ol className="part-notes__list">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  className="part-notes__note"
                  aria-pressed={note.id === active}
                  onClick={() => setActive(note.id)}
                >
                  <span className="part-notes__number" aria-hidden="true">
                    {note.id}
                  </span>
                  <span className="part-notes__text">
                    <span className="part-notes__part">{note.part}</span>
                    <span>{note.text}</span>
                  </span>
                  <Badge intent={statuses[note.status].intent}>
                    {statuses[note.status].label}
                  </Badge>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
