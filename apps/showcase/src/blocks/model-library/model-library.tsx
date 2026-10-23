"use client";

import { ModelViewer } from "@nuvui/3d";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@nuvui/react";
import { useState } from "react";
import "./model-library.scss";

// The site's models, as a studio's library would list its own. Only the
// one that's opened is loaded, with three, so the grid is pictures alone.
const models = [
  {
    id: "chair",
    name: "Oak chair",
    detail: "Seat, back and four steel legs",
    size: "46 × 92 × 44 cm",
    updated: "Updated 12 October",
  },
  {
    id: "lamp",
    name: "Arc desk lamp",
    detail: "Weighted base, two arms, a shade",
    size: "45 × 37 × 22 cm",
    updated: "Updated 9 October",
  },
  {
    id: "mug",
    name: "Glazed mug",
    detail: "Turned body with a handle",
    size: "12 × 10 × 8 cm",
    updated: "Updated 2 October",
  },
  {
    id: "pump",
    name: "Feed pump P-204",
    detail: "Motor, pump body and outlet on a plate",
    size: "60 × 33 × 32 cm",
    updated: "Updated 28 September",
  },
  {
    id: "vase",
    name: "Terracotta vase",
    detail: "Turned, with a flared neck",
    size: "17 × 28 × 17 cm",
    updated: "Updated 21 September",
  },
];

export default function ModelLibrary() {
  const [open, setOpen] = useState<string | null>(null);
  const shown = models.find((model) => model.id === open);

  return (
    <div className="model-library">
      <header className="model-library__head">
        <div>
          <h1 className="model-library__title">Models</h1>
          <p className="model-library__lead">
            {models.length} models in the library, all GLB.
          </p>
        </div>
        <Button intent="secondary">Upload a model</Button>
      </header>

      <ul className="model-library__grid">
        {models.map((model) => (
          <li key={model.id} className="model-library__card">
            {/* biome-ignore lint/performance/noImgElement: a block is copied into any React app, and not only into Next.js. */}
            <img
              className="model-library__picture"
              src={`/models/${model.id}.webp`}
              alt=""
              width={960}
              height={720}
              loading="lazy"
            />
            <div className="model-library__info">
              <h2 className="model-library__name">{model.name}</h2>
              <p className="model-library__detail">{model.detail}</p>
              <div className="model-library__meta">
                <Badge>GLB</Badge>
                <span>{model.size}</span>
              </div>
              <p className="model-library__updated">{model.updated}</p>
            </div>
            <Button
              intent="secondary"
              size="sm"
              className="model-library__open"
              aria-label={`View ${model.name} in 3D`}
              onClick={() => setOpen(model.id)}
            >
              View in 3D
            </Button>
          </li>
        ))}
      </ul>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => !next && setOpen(null)}
      >
        <DialogContent className="model-library__dialog">
          <DialogHeader>
            <DialogTitle>{shown?.name}</DialogTitle>
            <DialogDescription>
              {shown?.detail}, {shown?.size}. Drag or use the arrow keys to turn
              it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {shown && (
              <ModelViewer
                className="model-library__viewer"
                label={shown.name}
                src={`/models/${shown.id}.glb`}
                poster={`/models/${shown.id}.webp`}
              />
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
