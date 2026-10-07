import { AspectRatio } from "@nuvui/react";

// A picture kept in the file, so the example doesn't depend on another site.
const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23bfdbfe'/%3E%3Ccircle cx='300' cy='80' r='36' fill='%23fde68a'/%3E%3Cpath d='M0 300l120-150 80 90 60-60 140 120z' fill='%231e3a8a'/%3E%3C/svg%3E";

export default function Example() {
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <AspectRatio ratio={16 / 9} style={{ borderRadius: "var(--radius-lg)" }}>
        <img src={picture} alt="Mountains under a low sun" />
      </AspectRatio>
    </div>
  );
}
