import { AspectRatio } from "@nuvui/react";
import "./responsive.css";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <AspectRatio className="hero-media">
        <div
          style={{
            display: "grid",
            placeItems: "center",
            backgroundColor: "var(--color-muted)",
            fontSize: 14,
          }}
        >
          Square on a phone, wide from 640 pixels
        </div>
      </AspectRatio>
    </div>
  );
}
