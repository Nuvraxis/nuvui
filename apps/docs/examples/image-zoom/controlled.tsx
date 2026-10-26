"use client";

import { ImageZoom, Switch } from "@nuvui/react";
import { useState } from "react";
import { floorPlan } from "./pictures";

export default function Example() {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Switch
          id="plan-close-up"
          checked={zoomed}
          onCheckedChange={setZoomed}
        />
        <label htmlFor="plan-close-up">Show the plan close up</label>
      </div>
      <ImageZoom hover={false} zoomed={zoomed} onZoomedChange={setZoomed}>
        <img
          src={floorPlan}
          alt="Floor plan of flat 4B: a living room, kitchen, dining area, bathroom, hall and bedroom"
        />
      </ImageZoom>
    </div>
  );
}
