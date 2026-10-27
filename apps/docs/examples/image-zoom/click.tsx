import { ImageZoom } from "@nuvui/react";
import { floorPlan } from "./pictures";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 560 }}>
      <ImageZoom hover={false} scale={3}>
        <img
          src={floorPlan}
          alt="Floor plan of flat 4B: a living room, kitchen, dining area, bathroom, hall and bedroom"
        />
      </ImageZoom>
    </div>
  );
}
