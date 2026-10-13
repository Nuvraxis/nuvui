"use client";

import { MapControls, MapMarker, MapView } from "@nuvui/map";
import { useState } from "react";
import { CheckboxControl, Playground, SelectControl } from "./controls";

const style = "https://tiles.openfreemap.org/styles/liberty";
const corners = ["top-end", "top-start", "bottom-start", "bottom-end"] as const;

export function MapViewPlayground() {
  const [position, setPosition] = useState<(typeof corners)[number]>("top-end");
  const [compass, setCompass] = useState(false);
  const [locate, setLocate] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [draggable, setDraggable] = useState(false);
  const [gestures, setGestures] = useState(true);

  const controls = [
    position === "top-end" ? "" : ` position="${position}"`,
    compass ? " compass" : "",
    locate ? " locate" : "",
    fullscreen ? " fullscreen" : "",
  ].join("");
  const code = `<MapView
  aria-label="Office"
  mapStyle={style}
  defaultCenter={[13.3888, 52.5105]}
  defaultZoom={13}${gestures ? "\n  cooperativeGestures" : ""}
>
  <MapMarker position={[13.3888, 52.5105]} label="Berlin office"${draggable ? " draggable" : ""} />
  <MapControls${controls} />
</MapView>`;

  return (
    <Playground
      code={code}
      controls={
        <>
          <SelectControl
            label="position"
            value={position}
            options={corners}
            onChange={setPosition}
          />
          <CheckboxControl
            label="compass"
            checked={compass}
            onChange={setCompass}
          />
          <CheckboxControl
            label="locate"
            checked={locate}
            onChange={setLocate}
          />
          <CheckboxControl
            label="fullscreen"
            checked={fullscreen}
            onChange={setFullscreen}
          />
          <CheckboxControl
            label="draggable"
            checked={draggable}
            onChange={setDraggable}
          />
          <CheckboxControl
            label="cooperativeGestures"
            checked={gestures}
            onChange={setGestures}
          />
        </>
      }
    >
      {/* cooperativeGestures is read when the map is first drawn, so a
          change to it draws the map again. */}
      <MapView
        key={String(gestures)}
        aria-label="Office"
        mapStyle={style}
        defaultCenter={[13.3888, 52.5105]}
        defaultZoom={13}
        cooperativeGestures={gestures}
      >
        <MapMarker
          position={[13.3888, 52.5105]}
          label="Berlin office"
          draggable={draggable}
        />
        <MapControls
          position={position}
          compass={compass}
          locate={locate}
          fullscreen={fullscreen}
        />
      </MapView>
    </Playground>
  );
}
